/**
 * API endpoint: Parse CV text and extract occupation + skills using Claude
 * POST /api/parse-cv { text: "CV content..." }
 *
 * Requires ANTHROPIC_API_KEY environment variable
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

async function parseWithClaude(cvText) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable not set');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: `Du är en expert på den svenska arbetsmarknaden och SSYK-klassificering.
Analysera CV:t nedan och extrahera:
1. Den mest troliga yrkesbenämningen (enligt svenska yrkestitlar)
2. Alla identifierade kompetenser/skills
3. Antal års erfarenhet
4. Utbildningsnivå

Svara ENDAST med JSON i följande format (ingen markdown, bara ren JSON):
{
  "occupation": "Yrkestitel på svenska",
  "occupation_alternatives": ["Alternativ titel 1", "Alternativ titel 2"],
  "skills": ["Kompetens 1", "Kompetens 2"],
  "experience_years": 5,
  "education_level": "Högskoleutbildning",
  "summary": "Kort sammanfattning av profilen"
}

CV:
${cvText.substring(0, 8000)}`
                }
            ]
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse JSON from response
    try {
        // Handle markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
        return JSON.parse(jsonMatch[1].trim());
    } catch (e) {
        console.error('Failed to parse Claude response:', content);
        throw new Error('Failed to parse Claude response as JSON');
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
        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(503).json({
                error: 'CV parsing service not configured',
                hint: 'ANTHROPIC_API_KEY environment variable must be set'
            });
        }

        // Parse CV with Claude
        console.log('Parsing CV with Claude...');
        const extracted = await parseWithClaude(text);

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
                processingModel: 'claude-3-5-sonnet-20241022',
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
