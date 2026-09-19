/**
 * API endpoint: Multi-hop Career Path Finding
 * POST /api/career-path {
 *   source_occupation: "Butikssäljare",
 *   target_occupation: "Projektledare",
 *   max_hops: 3
 * }
 *
 * Uses Dijkstra's algorithm to find optimal transition paths
 * through intermediate occupations when direct transitions
 * have low substitutability scores.
 *
 * Algorithm:
 * - Builds graph from AF substitutability data
 * - Edge weights = 1 - (substitutability_score / 100)
 * - Lower weight = easier transition
 * - Returns optimal path with cumulative difficulty scores
 */

const fs = require('fs');
const path = require('path');

let substitutability = null;
let occupations = null;

function loadData() {
    const dataDir = path.join(process.cwd(), 'data/processed');

    if (!substitutability) {
        substitutability = JSON.parse(fs.readFileSync(path.join(dataDir, 'substitutability.json'), 'utf8'));
    }
    if (!occupations) {
        occupations = JSON.parse(fs.readFileSync(path.join(dataDir, 'occupations.json'), 'utf8'));
    }
}

/**
 * Dijkstra's algorithm for finding optimal career path
 * Edge weight = difficulty = 1 - (substitutability/100)
 */
function findCareerPath(sourceId, targetId, maxHops = 3) {
    if (!substitutability[sourceId]) {
        return { found: false, message: 'Source occupation not found in substitutability data' };
    }

    // Build weighted graph
    const graph = {};
    for (const [occId, data] of Object.entries(substitutability)) {
        graph[occId] = {};
        for (const relation of (data.relations || [])) {
            if (relation.direction === 'can_become') {
                // Edge weight = difficulty = 1 - (score/100)
                // Higher substitutability = lower difficulty
                graph[occId][relation.targetId] = {
                    weight: 1 - (relation.score / 100),
                    score: relation.score,
                    targetName: relation.targetName
                };
            }
        }
    }

    // Dijkstra's algorithm
    const distances = { [sourceId]: 0 };
    const previous = {};
    const pathScores = { [sourceId]: [] };
    const visited = new Set();

    // Priority queue (simple array, sorted on each iteration)
    const queue = [{ id: sourceId, distance: 0, hops: 0 }];

    while (queue.length > 0) {
        // Get node with minimum distance
        queue.sort((a, b) => a.distance - b.distance);
        const current = queue.shift();

        if (visited.has(current.id)) continue;
        if (current.hops > maxHops) continue;

        visited.add(current.id);

        // Found target - reconstruct path
        if (current.id === targetId) {
            const path = reconstructPath(sourceId, targetId, previous, graph);
            return {
                found: true,
                path,
                totalDifficulty: Math.round(distances[targetId] * 100) / 100,
                totalEase: Math.round((1 - distances[targetId]) * 100),
                hops: path.length - 1,
                summary: generatePathSummary(path)
            };
        }

        // Explore neighbors
        const neighbors = graph[current.id] || {};
        for (const [neighborId, edge] of Object.entries(neighbors)) {
            if (visited.has(neighborId)) continue;

            const newDistance = distances[current.id] + edge.weight;

            if (newDistance < (distances[neighborId] ?? Infinity)) {
                distances[neighborId] = newDistance;
                previous[neighborId] = { from: current.id, edge };
                queue.push({
                    id: neighborId,
                    distance: newDistance,
                    hops: current.hops + 1
                });
            }
        }
    }

    // No path found - try to suggest alternatives
    return {
        found: false,
        message: `No path found within ${maxHops} steps`,
        suggestion: findClosestReachable(sourceId, targetId, graph, maxHops)
    };
}

function reconstructPath(sourceId, targetId, previous, graph) {
    const path = [];
    let current = targetId;

    while (current) {
        const occData = occupations[current] || substitutability[current] || {};
        const prevData = previous[current];

        path.unshift({
            id: current,
            name: occData.name || prevData?.edge?.targetName || current,
            ssykCode: occData.ssykCode || null,
            transitionScore: prevData ? prevData.edge.score : null,
            transitionFrom: prevData ? prevData.from : null
        });

        current = prevData ? prevData.from : null;
    }

    return path;
}

