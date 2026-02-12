/**
 * API endpoint: Parse CV using Arbetsförmedlingen's JobAd Enrichments API
 * POST /api/parse-cv-af { text: "CV content..." }
 *
 * Benefits over Claude:
 * - Free API (no API key needed)
 * - Official AF concept_ids for skill matching
 * - Trained specifically on Swedish job market texts
 * - Direct integration with Platsbanken job matching
 */

const fs = require('fs');
const path = require('path');

const ENRICHMENTS_API = 'https://jobad-enrichments.api.jobtechdev.se/enrich';

// Cache for processed data
let skills = null;
let sunEducation = null;
let skillToEducation = null;

function loadData() {
    const processedDir = path.join(process.cwd(), 'data/processed');
    const rawDir = path.join(process.cwd(), 'data/raw/taxonomy');

    // Load skills taxonomy
    if (!skills) {
        skills = JSON.parse(fs.readFileSync(path.join(processedDir, 'skills.json'), 'utf8'));
    }

    // Load SUN education hierarchy
    if (!sunEducation) {
        try {
            const sunData = JSON.parse(fs.readFileSync(path.join(rawDir, 'sun-level-hierarchy.json'), 'utf8'));
            sunEducation = flattenSunHierarchy(sunData.data.concepts);
        } catch (e) {
            console.warn('Could not load SUN education data:', e.message);
            sunEducation = [];
        }
    }

    // Load skill-to-education mapping if available
    if (!skillToEducation) {
        try {
            skillToEducation = JSON.parse(fs.readFileSync(path.join(processedDir, 'skill-education-map.json'), 'utf8'));
        } catch (e) {
            skillToEducation = {};
        }
    }
}

function flattenSunHierarchy(concepts, result = []) {
    for (const concept of concepts) {
        result.push({
            id: concept.id,
            label: concept.preferred_label,
            code: concept.sun_education_level_code_2020,
            type: concept.type,
            definition: concept.definition
        });
        if (concept.narrower) {
            flattenSunHierarchy(concept.narrower, result);
        }
    }
    return result;
}

