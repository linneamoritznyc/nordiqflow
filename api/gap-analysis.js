/**
 * API endpoint: Gap Analysis - identify missing skills and recommend education
 * POST /api/gap-analysis {
 *   user_skills: ["python", "excel", "projektledning"],
 *   target_occupation: "Data Analyst"
 * }
 *
 * Returns:
 * - Skill match percentage
 * - Missing skills for target role
 * - Education recommendations linked to SUN codes
 * - Time/effort estimate to close gaps
 */

const fs = require('fs');
const path = require('path');

let occupations = null;
let skills = null;
let skillEducationMap = null;

function loadData() {
    const dataDir = path.join(process.cwd(), 'data/processed');

    if (!occupations) {
        occupations = JSON.parse(fs.readFileSync(path.join(dataDir, 'occupations.json'), 'utf8'));
    }
    if (!skills) {
        skills = JSON.parse(fs.readFileSync(path.join(dataDir, 'skills.json'), 'utf8'));
    }
    if (!skillEducationMap) {
        try {
            skillEducationMap = JSON.parse(fs.readFileSync(path.join(dataDir, 'skill-education-map.json'), 'utf8'));
        } catch (e) {
            skillEducationMap = { skillCategories: {}, commonSkillMappings: {} };
        }
    }
}

// Typical skills required for common occupation categories
const occupationRequirements = {
    // IT & Tech
    'systemutvecklare': ['programmering', 'agil', 'problemlösning', 'teamarbete', 'databaser', 'git'],
    'data analyst': ['excel', 'sql', 'python', 'statistik', 'visualisering', 'analys'],
    'projektledare': ['projektledning', 'ledarskap', 'kommunikation', 'budget', 'planering', 'agil'],
    'webbutvecklare': ['html', 'css', 'javascript', 'react', 'nodejs', 'git'],
    'it-chef': ['ledarskap', 'it-strategi', 'budget', 'projektledning', 'kommunikation'],

    // Business
    'butikschef': ['ledarskap', 'kundservice', 'budget', 'personalansvar', 'försäljning'],
    'verksamhetsledare': ['ledarskap', 'ekonomi', 'personalansvar', 'verksamhetsutveckling', 'kommunikation'],
    'ekonomichef': ['ekonomi', 'redovisning', 'budget', 'ledarskap', 'analys', 'rapportering'],
    'hr-chef': ['ledarskap', 'personalfrågor', 'arbetsrätt', 'rekrytering', 'kommunikation'],
    'marknadschef': ['marknadsföring', 'strategi', 'digital marknadsföring', 'ledarskap', 'analys'],

    // Healthcare
    'sjuksköterska': ['omvårdnad', 'medicinsk kunskap', 'kommunikation', 'teamarbete', 'dokumentation'],
    'läkare': ['medicinsk kunskap', 'diagnostik', 'kommunikation', 'beslutsfattande', 'ledarskap'],

    // Default fallback
    'default': ['kommunikation', 'teamarbete', 'problemlösning', 'digital kompetens']
};

function normalizeSkill(skill) {
    return skill.toLowerCase().trim();
}

function getRequiredSkills(occupationName) {
    const nameLower = normalizeSkill(occupationName);

    // Try exact match
    for (const [key, skills] of Object.entries(occupationRequirements)) {
        if (nameLower === key || nameLower.includes(key) || key.includes(nameLower)) {
            return skills;
        }
    }

    // Try partial match on words
    const words = nameLower.split(/\s+/);
    for (const word of words) {
        for (const [key, skills] of Object.entries(occupationRequirements)) {
            if (key.includes(word) && word.length > 3) {
                return skills;
            }
        }
    }

    return occupationRequirements['default'];
}

function categorizeSkill(skill) {
    const skillLower = normalizeSkill(skill);

    // Use common skill mappings
    for (const [skillKey, category] of Object.entries(skillEducationMap.commonSkillMappings || {})) {
        if (skillLower.includes(skillKey) || skillKey.includes(skillLower)) {
            return category;
        }
    }

    // Fallback categorization
    const techSkills = ['python', 'java', 'javascript', 'sql', 'programmering', 'utveckling', 'html', 'css', 'react', 'git'];
    const dataSkills = ['excel', 'data', 'analys', 'statistik', 'power bi', 'tableau', 'visualisering'];
    const leadershipSkills = ['ledarskap', 'projektledning', 'teamledning', 'personalansvar'];
    const marketingSkills = ['marknadsföring', 'seo', 'sem', 'google ads', 'sociala medier'];

    if (techSkills.some(t => skillLower.includes(t))) return 'programming';
    if (dataSkills.some(t => skillLower.includes(t))) return 'dataAnalysis';
    if (leadershipSkills.some(t => skillLower.includes(t))) return 'leadership';
    if (marketingSkills.some(t => skillLower.includes(t))) return 'marketing';

    return null;
}

function getEducationRecommendations(missingSkills) {
    const recommendations = [];

    for (const skill of missingSkills) {
        const category = categorizeSkill(skill);

        if (category && skillEducationMap.skillCategories[category]) {
            const eduInfo = skillEducationMap.skillCategories[category];
            recommendations.push({
                skill: skill,
                category: category,
                sunFieldCode: eduInfo.sunFieldCode,
                sunFieldName: eduInfo.sunFieldName,
                educationOptions: eduInfo.educationTypes.map(edu => ({
                    type: edu.type,
                    name: edu.name,
                    duration: edu.duration,
                    examples: edu.examples.slice(0, 2)
                }))
            });
        } else {
            // Generic recommendation
            recommendations.push({
                skill: skill,
                category: 'general',
                educationOptions: [
                    { type: 'Kurs', name: 'Kortare kurs/certifiering', duration: '1-4 veckor', examples: [] },
                    { type: 'Självstudier', name: 'Online-kurs', duration: '2-8 veckor', examples: ['LinkedIn Learning', 'Coursera'] }
                ]
            });
        }
    }

    return recommendations;
}