function generatePathSummary(path) {
    if (path.length <= 1) return 'Already at target';
    if (path.length === 2) return 'Direct transition possible';

    const steps = path.length - 1;
    const avgScore = path.slice(1).reduce((sum, p) => sum + (p.transitionScore || 0), 0) / steps;

    return `${steps}-stegs karriärväg med genomsnittlig övergång ${Math.round(avgScore)}%`;
}

function findClosestReachable(sourceId, targetId, graph, maxHops) {
    // Find occupations reachable from source that are in same field as target
    const targetOcc = occupations[targetId] || {};
    const targetWords = (targetOcc.name || '').toLowerCase().split(/\s+/);

    const reachable = [];
    const visited = new Set([sourceId]);
    const queue = [{ id: sourceId, hops: 0 }];

    while (queue.length > 0) {
        const current = queue.shift();
        if (current.hops >= maxHops) continue;

        const neighbors = graph[current.id] || {};
        for (const [neighborId, edge] of Object.entries(neighbors)) {
            if (visited.has(neighborId)) continue;
            visited.add(neighborId);

            const occData = occupations[neighborId] || {};
            const occWords = (occData.name || '').toLowerCase().split(/\s+/);

            // Check if occupation shares words with target
            const sharedWords = occWords.filter(w => targetWords.includes(w) && w.length > 3);
            if (sharedWords.length > 0) {
                reachable.push({
                    id: neighborId,
                    name: occData.name,
                    hops: current.hops + 1,
                    score: edge.score,
                    sharedTerms: sharedWords
                });
            }

            queue.push({ id: neighborId, hops: current.hops + 1 });
        }
    }

    return reachable.sort((a, b) => b.score - a.score).slice(0, 3);
}

function searchOccupationByName(name) {
    const nameLower = name.toLowerCase();

    // Exact match
    for (const [id, occ] of Object.entries(occupations)) {
        if (occ.name.toLowerCase() === nameLower) {
            return id;
        }
    }

    // Partial match
    for (const [id, occ] of Object.entries(occupations)) {
        if (occ.name.toLowerCase().includes(nameLower)) {
            return id;
        }
    }

    // Try substitutability data
    for (const [id, data] of Object.entries(substitutability)) {
        if ((data.name || '').toLowerCase().includes(nameLower)) {
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

        let sourceId, targetId, maxHops = 3;

        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

            // Get source occupation
            sourceId = body.source_id || body.sourceId;
            if (!sourceId && body.source_occupation) {
                sourceId = searchOccupationByName(body.source_occupation);
            }

            // Get target occupation
            targetId = body.target_id || body.targetId;
            if (!targetId && body.target_occupation) {
                targetId = searchOccupationByName(body.target_occupation);
            }

            maxHops = body.max_hops || body.maxHops || 3;
        } else {
            sourceId = req.query.source_id;
            if (!sourceId && req.query.source_occupation) {
                sourceId = searchOccupationByName(req.query.source_occupation);
            }

            targetId = req.query.target_id;
            if (!targetId && req.query.target_occupation) {
                targetId = searchOccupationByName(req.query.target_occupation);
            }

            maxHops = parseInt(req.query.max_hops) || 3;
        }

        if (!sourceId) {
            return res.status(400).json({
                error: 'Missing source occupation',
                example: 'POST { "source_occupation": "Butikssäljare", "target_occupation": "Projektledare" }'
            });
        }

        if (!targetId) {
            return res.status(400).json({
                error: 'Missing target occupation',
                example: 'POST { "source_occupation": "Butikssäljare", "target_occupation": "Projektledare" }'
            });
        }

        const result = findCareerPath(sourceId, targetId, Math.min(maxHops, 5));

        // Add occupation details
        const sourceOcc = occupations[sourceId] || substitutability[sourceId] || {};
        const targetOcc = occupations[targetId] || {};

        result.source = {
            id: sourceId,
            name: sourceOcc.name || sourceId,
            ssykCode: sourceOcc.ssykCode
        };

        result.target = {
            id: targetId,
            name: targetOcc.name || targetId,
            ssykCode: targetOcc.ssykCode
        };

        result.meta = {
            algorithm: 'Dijkstra shortest path',
            edgeWeights: 'difficulty = 1 - (substitutability/100)',
            maxHopsAllowed: maxHops,
            dataSource: 'Arbetsförmedlingen Substitutability Database'
        };

        return res.json(result);

    } catch (error) {
        console.error('Career path error:', error);
        return res.status(500).json({
            error: 'Failed to calculate career path',
            details: error.message
        });
    }
};
