/**
 * API endpoint: Career recommendations with full Composite Career Score
 * POST /api/career-match {
 *   current_occupation: "Butikschef",
 *   user_skills: ["ledarskap", "kundservice", "budget"],
 *   limit: 10
 * }
 *
 * Implements the NordiqFlow Composite Career Score:
 * S(c,t) = w1·sub(c,t) + w2·M(c,t) + w3·D(t) + w4·K(t) + w5·ΔL(c,t)
 *
 * Where:
 * - sub(c,t) = Substitutability from AF data (40%)
 * - M(c,t) = Skill match percentage (40%)
 * - D(t) = Demand forecast (10%) - estimated from job listings
 * - K(t) = Current market situation (5%)
 * - ΔL(c,t) = Salary delta (5%)
 */

const fs = require('fs');
const path = require('path');

// Scoring weights (adjusted for available data)
const WEIGHTS = {
    substitutability: 0.40,  // AF's pre-computed career transitions
    skillMatch: 0.40,        // How well user skills match target
    demand: 0.10,            // Market demand estimate
    marketSituation: 0.05,   // Current hiring activity
    salaryDelta: 0.05        // Economic incentive
};

// Cache for processed data
let substitutability = null;
let occupations = null;
let skills = null;
let occupationSkills = null;

function loadData() {
    const dataDir = path.join(process.cwd(), 'data/processed');

    if (!substitutability) {
        substitutability = JSON.parse(fs.readFileSync(path.join(dataDir, 'substitutability.json'), 'utf8'));
    }
    if (!occupations) {
        occupations = JSON.parse(fs.readFileSync(path.join(dataDir, 'occupations.json'), 'utf8'));
    }
    if (!skills) {
        skills = JSON.parse(fs.readFileSync(path.join(dataDir, 'skills.json'), 'utf8'));
    }

    // Build occupation -> required skills mapping
    if (!occupationSkills) {
        occupationSkills = buildOccupationSkillsMap();
    }
}

function buildOccupationSkillsMap() {
    // Map each occupation to its typical skills
    // This is a simplified version - ideally would come from historical job data
    const map = {};

    for (const [occId, occ] of Object.entries(occupations)) {
        // Extract skills from occupation definition if available
        const skillKeywords = extractSkillKeywords(occ.definition || '');
        map[occId] = {
            skills: skillKeywords,
            name: occ.name,
            ssykCode: occ.ssykCode
        };
    }

    return map;
}

function extractSkillKeywords(text) {
    // Extract skill-related keywords from text
    const skillPatterns = [
        'ledarskap', 'projektledning', 'budget', 'ekonomi', 'kundservice',
        'kommunikation', 'teamarbete', 'problemlösning', 'analys', 'data',
        'programmering', 'utveckling', 'design', 'marknadsföring', 'försäljning',
        'administration', 'planering', 'organisation', 'personalansvar',
        'agil', 'scrum', 'kanban', 'excel', 'powerpoint', 'word'
    ];

    const textLower = text.toLowerCase();
    return skillPatterns.filter(skill => textLower.includes(skill));
}

function normalizeSkill(skill) {
    // Normalize skill name for comparison
    return skill.toLowerCase()
        .replace(/[^a-zåäöé0-9\s]/gi, '')
        .trim();
}

function calculateSkillMatch(userSkills, targetOccupationId) {
    const userSkillsNormalized = new Set(userSkills.map(normalizeSkill));
    const targetData = occupationSkills[targetOccupationId];

    if (!targetData || targetData.skills.length === 0) {
        // No skill data available, return neutral score
        return { score: 50, matchedSkills: [], missingSkills: [] };
    }

    const targetSkillsNormalized = targetData.skills.map(normalizeSkill);
    const matchedSkills = [];
    const missingSkills = [];

    for (const targetSkill of targetSkillsNormalized) {
        let matched = false;
        for (const userSkill of userSkillsNormalized) {
            if (userSkill.includes(targetSkill) || targetSkill.includes(userSkill)) {
                matchedSkills.push(targetSkill);
                matched = true;
                break;
            }
        }
        if (!matched) {
            missingSkills.push(targetSkill);
        }
    }

    const score = targetSkillsNormalized.length > 0
        ? (matchedSkills.length / targetSkillsNormalized.length) * 100
        : 50;

    return { score, matchedSkills, missingSkills };
}

