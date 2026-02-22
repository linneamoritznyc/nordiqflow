/**
 * API endpoint: Shortage analysis for a municipality
 * GET /api/shortage-analysis?municipality=0684&limit=15
 *
 * Identifies occupations with the highest demand in a municipality
 * by analyzing live job ad data and cross-referencing with
 * substitutability data for career transition opportunities.
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
        const { municipality = '0684', limit = 15 } = req.query;
        const muni = MUNICIPALITY_CONCEPT_IDS[municipality];

        if (!muni) {
            return sendError(res, 404, `Municipality ${municipality} not found`, {
                available: Object.keys(MUNICIPALITY_CONCEPT_IDS),
            });
        }

        // Try Supabase first
        const supabase = getSupabase();
        if (supabase) {
            return await getShortagesFromSupabase(res, supabase, municipality, parseInt(limit));
        }

        // Fallback: live AF API
        return await getShortagesFromAF(res, municipality, muni, parseInt(limit));

    } catch (error) {
        console.error('Error in shortage-analysis:', error);
        return sendError(res, 500, 'Internal server error', error.message);
    }
};

async function getShortagesFromSupabase(res, supabase, municipalityId, limit) {
    const { data, error } = await supabase
        .from('mv_municipality_shortages')
        .select('*')
        .eq('municipality_id', municipalityId)
        .order('shortage_rank', { ascending: true })
        .limit(limit);

    if (error || !data?.length) {
        // Fall back
        const muni = MUNICIPALITY_CONCEPT_IDS[municipalityId];
        if (muni) return await getShortagesFromAF(res, municipalityId, muni, limit);
        return sendError(res, 500, 'Database error', error?.message);
    }

    // Enrich with transition data
    const occupationIds = data.map(d => d.occupation_id);
    const { data: transitions } = await supabase
        .from('substitutability')
        .select('from_occupation_id, to_occupation_id, level, from:occupations!substitutability_from_occupation_id_fkey(name_sv)')
        .in('to_occupation_id', occupationIds)
        .gte('level', 50)
        .order('level', { ascending: false });

    return res.json({
        municipality: municipalityId,
        shortages: data.map(s => ({
            ...s,
            transitionPaths: (transitions || [])
                .filter(t => t.to_occupation_id === s.occupation_id)
                .slice(0, 5)
                .map(t => ({
                    fromOccupation: t.from?.name_sv,
                    fromId: t.from_occupation_id,
                    score: t.level,
                })),
        })),
        meta: { source: 'supabase', limit },
    });
}

async function getShortagesFromAF(res, municipalityId, muni, limit) {
    // Fetch live jobs grouped by occupation
    const searchBody = {
        municipality: [muni.conceptId],
        limit: 100,
        offset: 0,
    };

    let jobs = [];
    try {
        const response = await fetch(`${JOBTECH_API}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(searchBody),
        });
        if (response.ok) {
            const data = await response.json();
            jobs = data.hits || [];
        }
    } catch (e) {
        console.warn('AF API error:', e.message);
    }

    // Group by occupation
    const byOccupation = {};
    jobs.forEach(job => {
        const occId = job.occupation?.concept_id || 'unknown';
        const occName = job.occupation?.label || 'Övrigt';
        const ssyk = job.occupation_group?.ssyk_code_2012 || null;
        if (!byOccupation[occId]) {
            byOccupation[occId] = {
                occupationId: occId,
                occupationName: occName,
                ssykCode: ssyk,
                openPositions: 0,
                employers: new Set(),
                latestDeadline: null,
            };
        }
        byOccupation[occId].openPositions++;
        if (job.employer?.name) byOccupation[occId].employers.add(job.employer.name);
        if (job.application_deadline) {
            if (!byOccupation[occId].latestDeadline || job.application_deadline > byOccupation[occId].latestDeadline) {
                byOccupation[occId].latestDeadline = job.application_deadline;
            }
        }
    });

    // Sort by openPositions
    const shortages = Object.values(byOccupation)
        .map(s => ({
            ...s,
            employers: [...s.employers].slice(0, 5),
            gap: -s.openPositions,
        }))
        .sort((a, b) => b.openPositions - a.openPositions)
        .slice(0, limit);

    // Enrich with substitutability data
    const substitutability = loadLocalData('substitutability.json');
    if (substitutability) {
        shortages.forEach(shortage => {
            shortage.transitionPaths = [];
            for (const [fromId, fromData] of Object.entries(substitutability)) {
                if (!fromData.relations) continue;
                for (const rel of fromData.relations) {
                    if (rel.direction === 'can_become' && rel.targetId === shortage.occupationId && rel.score >= 50) {
                        shortage.transitionPaths.push({
                            fromOccupation: fromData.name,
                            fromId,
                            score: rel.score,
                        });
                    }
                }
            }
            shortage.transitionPaths.sort((a, b) => b.score - a.score);
            shortage.transitionPaths = shortage.transitionPaths.slice(0, 5);
        });
    }

    return res.json({
        municipality: municipalityId,
        municipalityName: muni.name,
        totalJobsAnalyzed: jobs.length,
        shortages,
        meta: {
            source: 'af_api_live',
            snapshotDate: new Date().toISOString().split('T')[0],
            afConceptId: muni.conceptId,
            note: 'Shortage = occupations with most open positions. Cross-referenced with AF substitutability data.',
        },
    });
}
