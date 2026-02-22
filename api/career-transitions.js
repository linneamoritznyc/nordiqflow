/**
 * API endpoint: Career transitions for an occupation
 * GET /api/career-transitions?occupation_id=xxx&min_score=50&include_2hop=true
 * GET /api/career-transitions?occupation_name=Undersköterska
 * GET /api/career-transitions?municipality=0684  (transitions for shortage occupations)
 *
 * Returns substitutability-based career paths with enrichment data.
 */

const { getSupabase, loadLocalData, setCorsHeaders, sendError } = require('./_lib/supabase');

const MUNICIPALITY_CONCEPT_IDS = {
    '0684': { conceptId: 'xJqx_SLC_415', name: 'Vetlanda' },
    '0682': { conceptId: 'KfXT_ySA_do2', name: 'Nässjö' },
    '0680': { conceptId: 'VacK_WF6_XVg', name: 'Eksjö' },
    '0683': { conceptId: 'KURg_KJF_Lwc', name: 'Jönköping' },
};

const JOBTECH_API = 'https://jobsearch.api.jobtechdev.se';

module.exports = async (req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return sendError(res, 405, 'Use GET.');

    try {
        const {
            occupation_id,
            occupation_name,
            municipality,
            min_score = 25,
            include_2hop = 'true',
            limit = 20,
        } = req.query;

        // Mode 1: Transitions for a specific occupation
        if (occupation_id || occupation_name) {
            return await getOccupationTransitions(res, {
                occupationId: occupation_id,
                occupationName: occupation_name,
                minScore: parseInt(min_score),
                include2Hop: include_2hop === 'true',
                limit: parseInt(limit),
            });
        }

        // Mode 2: Transitions relevant to a municipality's shortages
        if (municipality) {
            return await getMunicipalityTransitions(res, municipality, parseInt(min_score), parseInt(limit));
        }

        return sendError(res, 400, 'Provide occupation_id, occupation_name, or municipality parameter');

    } catch (error) {
        console.error('Error in career-transitions:', error);
        return sendError(res, 500, 'Internal server error', error.message);
    }
};

async function getOccupationTransitions(res, opts) {
    const { occupationId, occupationName, minScore, include2Hop, limit } = opts;

    // Try Supabase first
    const supabase = getSupabase();
    if (supabase && occupationId) {
        const { data, error } = await supabase.rpc('get_career_transitions', {
            p_occupation_id: occupationId,
            p_min_score: minScore,
            p_include_2hop: include2Hop,
        });
        if (!error && data) {
            return res.json({ ...data, meta: { source: 'supabase' } });
        }
    }

    // Fallback: local data
    const substitutability = loadLocalData('substitutability.json');
    const occupations = loadLocalData('occupations.json');
    if (!substitutability) return sendError(res, 500, 'Substitutability data not available');

    // Find occupation
    let occId = occupationId;
    let occData = null;

    if (occupationId && substitutability[occupationId]) {
        occData = substitutability[occupationId];
    } else if (occupationName) {
        // Search by name
        const nameLower = occupationName.toLowerCase();
        for (const [id, data] of Object.entries(substitutability)) {
            if (data.name.toLowerCase().includes(nameLower)) {
                occId = id;
                occData = data;
                break;
            }
        }
    }

    if (!occData) {
        return sendError(res, 404, 'Occupation not found', {
            hint: 'Use /api/occupations?q=... to search for an occupation first',
        });
    }

    const canBecome = occData.relations
        .filter(r => r.direction === 'can_become' && r.score >= minScore)
        .slice(0, limit)
        .map(r => {
            const targetOcc = occupations?.[r.targetId] || {};
            return {
                id: r.targetId,
                name: r.targetName,
                ssykCode: targetOcc.ssykCode || null,
                score: r.score,
                hops: 1,
                viaId: null,
                viaName: null,
            };
        });

    const canReplace = occData.relations
        .filter(r => r.direction === 'can_replace' && r.score >= minScore)
        .slice(0, limit)
        .map(r => ({
            id: r.targetId,
            name: r.targetName,
            score: r.score,
        }));

    // 2-hop transitions
    let twoHop = [];
    if (include2Hop) {
        const directTargets = new Set(canBecome.map(r => r.id));
        for (const rel of occData.relations) {
            if (rel.direction !== 'can_become' || rel.score < 50) continue;
            const midData = substitutability[rel.targetId];
            if (!midData) continue;
            for (const rel2 of midData.relations) {
                if (rel2.direction !== 'can_become' || rel2.score < 50) continue;
                if (rel2.targetId === occId || directTargets.has(rel2.targetId)) continue;
                const targetOcc = occupations?.[rel2.targetId] || {};
                twoHop.push({
                    id: rel2.targetId,
                    name: rel2.targetName,
                    ssykCode: targetOcc.ssykCode || null,
                    score: Math.round(Math.sqrt(rel.score * rel2.score)),
                    hops: 2,
                    viaId: rel.targetId,
                    viaName: rel.targetName,
                });
            }
        }
        twoHop.sort((a, b) => b.score - a.score);
        twoHop = twoHop.slice(0, limit);
    }

    return res.json({
        occupation: {
            id: occId,
            name: occData.name,
        },
        canBecome: [...canBecome, ...twoHop].sort((a, b) => b.score - a.score).slice(0, limit),
        canBeReachedFrom: canReplace,
        meta: {
            source: 'local_json',
            totalRelations: occData.relations.length,
            minScore,
            include2Hop,
        },
    });
}

