/**
 * NordiqFlow Advanced Scoring Engine
 *
 * Mathematical foundations:
 * 1. Jaccard Similarity for skill overlap
 * 2. Weighted skill importance (TF-IDF inspired)
 * 3. Graph-based transition difficulty
 * 4. Bayesian confidence scoring
 * 5. Multi-hop path finding with Dijkstra
 */

const fs = require('fs');
const path = require('path');

// Load data
let substitutability = null;
let occupations = null;
let skills = null;
let yrkesbarometer = null;

function loadData() {
    const dataDir = path.join(process.cwd(), 'data/processed');
    if (!substitutability) substitutability = JSON.parse(fs.readFileSync(path.join(dataDir, 'substitutability.json'), 'utf8'));
    if (!occupations) occupations = JSON.parse(fs.readFileSync(path.join(dataDir, 'occupations.json'), 'utf8'));
    if (!skills) skills = JSON.parse(fs.readFileSync(path.join(dataDir, 'skills.json'), 'utf8'));
    try {
        if (!yrkesbarometer) yrkesbarometer = JSON.parse(fs.readFileSync(path.join(dataDir, 'yrkesbarometer.json'), 'utf8'));
    } catch (e) {
        yrkesbarometer = { forecasts: {}, ssykToForecast: {} };
    }
}

/**
 * Jaccard Similarity Coefficient
 * J(A,B) = |A ∩ B| / |A ∪ B|
 *
 * Better than simple percentage because it accounts for both sets' sizes
 */
function jaccardSimilarity(setA, setB) {
    if (setA.size === 0 && setB.size === 0) return 1;
    if (setA.size === 0 || setB.size === 0) return 0;

    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    return intersection.size / union.size;
}

/**
 * Dice Coefficient (alternative similarity metric)
 * D(A,B) = 2|A ∩ B| / (|A| + |B|)
 *
 * More weight to matches than Jaccard
 */
function diceSimilarity(setA, setB) {
    if (setA.size === 0 && setB.size === 0) return 1;
    if (setA.size === 0 || setB.size === 0) return 0;

    const intersection = new Set([...setA].filter(x => setB.has(x)));
    return (2 * intersection.size) / (setA.size + setB.size);
}

/**
 * Overlap Coefficient
 * O(A,B) = |A ∩ B| / min(|A|, |B|)
 *
 * Good when one set is a subset of another
 */
function overlapCoefficient(setA, setB) {
    if (setA.size === 0 || setB.size === 0) return 0;

    const intersection = new Set([...setA].filter(x => setB.has(x)));
    return intersection.size / Math.min(setA.size, setB.size);
}

/**
 * TF-IDF inspired skill weighting
 * Rare skills are more valuable than common ones
 */
function calculateSkillRarity(skillName) {
    // Skills that appear in fewer occupations are more valuable
    const commonSkills = ['kommunikation', 'teamarbete', 'problemlösning', 'datorkunskap'];
    const rareSkills = ['kubernetes', 'pytorch', 'terraform', 'graphql', 'rust'];

    const skillLower = skillName.toLowerCase();

    if (rareSkills.some(s => skillLower.includes(s))) return 2.0;  // High weight
    if (commonSkills.some(s => skillLower.includes(s))) return 0.5; // Low weight
    return 1.0; // Normal weight
}

/**
 * Weighted Skill Match Score
 * Accounts for skill rarity and importance
 */
function weightedSkillMatch(userSkills, requiredSkills) {
    const userSet = new Set(userSkills.map(s => s.toLowerCase()));
    const reqSet = new Set(requiredSkills.map(s => s.toLowerCase()));

    let weightedMatched = 0;
    let totalWeight = 0;
    const matched = [];
    const missing = [];

    for (const skill of reqSet) {
        const weight = calculateSkillRarity(skill);
        totalWeight += weight;

        // Check for match (exact or partial)
        let isMatched = false;
        for (const userSkill of userSet) {
            if (userSkill.includes(skill) || skill.includes(userSkill)) {
                weightedMatched += weight;
                matched.push(skill);
                isMatched = true;
                break;
            }
        }
        if (!isMatched) {
            missing.push({ skill, weight, priority: weight > 1 ? 'high' : weight < 1 ? 'low' : 'medium' });
        }
    }

    const score = totalWeight > 0 ? (weightedMatched / totalWeight) * 100 : 50;
    return { score, matched, missing, totalWeight, weightedMatched };
}

/**
 * Transition Difficulty Score
 * Based on the magnitude of skill gaps
 *
 * D(c,t) = 1 - (missing_skills / (matched + missing))^α
 * Where α controls the penalty curve (α > 1 = steeper penalty)
 */
function transitionDifficulty(matched, missing, alpha = 1.5) {
    const total = matched + missing;
    if (total === 0) return 0.5;

    const gapRatio = missing / total;
    const difficulty = Math.pow(gapRatio, alpha);

    return Math.max(0, Math.min(1, 1 - difficulty));
}

/**
 * Confidence Score with Bayesian adjustment
 * More data = higher confidence
 */
function confidenceScore(dataPoints, priorConfidence = 0.5) {
    // Simple Bayesian update: confidence increases with data
    const k = 5; // Smoothing parameter
    return (dataPoints * priorConfidence + k * 0.5) / (dataPoints + k);
}

/**
 * Composite Career Score - Full Mathematical Model
 *
 * S(c,t) = Σ(wi * fi(c,t)) * confidence
 *
 * Where:
 * - f1 = Substitutability (AF data)
 * - f2 = Weighted skill match (Jaccard + TF-IDF)
 * - f3 = Demand forecast (Yrkesbarometer)
 * - f4 = Transition feasibility (inverse of difficulty)
 * - f5 = Economic incentive (salary delta)
 */
