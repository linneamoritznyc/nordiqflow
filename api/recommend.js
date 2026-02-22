/**
 * API endpoint: Career recommendations based on current occupation
 * GET /api/recommend?occupation_id=xxx&limit=10
 * GET /api/recommend?occupation_name=Systemutvecklare&limit=10
 * POST /api/recommend { occupation_id, skills: [...], municipality: "0684" }
 *
 * Supports Supabase (materialized views) or local JSON fallback.
 */

const { getSupabase, loadLocalData, setCorsHeaders, sendError } = require('./_lib/supabase');

module.exports = async (req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        let occupationId, occupationName, limit = 10, userSkills = [], municipality;

        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            occupationId = body.occupation_id || body.occupationId;
            occupationName = body.occupation_name || body.occupationName;
            limit = body.limit || 10;
            userSkills = body.skills || [];
            municipality = body.municipality;
        } else if (req.method === 'GET') {
            occupationId = req.query.occupation_id || req.query.occupationId;
            occupationName = req.query.occupation_name || req.query.occupationName;
            limit = parseInt(req.query.limit) || 10;
            municipality = req.query.municipality;
        } else {
            return sendError(res, 405, 'Use GET or POST.');
        }

        // Resolve name to ID if needed
        if (!occupationId && occupationName) {
            occupationId = resolveOccupationName(occupationName);
        }

        if (!occupationId) {
            return sendError(res, 400, 'Missing occupation_id or occupation_name', {
                example: '/api/recommend?occupation_name=Systemutvecklare',
            });
        }

        // Try Supabase first
        const supabase = getSupabase();
        if (supabase) {
            return await getRecommendationsSupabase(res, supabase, occupationId, limit, municipality);
        }

        // Fallback: local JSON
        return await getRecommendationsLocal(res, occupationId, limit, municipality);

    } catch (error) {
        console.error('Error in recommend:', error);
        return sendError(res, 500, 'Internal server error', error.message);
    }
};

function resolveOccupationName(name) {
    const occupations = loadLocalData('occupations.json');
    if (!occupations) return null;

    const nameLower = name.toLowerCase();

    // Exact match
    for (const [id, occ] of Object.entries(occupations)) {
        if (occ.name.toLowerCase() === nameLower) return id;
    }
    // Partial match
    for (const [id, occ] of Object.entries(occupations)) {
        if (occ.name.toLowerCase().includes(nameLower)) return id;
    }
    return null;
}

async function getRecommendationsSupabase(res, supabase, occupationId, limit, municipality) {
    // Get occupation info
    const { data: occupation } = await supabase
        .from('occupations')
        .select('id, name_sv, ssyk_code')
        .eq('id', occupationId)
        .single();

    // Get career paths from materialized view (includes 2-hop)
    const { data: paths, error } = await supabase
        .from('mv_career_paths_2hop')
        .select('*')
        .eq('source_id', occupationId)
        .order('score', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Supabase MV error:', error);
        return await getRecommendationsLocal(res, occupationId, limit, municipality);
    }

    // Get reverse transitions (who can become this)
    const { data: reverseTransitions } = await supabase
        .from('substitutability')
        .select('from_occupation_id, level, from:occupations!substitutability_from_occupation_id_fkey(name_sv)')
        .eq('to_occupation_id', occupationId)
        .order('level', { ascending: false })
        .limit(5);

    // If municipality specified, get local job counts for target occupations
    let jobCounts = {};
    if (municipality && paths?.length) {
        const targetIds = paths.map(p => p.target_id);
        const { data: snapshots } = await supabase
            .from('municipality_job_snapshots')
            .select('occupation_id, active_jobs')
            .eq('municipality_id', municipality)
            .in('occupation_id', targetIds)
            .order('snapshot_date', { ascending: false });

        if (snapshots) {
            snapshots.forEach(s => {
                if (!jobCounts[s.occupation_id]) jobCounts[s.occupation_id] = s.active_jobs;
            });
        }
    }

    return res.json({
        sourceOccupation: occupation ? {
            id: occupation.id,
            name: occupation.name_sv,
            ssykCode: occupation.ssyk_code,
        } : { id: occupationId },
        recommendations: (paths || []).map(p => ({
            id: p.target_id,
            name: p.target_name,
            ssykCode: p.target_ssyk,
            matchScore: p.score,
            hops: p.hops,
            viaOccupation: p.via_name || null,
            viaId: p.via_id || null,
            localJobs: jobCounts[p.target_id] || null,
        })),
        canReplace: (reverseTransitions || []).map(t => ({
            id: t.from_occupation_id,
            name: t.from?.name_sv,
            matchScore: t.level,
        })),
        totalRelations: paths?.length || 0,
        meta: {
            source: 'supabase',
            municipality: municipality || null,
        },
    });
}

async function getRecommendationsLocal(res, occupationId, limit, municipality) {
    const substitutability = loadLocalData('substitutability.json');
    const occupations = loadLocalData('occupations.json');

    if (!substitutability) {
        return sendError(res, 500, 'Substitutability data not available');
    }

    let subData = substitutability[occupationId];

    // Try name match if ID not found
    if (!subData) {
        const byName = Object.values(substitutability).find(
            s => s.name.toLowerCase() === occupationId.toLowerCase()
        );
        if (byName) subData = byName;
    }

    if (!subData) {
        return sendError(res, 404, 'No recommendations found', {
            hint: 'Try /api/occupations?q=... to search first',
        });
    }

    // Direct transitions
    const canBecome = subData.relations
        .filter(r => r.direction === 'can_become')
        .slice(0, limit)
        .map(r => {
            const occData = occupations?.[r.targetId] || {};
            return {
                id: r.targetId,
                name: r.targetName,
                matchScore: r.score,
                ssykCode: occData.ssykCode || null,
                ssykLabel: occData.ssykLabel || '',
                definition: occData.definition || '',
                hops: 1,
                viaOccupation: null,
            };
        });

    // 2-hop transitions
    const directIds = new Set(canBecome.map(r => r.id));
    const twoHop = [];

    for (const rel of subData.relations) {
        if (rel.direction !== 'can_become' || rel.score < 50) continue;
        const midData = substitutability[rel.targetId];
        if (!midData) continue;
        for (const rel2 of midData.relations) {
            if (rel2.direction !== 'can_become' || rel2.score < 50) continue;
            if (rel2.targetId === subData.id || directIds.has(rel2.targetId)) continue;
            const occData = occupations?.[rel2.targetId] || {};
            twoHop.push({
                id: rel2.targetId,
                name: rel2.targetName,
                matchScore: Math.round(Math.sqrt(rel.score * rel2.score)),
                ssykCode: occData.ssykCode || null,
                ssykLabel: occData.ssykLabel || '',
                hops: 2,
                viaOccupation: rel.targetName,
                viaId: rel.targetId,
            });
        }
    }
    twoHop.sort((a, b) => b.matchScore - a.matchScore);

    const canReplace = subData.relations
        .filter(r => r.direction === 'can_replace')
        .slice(0, 5)
        .map(r => ({ id: r.targetId, name: r.targetName, matchScore: r.score }));

    const allRecommendations = [...canBecome, ...twoHop.slice(0, limit)]
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);

    return res.json({
        sourceOccupation: { id: subData.id, name: subData.name },
        recommendations: allRecommendations,
        canReplace,
        totalRelations: subData.relations.length,
        meta: {
            source: 'local_json',
            totalOccupations: Object.keys(occupations || {}).length,
            dataSource: 'Arbetsförmedlingen JobTech Taxonomy',
        },
    });
}
