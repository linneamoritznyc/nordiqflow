/**
 * API endpoint: Parse CV text and extract occupation + skills using LLM
 * POST /api/parse-cv { text: "CV content..." }
 *
 * Requires OPENAI_API_KEY environment variable
 */

const fs = require('fs');
const path = require('path');

// Load occupation data for matching
let searchIndex = null;
let skills = null;

function loadData() {
    const dataDir = path.join(process.cwd(), 'data/processed');
    if (!searchIndex) {
        searchIndex = JSON.parse(fs.readFileSync(path.join(dataDir, 'search-index.json'), 'utf8'));
    }
    if (!skills) {
        skills = JSON.parse(fs.readFileSync(path.join(dataDir, 'skills.json'), 'utf8'));
    }
}

async function parseWithOpenAI(cvText) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable not set');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Du är en expert på den svenska arbetsmarknaden och SSYK-klassificering.
Analysera CV:t och extrahera:
1. Den mest troliga yrkesbenämningen (enligt svenska yrkestitlar)
2. Alla identifierade kompetenser/skills
3. Antal års erfarenhet
4. Utbildningsnivå

Svara ENDAST med JSON i följande format:
{
  "occupation": "Yrkestitel på svenska",
  "occupation_alternatives": ["Alternativ titel 1", "Alternativ titel 2"],
  "skills": ["Kompetens 1", "Kompetens 2", ...],
  "experience_years": 5,
  "education_level": "Högskoleutbildning",
  "summary": "Kort sammanfattning av profilen"
}`
                },
                {
                    role: 'user',
                    content: `Analysera detta CV:\n\n${cvText.substring(0, 8000)}`
                }
            ],
            temperature: 0.3,
            max_tokens: 1000
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON from response
    try {
        // Handle markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
        return JSON.parse(jsonMatch[1].trim());
    } catch (e) {
        console.error('Failed to parse LLM response:', content);
        throw new Error('Failed to parse LLM response as JSON');
    }
}

function matchOccupation(occupationName) {
    const nameLower = occupationName.toLowerCase();

    // Exact match
    let match = searchIndex.find(o => o.nameLower === nameLower);
    if (match) return match;

    // Partial match
    match = searchIndex.find(o => o.nameLower.includes(nameLower) || nameLower.includes(o.nameLower));
    if (match) return match;

    // Word-based match
    const words = nameLower.split(/\s+/);
    match = searchIndex.find(o => words.some(w => w.length > 3 && o.nameLower.includes(w)));

    return match || null;
}

function matchSkills(extractedSkills) {
    const skillValues = Object.values(skills);
    const matched = [];
    const unmatched = [];

    extractedSkills.forEach(skill => {
        const skillLower = skill.toLowerCase();
        const match = skillValues.find(s =>
            s.name.toLowerCase() === skillLower ||
            s.name.toLowerCase().includes(skillLower) ||
            skillLower.includes(s.name.toLowerCase())
        );

        if (match) {
            matched.push({ extracted: skill, matched: match.name, id: match.id });
        } else {
            unmatched.push(skill);
        }
    });

    return { matched, unmatched };
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    try {
        loadData();

        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { text } = body;

        if (!text || text.trim().length < 50) {
            return res.status(400).json({
                error: 'CV text is required and must be at least 50 characters',
                hint: 'POST { "text": "Your CV content here..." }'
            });
        }

        // Check for API key
        if (!process.env.OPENAI_API_KEY) {
            return res.status(503).json({
                error: 'CV parsing service not configured',
                hint: 'OPENAI_API_KEY environment variable must be set'
            });
        }

        // Parse CV with LLM
        console.log('Parsing CV with OpenAI...');
        const extracted = await parseWithOpenAI(text);

        // Match occupation against taxonomy
        const occupationMatch = matchOccupation(extracted.occupation);
        const alternativeMatches = (extracted.occupation_alternatives || [])
            .map(alt => matchOccupation(alt))
            .filter(Boolean);

        // Match skills against taxonomy
        const skillsAnalysis = matchSkills(extracted.skills || []);

        const result = {
            extracted: {
                occupation: extracted.occupation,
                skills: extracted.skills,
                experience_years: extracted.experience_years,
                education_level: extracted.education_level,
                summary: extracted.summary
            },
            matched: {
                occupation: occupationMatch ? {
                    id: occupationMatch.id,
                    name: occupationMatch.name,
                    ssykCode: occupationMatch.ssykCode,
                    ssykLabel: occupationMatch.ssykLabel
                } : null,
                alternativeOccupations: alternativeMatches.map(m => ({
                    id: m.id,
                    name: m.name,
                    ssykCode: m.ssykCode
                })),
                skills: skillsAnalysis.matched,
                unmatchedSkills: skillsAnalysis.unmatched
            },
            meta: {
                cvLength: text.length,
                processingModel: 'gpt-4o-mini',
                taxonomySource: 'Arbetsförmedlingen JobTech'
            }
        };

        return res.json(result);

    } catch (error) {
        console.error('Error parsing CV:', error);
        return res.status(500).json({
            error: 'Failed to parse CV',
            details: error.message
        });
    }
};