function compositeCareerScore(params) {
    const {
        substitutabilityScore,  // 0-100, from AF
        skillMatchData,         // { score, matched, missing }
        demandScore,            // 0-100, from Yrkesbarometer
        salaryDelta = 0,        // percentage change
        dataQuality = 1         // 0-1, how much data we have
    } = params;

    // Weights (sum to 1)
    const weights = {
        substitutability: 0.30,
        skillMatch: 0.30,
        demand: 0.15,
        feasibility: 0.15,
        economic: 0.10
    };

    // Normalize inputs to 0-1
    const sub = Math.min(1, Math.max(0, substitutabilityScore / 100));
    const skills = Math.min(1, Math.max(0, skillMatchData.score / 100));
    const demand = Math.min(1, Math.max(0, demandScore / 100));

    // Calculate feasibility from skill gap
    const feasibility = transitionDifficulty(
        skillMatchData.matched?.length || 0,
        skillMatchData.missing?.length || 0
    );

    // Economic incentive (salary delta normalized to 0-1)
    // +50% salary = 1.0, -50% = 0.0, 0% = 0.5
    const economic = Math.min(1, Math.max(0, (salaryDelta + 50) / 100));

    // Weighted sum
    const rawScore = (
        weights.substitutability * sub +
        weights.skillMatch * skills +
        weights.demand * demand +
        weights.feasibility * feasibility +
        weights.economic * economic
    );

    // Apply confidence adjustment
    const confidence = confidenceScore(
        (skillMatchData.matched?.length || 0) + (skillMatchData.missing?.length || 0),
        dataQuality
    );

    // Final score with confidence bounds
    const finalScore = rawScore * confidence + (1 - confidence) * 0.5;

    return {
        compositeScore: Math.round(finalScore * 100),
        rawScore: Math.round(rawScore * 100),
        confidence: Math.round(confidence * 100),
        breakdown: {
            substitutability: Math.round(sub * 100),
            skillMatch: Math.round(skills * 100),
            demand: Math.round(demand * 100),
            feasibility: Math.round(feasibility * 100),
            economic: Math.round(economic * 100)
        },
        weights,
        formula: 'S = Σ(wi·fi) × confidence + (1-confidence)×0.5'
    };
}

/**
 * Multi-hop Career Path Finding
 * Uses modified Dijkstra's algorithm where edge weights = 1 - substitutability
 */
function findCareerPath(sourceId, targetId, maxHops = 3) {
    loadData();

    if (!substitutability[sourceId]) return null;

    // Build graph
    const graph = {};
    for (const [occId, data] of Object.entries(substitutability)) {
        graph[occId] = {};
        for (const relation of (data.relations || [])) {
            if (relation.direction === 'can_become') {
                // Edge weight = difficulty = 1 - (score/100)
                graph[occId][relation.targetId] = 1 - (relation.score / 100);
            }
        }
    }

    // Dijkstra's algorithm
    const distances = {};
    const previous = {};
    const visited = new Set();
    const queue = [{ id: sourceId, distance: 0, hops: 0 }];

    distances[sourceId] = 0;

    while (queue.length > 0) {
        // Sort by distance and get minimum
        queue.sort((a, b) => a.distance - b.distance);
        const current = queue.shift();

        if (visited.has(current.id)) continue;
        if (current.hops > maxHops) continue;

        visited.add(current.id);

        // Found target
        if (current.id === targetId) {
            // Reconstruct path
            const path = [];
            let node = targetId;
            while (node) {
                const occData = occupations[node] || substitutability[node] || {};
                path.unshift({
                    id: node,
                    name: occData.name || node,
                    ssykCode: occData.ssykCode
                });
                node = previous[node];
            }
            return {
                found: true,
                path,
                totalDifficulty: distances[targetId],
                totalEase: Math.round((1 - distances[targetId]) * 100),
                hops: path.length - 1
            };
        }

        // Explore neighbors
        const neighbors = graph[current.id] || {};
        for (const [neighborId, edgeWeight] of Object.entries(neighbors)) {
            if (visited.has(neighborId)) continue;

            const newDistance = distances[current.id] + edgeWeight;
            if (newDistance < (distances[neighborId] || Infinity)) {
                distances[neighborId] = newDistance;
                previous[neighborId] = current.id;
                queue.push({
                    id: neighborId,
                    distance: newDistance,
                    hops: current.hops + 1
                });
            }
        }
    }

    return { found: false, message: 'No path found within hop limit' };
}

/**
 * Calculate skill transferability between occupations
 * Based on skill overlap and hierarchy
 */
function skillTransferability(sourceOccId, targetOccId) {
    loadData();

    const sourceData = substitutability[sourceOccId];
    const targetData = occupations[targetOccId];

    if (!sourceData || !targetData) return { score: 0, reason: 'Missing data' };

    // Find the relation if it exists
    const relation = (sourceData.relations || []).find(
        r => r.targetId === targetOccId && r.direction === 'can_become'
    );

    if (!relation) {
        return {
            score: 0,
            reason: 'No direct transition in AF data',
            suggestion: 'Consider multi-hop path'
        };
    }

    return {
        score: relation.score,
        direction: relation.direction,
        source: 'AF Substitutability Database',
        interpretation: relation.score >= 75 ? 'High transferability' :
                       relation.score >= 50 ? 'Medium transferability' :
                       'Low transferability - significant reskilling needed'
    };
}

module.exports = {
    jaccardSimilarity,
    diceSimilarity,
    overlapCoefficient,
    weightedSkillMatch,
    transitionDifficulty,
    confidenceScore,
    compositeCareerScore,
    findCareerPath,
    skillTransferability,
    loadData
};