function estimateGapClosureTime(missingSkills) {
    // Rough estimates based on skill types
    let totalWeeks = 0;

    for (const skill of missingSkills) {
        const category = categorizeSkill(skill);

        switch (category) {
            case 'programming':
                totalWeeks += 16; // ~4 months for programming skill
                break;
            case 'dataAnalysis':
                totalWeeks += 8; // ~2 months for data skills
                break;
            case 'projectManagement':
                totalWeeks += 4; // ~1 month for PM certification
                break;
            case 'leadership':
                totalWeeks += 2; // ~2 weeks for leadership course
                break;
            default:
                totalWeeks += 4; // Default ~1 month
        }
    }

    // Cap at 12 months
    totalWeeks = Math.min(totalWeeks, 52);

    if (totalWeeks <= 4) {
        return { weeks: totalWeeks, label: 'Kort (1 månad)' };
    } else if (totalWeeks <= 12) {
        return { weeks: totalWeeks, label: 'Medium (2-3 månader)' };
    } else if (totalWeeks <= 26) {
        return { weeks: totalWeeks, label: 'Längre (4-6 månader)' };
    } else {
        return { weeks: totalWeeks, label: 'Betydande (6+ månader)' };
    }
}

function analyzeGap(userSkills, targetOccupation) {
    const userSkillsNormalized = new Set(userSkills.map(normalizeSkill));
    const requiredSkills = getRequiredSkills(targetOccupation);

    const matchedSkills = [];
    const missingSkills = [];
    const partialMatches = [];

    for (const required of requiredSkills) {
        const reqNorm = normalizeSkill(required);
        let found = false;

        for (const userSkill of userSkillsNormalized) {
            if (userSkill === reqNorm) {
                matchedSkills.push(required);
                found = true;
                break;
            } else if (userSkill.includes(reqNorm) || reqNorm.includes(userSkill)) {
                partialMatches.push({ required, userSkill });
                found = true;
                break;
            }
        }

        if (!found) {
            missingSkills.push(required);
        }
    }

    // Calculate match percentage
    const totalRequired = requiredSkills.length;
    const matchedCount = matchedSkills.length + (partialMatches.length * 0.5);
    const matchPercentage = totalRequired > 0
        ? Math.round((matchedCount / totalRequired) * 100)
        : 0;

    // Get education recommendations for missing skills
    const educationRecommendations = getEducationRecommendations(missingSkills);

    // Estimate time to close gaps
    const timeEstimate = estimateGapClosureTime(missingSkills);

    return {
        targetOccupation,
        analysis: {
            matchPercentage,
            totalRequiredSkills: totalRequired,
            matchedCount: matchedSkills.length,
            partialMatchCount: partialMatches.length,
            gapCount: missingSkills.length
        },
        skills: {
            matched: matchedSkills,
            partial: partialMatches,
            missing: missingSkills
        },
        education: educationRecommendations,
        timeToClose: timeEstimate,
        readinessLevel: getReadinessLevel(matchPercentage)
    };
}

function getReadinessLevel(matchPercentage) {
    if (matchPercentage >= 80) {
        return { level: 'high', label: 'Redo att söka', color: '#27ae60' };
    } else if (matchPercentage >= 60) {
        return { level: 'medium', label: 'Nästan redo', color: '#f39c12' };
    } else if (matchPercentage >= 40) {
        return { level: 'developing', label: 'Behöver utveckling', color: '#e67e22' };
    } else {
        return { level: 'low', label: 'Stor omställning', color: '#e74c3c' };
    }
}

function searchOccupationByName(name) {
    const nameLower = name.toLowerCase();

    for (const [id, occ] of Object.entries(occupations)) {
        if (occ.name.toLowerCase() === nameLower) {
            return { id, name: occ.name };
        }
    }

    for (const [id, occ] of Object.entries(occupations)) {
        if (occ.name.toLowerCase().includes(nameLower)) {
            return { id, name: occ.name };
        }
    }

    return null;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        loadData();

        let userSkills = [];
        let targetOccupation = '';

        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            userSkills = body.user_skills || body.skills || [];
            targetOccupation = body.target_occupation || body.targetOccupation || '';
        } else {
            if (req.query.skills) {
                userSkills = req.query.skills.split(',').map(s => s.trim());
            }
            targetOccupation = req.query.target_occupation || req.query.target || '';
        }

        if (!targetOccupation) {
            return res.status(400).json({
                error: 'Missing target_occupation parameter',
                example: 'POST { "user_skills": ["python", "excel"], "target_occupation": "Data Analyst" }'
            });
        }

        // Try to find the occupation in our database
        const foundOccupation = searchOccupationByName(targetOccupation);

        const result = analyzeGap(userSkills, targetOccupation);

        // Add occupation info if found
        if (foundOccupation) {
            result.occupationInfo = {
                id: foundOccupation.id,
                officialName: foundOccupation.name
            };
        }

        result.meta = {
            userSkillCount: userSkills.length,
            analysisType: 'NordiqFlow Gap Analysis',
            dataSource: 'SUN Education Codes + AF Taxonomy'
        };

        return res.json(result);

    } catch (error) {
        console.error('Gap analysis error:', error);
        return res.status(500).json({
            error: 'Failed to perform gap analysis',
            details: error.message
        });
    }
};