function expandSkillsHierarchically(userSkills) {
    // Implement hierarchical skill expansion
    // "Google Ads" -> also matches "Digital marketing" -> also matches "Marketing"
    const expanded = new Set(userSkills.map(normalizeSkill));

    const hierarchies = {
        'python': ['programmering', 'utveckling', 'it'],
        'javascript': ['programmering', 'webbutveckling', 'it'],
        'react': ['javascript', 'frontend', 'webbutveckling'],
        'excel': ['kontorsverktyg', 'analys', 'data'],
        'powerpoint': ['kontorsverktyg', 'presentation'],
        'google ads': ['digital marknadsföring', 'marknadsföring', 'annonsering'],
        'scrum': ['agil', 'projektledning', 'agila metoder'],
        'agile coach': ['agil', 'ledarskap', 'coaching']
    };

    for (const skill of userSkills) {
        const normalized = normalizeSkill(skill);
        const parents = hierarchies[normalized];
        if (parents) {
            parents.forEach(p => expanded.add(p));
        }
    }

    return Array.from(expanded);
}

function estimateDemand(occupationId) {
    // Estimate demand based on occupation type
    // In production, this would come from Yrkesbarometer API
    const highDemandPatterns = ['it', 'utvecklare', 'sjuksköterska', 'lärare', 'ingenjör'];
    const occ = occupations[occupationId];

    if (!occ) return 50;

    const nameLower = occ.name.toLowerCase();
    const isHighDemand = highDemandPatterns.some(p => nameLower.includes(p));

    return isHighDemand ? 75 : 50;
}

function calculateCompositeScore(params) {
    const {
        substitutabilityScore,  // 0-100 from AF data
        skillMatchScore,        // 0-100 calculated
        demandScore,            // 0-100 estimated
        marketScore = 50,       // 0-100 neutral default
        salaryDeltaScore = 50   // 0-100 neutral default
    } = params;

    // Normalize all scores to 0-1 range
    const normalized = {
        sub: Math.min(100, Math.max(0, substitutabilityScore)) / 100,
        skill: Math.min(100, Math.max(0, skillMatchScore)) / 100,
        demand: Math.min(100, Math.max(0, demandScore)) / 100,
        market: Math.min(100, Math.max(0, marketScore)) / 100,
        salary: Math.min(100, Math.max(0, salaryDeltaScore)) / 100
    };

    // Calculate weighted composite score
    const composite = (
        WEIGHTS.substitutability * normalized.sub +
        WEIGHTS.skillMatch * normalized.skill +
        WEIGHTS.demand * normalized.demand +
        WEIGHTS.marketSituation * normalized.market +
        WEIGHTS.salaryDelta * normalized.salary
    ) * 100;

    return {
        compositeScore: Math.round(composite),
        breakdown: {
            substitutability: Math.round(substitutabilityScore),
            skillMatch: Math.round(skillMatchScore),
            demand: Math.round(demandScore),
            market: Math.round(marketScore),
            salaryDelta: Math.round(salaryDeltaScore)
        },
        weights: WEIGHTS
    };
}