async function getMunicipalityTransitions(res, municipalityId, minScore, limit) {
    const muni = MUNICIPALITY_CONCEPT_IDS[municipalityId];
    if (!muni) return sendError(res, 404, `Municipality ${municipalityId} not found`);

    // Get shortage occupations first
    let shortageOccupations = [];

    const supabase = getSupabase();
    if (supabase) {
        const { data } = await supabase
            .from('mv_municipality_shortages')
            .select('occupation_id, occupation_name, gap, open_positions')
            .eq('municipality_id', municipalityId)
            .order('shortage_rank')
            .limit(10);
        if (data) shortageOccupations = data;
    }

    // Fallback: get from AF API
    if (!shortageOccupations.length) {
        try {
            const response = await fetch(`${JOBTECH_API}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ municipality: [muni.conceptId], limit: 100 }),
            });
            if (response.ok) {
                const afData = await response.json();
                const byOcc = {};
                (afData.hits || []).forEach(job => {
                    const id = job.occupation?.concept_id || 'unknown';
                    const name = job.occupation?.label || 'Övrigt';
                    if (!byOcc[id]) byOcc[id] = { occupation_id: id, occupation_name: name, open_positions: 0 };
                    byOcc[id].open_positions++;
                });
                shortageOccupations = Object.values(byOcc)
                    .sort((a, b) => b.open_positions - a.open_positions)
                    .slice(0, 10);
            }
        } catch (e) {
            console.warn('AF API error:', e.message);
        }
    }

    // Find transitions INTO these shortage occupations
    const substitutability = loadLocalData('substitutability.json');
    const transitions = [];

    if (substitutability) {
        const shortageIds = new Set(shortageOccupations.map(s => s.occupation_id));
        for (const [fromId, fromData] of Object.entries(substitutability)) {
            if (shortageIds.has(fromId)) continue; // Skip self-transitions
            for (const rel of fromData.relations || []) {
                if (rel.direction === 'can_become' && shortageIds.has(rel.targetId) && rel.score >= minScore) {
                    const shortage = shortageOccupations.find(s => s.occupation_id === rel.targetId);
                    transitions.push({
                        fromOccupation: fromData.name,
                        fromId,
                        toOccupation: rel.targetName,
                        toId: rel.targetId,
                        score: rel.score,
                        openPositions: shortage?.open_positions || 0,
                    });
                }
            }
        }
    }

    transitions.sort((a, b) => b.score - a.score || b.openPositions - a.openPositions);

    return res.json({
        municipality: { id: municipalityId, name: muni.name },
        shortageOccupations,
        transitions: transitions.slice(0, limit),
        summary: {
            totalShortageOccupations: shortageOccupations.length,
            totalTransitionPaths: transitions.length,
            highScorePaths: transitions.filter(t => t.score >= 75).length,
            mediumScorePaths: transitions.filter(t => t.score >= 50 && t.score < 75).length,
        },
        meta: {
            source: supabase ? 'supabase+local' : 'af_api+local',
            municipalityId,
            minScore,
        },
    });
}