async function parseWithAFEnrichments(cvText) {
    const response = await fetch(ENRICHMENTS_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ text: cvText.substring(0, 10000) })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AF Enrichments API error: ${response.status} - ${errorText}`);
    }

    return response.json();
}

function categorizeSkills(enrichedSkills) {
    const categories = {
        programming: [],
        tools: [],
        languages: [],
        methods: [],
        soft_skills: [],
        other: []
    };

    const programmingKeywords = ['programmering', 'utveckling', 'python', 'java', 'javascript', 'c++', 'c#', '.net', 'sql', 'html', 'css', 'react', 'angular', 'vue', 'node'];
    const toolKeywords = ['excel', 'word', 'powerpoint', 'office', 'adobe', 'photoshop', 'autocad', 'sap', 'salesforce', 'jira', 'git'];
    const methodKeywords = ['agil', 'scrum', 'kanban', 'lean', 'projektledning', 'prince2', 'itil'];
    const softSkillKeywords = ['kommunikation', 'ledarskap', 'teamwork', 'samarbete', 'problemlösning', 'analytisk'];

    for (const skill of enrichedSkills) {
        const termLower = (skill.term || '').toLowerCase();

        if (programmingKeywords.some(kw => termLower.includes(kw))) {
            categories.programming.push(skill);
        } else if (toolKeywords.some(kw => termLower.includes(kw))) {
            categories.tools.push(skill);
        } else if (methodKeywords.some(kw => termLower.includes(kw))) {
            categories.methods.push(skill);
        } else if (softSkillKeywords.some(kw => termLower.includes(kw))) {
            categories.soft_skills.push(skill);
        } else {
            categories.other.push(skill);
        }
    }

    return categories;
}

function getEducationRecommendations(missingSkills) {
    if (!sunEducation || sunEducation.length === 0) {
        return [];
    }

    const recommendations = [];

    // Map skill gaps to education types
    const skillEducationMap = {
        // Tech skills -> YH or Högskola
        'programming': { type: 'YH/Högskola', levels: ['52', '53'] },
        'utveckling': { type: 'YH/Högskola', levels: ['52', '53'] },
        'projektledning': { type: 'YH/Kortare kurs', levels: ['41', '52'] },
        'agil': { type: 'Kurs/Certifiering', levels: ['41'] },
        'scrum': { type: 'Certifiering', levels: ['41'] },
        'data': { type: 'Högskoleutbildning', levels: ['53', '54'] }
    };

    for (const skill of missingSkills.slice(0, 5)) {
        const termLower = (skill.term || skill).toLowerCase();
        let educationType = null;

        for (const [keyword, eduInfo] of Object.entries(skillEducationMap)) {
            if (termLower.includes(keyword)) {
                educationType = eduInfo;
                break;
            }
        }

        if (educationType) {
            const matchingEducation = sunEducation.filter(edu =>
                educationType.levels.some(level => edu.code?.startsWith(level))
            );

            if (matchingEducation.length > 0) {
                recommendations.push({
                    skill: skill.term || skill,
                    educationType: educationType.type,
                    options: matchingEducation.slice(0, 3).map(edu => ({
                        name: edu.label,
                        code: edu.code,
                        description: edu.definition?.substring(0, 200)
                    }))
                });
            }
        }
    }

    return recommendations;
}

function estimateExperience(cvText) {
    // Simple heuristic based on year patterns
    const yearPattern = /\b(19|20)\d{2}\b/g;
    const years = cvText.match(yearPattern) || [];

    if (years.length < 2) return null;

    const numericYears = years.map(y => parseInt(y)).filter(y => y >= 1980 && y <= 2030);
    if (numericYears.length < 2) return null;

    const minYear = Math.min(...numericYears);
    const maxYear = Math.max(...numericYears);
    const currentYear = new Date().getFullYear();

    // Estimate: from first job to now (or last mentioned year)
    const careerStart = minYear > 1990 ? minYear : null;
    if (careerStart) {
        return Math.min(currentYear - careerStart, 40);
    }

    return maxYear - minYear;
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

        console.log('Parsing CV with AF Enrichments API...');
        const enrichments = await parseWithAFEnrichments(text);

        // Extract and format skills with concept_ids
        const extractedSkills = (enrichments.skills || []).map(s => ({
            term: s.term,
            concept_id: s.concept_id,
            prediction: s.prediction
        }));

        // Extract occupations (what roles the CV suggests)
        const suggestedOccupations = (enrichments.occupations || []).map(o => ({
            term: o.term,
            concept_id: o.concept_id,
            prediction: o.prediction
        }));

        // Extract languages
        const languages = (enrichments.languages || []).map(l => ({
            term: l.term,
            concept_id: l.concept_id
        }));

        // Categorize skills
        const skillCategories = categorizeSkills(extractedSkills);

        // Estimate experience from CV text
        const experienceYears = estimateExperience(text);

        // Match skills against our taxonomy for validation
        const matchedSkills = [];
        const unmatchedSkills = [];

        for (const skill of extractedSkills) {
            const taxonomyMatch = skills[skill.concept_id];
            if (taxonomyMatch) {
                matchedSkills.push({
                    ...skill,
                    taxonomyName: taxonomyMatch.name
                });
            } else {
                unmatchedSkills.push(skill);
            }
        }

        const result = {
            extracted: {
                skills: extractedSkills,
                skillCategories,
                occupations: suggestedOccupations,
                languages,
                experienceYears
            },
            matched: {
                skills: matchedSkills,
                unmatchedSkills
            },
            meta: {
                cvLength: text.length,
                processingEngine: 'AF JobAd Enrichments API',
                taxonomySource: 'Arbetsförmedlingen JobTech',
                skillCount: extractedSkills.length,
                occupationCount: suggestedOccupations.length,
                isFree: true
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