function getCareerRecommendations(currentOccupationId, userSkills, limit = 10) {
    const subData = substitutability[currentOccupationId];
    if (!subData) return null;

    // Expand user skills hierarchically
    const expandedSkills = expandSkillsHierarchically(userSkills);

    // Get all potential transitions
    const transitions = subData.relations
        .filter(r => r.direction === 'can_become')
        .map(r => {
            // Calculate skill match for this target occupation
            const skillMatch = calculateSkillMatch(expandedSkills, r.targetId);
            const demandScore = estimateDemand(r.targetId);

            // Calculate composite score
            const scoring = calculateCompositeScore({
                substitutabilityScore: r.score || 50,
                skillMatchScore: skillMatch.score,
                demandScore: demandScore
            });

            const occData = occupations[r.targetId] || {};

            return {
                id: r.targetId,
                name: r.targetName,
                ssykCode: occData.ssykCode || 'N/A',
                ssykLabel: occData.ssykLabel || '',

                // Main scores
                compositeScore: scoring.compositeScore,
                breakdown: scoring.breakdown,

                // Skill analysis
                skillMatch: {
                    percentage: Math.round(skillMatch.score),
                    matched: skillMatch.matchedSkills,
                    missing: skillMatch.missingSkills,
                    gapCount: skillMatch.missingSkills.length
                },

                // For display
                matchLabel: getMatchLabel(scoring.compositeScore),
                recommendation: generateRecommendation(skillMatch.missingSkills)
            };
        })
        // Sort by composite score (highest first)
        .sort((a, b) => b.compositeScore - a.compositeScore)
        .slice(0, limit);

    return {
        sourceOccupation: {
            id: currentOccupationId,
            name: subData.name
        },
        userProfile: {
            skills: userSkills,
            expandedSkills: expandedSkills
        },
        recommendations: transitions,
        algorithmVersion: 'NordiqFlow Composite Score v1.0',
        weights: WEIGHTS
    };
}

function getMatchLabel(score) {
    if (score >= 80) return 'Utmärkt matchning';
    if (score >= 65) return 'Bra matchning';
    if (score >= 50) return 'Möjlig övergång';
    return 'Kräver utveckling';
}

function generateRecommendation(missingSkills) {
    if (missingSkills.length === 0) {
        return 'Du har redan alla nyckelkompetenser för detta yrke!';
    }
    if (missingSkills.length <= 2) {
        return `Utveckla: ${missingSkills.join(', ')}`;
    }
    return `Fokusera på ${missingSkills.length} kompetensområden för att nå målet`;
}

function searchOccupationByName(name) {
    const nameLower = name.toLowerCase();

    for (const [id, occ] of Object.entries(occupations)) {
        if (occ.name.toLowerCase() === nameLower) {
            return id;
        }
    }

    for (const [id, occ] of Object.entries(occupations)) {
        if (occ.name.toLowerCase().includes(nameLower)) {
            return id;
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

        let currentOccupationId;
        let userSkills = [];
        let limit = 10;

        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

            // Get occupation ID
            currentOccupationId = body.occupation_id || body.occupationId;
            if (!currentOccupationId && body.current_occupation) {
                currentOccupationId = searchOccupationByName(body.current_occupation);
            }

            // Get user skills
            userSkills = body.user_skills || body.skills || [];
            limit = body.limit || 10;

        } else {
            currentOccupationId = req.query.occupation_id;
            if (!currentOccupationId && req.query.occupation_name) {
                currentOccupationId = searchOccupationByName(req.query.occupation_name);
            }

            if (req.query.skills) {
                userSkills = req.query.skills.split(',').map(s => s.trim());
            }

            limit = parseInt(req.query.limit) || 10;
        }

        if (!currentOccupationId) {
            return res.status(400).json({
                error: 'Missing occupation_id or current_occupation',
                example: 'POST { "current_occupation": "Butikschef", "user_skills": ["ledarskap", "budget"] }'
            });
        }

        const result = getCareerRecommendations(currentOccupationId, userSkills, limit);

        if (!result) {
            return res.status(404).json({
                error: 'No career transitions found for this occupation',
                occupation_id: currentOccupationId
            });
        }

        result.meta = {
            totalOccupations: Object.keys(occupations).length,
            totalTransitions: Object.keys(substitutability).length,
            dataSource: 'Arbetsförmedlingen JobTech + NordiqFlow Algorithm'
        };

        return res.json(result);

    } catch (error) {
        console.error('Career match error:', error);
        return res.status(500).json({
            error: 'Failed to calculate career matches',
            details: error.message
        });
    }
};
