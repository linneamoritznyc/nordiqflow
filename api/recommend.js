/**
 * API endpoint: Get career recommendations based on current occupation
 * GET /api/recommend?occupation_id=xxx&limit=10
 * POST /api/recommend { occupation_id: "xxx", skills: ["skill1", "skill2"] }
 */

const fs = require('fs');
const path = require('path');

// Load data at cold start
let substitutability = null;
let occupations = null;
let skills = null;

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
}

function getRecommendations(occupationId, limit = 10) {
    const sub = substitutability[occupationId];
    if (!sub) {
        // Try to find by name
        const byName = Object.values(substitutability).find(
            s => s.name.toLowerCase() === occupationId.toLowerCase()
        );
        if (byName) {
            return getRecommendationsFromData(byName, limit);
        }
        return null;
    }
    return getRecommendationsFromData(sub, limit);
}

function getRecommendationsFromData(subData, limit) {
    // Get recommendations sorted by score
    const recommendations = subData.relations
        .filter(r => r.direction === 'can_become')
        .slice(0, limit)
        .map(r => {
            // Enrich with occupation data
            const occData = occupations[r.targetId] || {};
            return {
                id: r.targetId,
                name: r.targetName,
                matchScore: r.score,
                ssykCode: occData.ssykCode || 'N/A',
                ssykLabel: occData.ssykLabel || '',
                definition: occData.definition || '',
                direction: r.direction
            };
        });

    // Also get what this occupation can replace (reverse direction)
    const canReplace = subData.relations
        .filter(r => r.direction === 'can_replace')
        .slice(0, 5)
        .map(r => ({
            id: r.targetId,
            name: r.targetName,
            matchScore: r.score
        }));

    return {
        sourceOccupation: {
            id: subData.id,
            name: subData.name
        },
        recommendations,
        canReplace,
        totalRelations: subData.relations.length
    };
}

function searchOccupationByName(name) {
    const nameLower = name.toLowerCase();

    // First try exact match
    for (const [id, occ] of Object.entries(occupations)) {
        if (occ.name.toLowerCase() === nameLower) {
            return id;
        }
    }

    // Then try partial match
    for (const [id, occ] of Object.entries(occupations)) {
        if (occ.name.toLowerCase().includes(nameLower)) {
            return id;
        }
    }

    return null;
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        loadData();

        let occupationId;
        let limit = 10;
        let userSkills = [];

        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            occupationId = body.occupation_id || body.occupationId;
            limit = body.limit || 10;
            userSkills = body.skills || [];

            // If occupation_name is provided instead of ID, search for it
            if (!occupationId && body.occupation_name) {
                occupationId = searchOccupationByName(body.occupation_name);
            }
        } else {
            occupationId = req.query.occupation_id || req.query.occupationId;
            limit = parseInt(req.query.limit) || 10;

            // If name is provided instead of ID
            if (!occupationId && req.query.occupation_name) {
                occupationId = searchOccupationByName(req.query.occupation_name);
            }
        }

        if (!occupationId) {
            return res.status(400).json({
                error: 'Missing occupation_id or occupation_name parameter',
                example: '/api/recommend?occupation_name=Systemutvecklare'
            });
        }

        const result = getRecommendations(occupationId, limit);

        if (!result) {
            return res.status(404).json({
                error: 'No recommendations found for this occupation',
                occupation_id: occupationId,
                hint: 'Try searching for the occupation first with /api/occupations?q=...'
            });
        }

        // Add metadata
        result.meta = {
            totalOccupations: Object.keys(occupations).length,
            totalSubstitutabilityRecords: Object.keys(substitutability).length,
            dataSource: 'Arbetsförmedlingen JobTech Taxonomy'
        };

        return res.json(result);

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};
