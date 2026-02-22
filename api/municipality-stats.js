/**
 * API endpoint: Municipality dashboard stats for CityIQ
 * GET /api/municipality-stats?id=0684
 * GET /api/municipality-stats?id=0684&include=jobs,shortages,transitions
 *
 * Returns comprehensive labour market data for a municipality.
 * Uses Supabase when available, falls back to AF API + local data.
 */

const { getSupabase, isSupabaseEnabled, loadLocalData, setCorsHeaders, sendError } = require('./_lib/supabase');

// AF API municipality concept IDs (from taxonomy)
const MUNICIPALITY_CONCEPT_IDS = {
    '0684': { conceptId: 'xJqx_SLC_415', name: 'Vetlanda',   population: 27000, nuts3: 'SE231', sizeTier: 'small' },
    '0682': { conceptId: 'KfXT_ySA_do2', name: 'Nässjö',     population: 30000, nuts3: 'SE231', sizeTier: 'medium' },
    '0680': { conceptId: 'VacK_WF6_XVg', name: 'Eksjö',      population: 17000, nuts3: 'SE231', sizeTier: 'small' },
    '0680': { conceptId: 'VacK_WF6_XVg', name: 'Eksjö',      population: 17000, nuts3: 'SE231', sizeTier: 'small' },
    '0683': { conceptId: 'KURg_KJF_Lwc', name: 'Jönköping',  population: 144000, nuts3: 'SE231', sizeTier: 'large' },
    '0380': { conceptId: '2BEg_bTh_og8', name: 'Uppsala',    population: 240000, nuts3: 'SE121', sizeTier: 'large' },
    '0180': { conceptId: 'AvNB_uwa_6n6', name: 'Stockholm',  population: 975000, nuts3: 'SE110', sizeTier: 'large' },
    '1280': { conceptId: 'oYPt_yDA_Smw', name: 'Malmö',      population: 350000, nuts3: 'SE224', sizeTier: 'large' },
    '1480': { conceptId: '6Bkz_F1q_gBR', name: 'Göteborg',   population: 590000, nuts3: 'SE232', sizeTier: 'large' },
};

// Jönköpings län concept ID for regional comparison
const JONKOPINGS_LAN_ID = 'MtbE_xWT_eMi';

const JOBTECH_API = 'https://jobsearch.api.jobtechdev.se';

module.exports = async (req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return sendError(res, 405, 'Method not allowed. Use GET.');

    try {
        const { id } = req.query;

        if (!id) {
            // Return list of available municipalities
            return res.json({
                municipalities: Object.entries(MUNICIPALITY_CONCEPT_IDS).map(([kod, m]) => ({
                    kod,
                    name: m.name,
                    population: m.population,
                    sizeTier: m.sizeTier,
                })),
                hint: 'Pass ?id=0684 for Vetlanda stats',
            });
        }

        const municipality = MUNICIPALITY_CONCEPT_IDS[id];
        if (!municipality) {
            return sendError(res, 404, `Municipality ${id} not found`, {
                available: Object.keys(MUNICIPALITY_CONCEPT_IDS),
            });
        }

        // Try Supabase first
        const supabase = getSupabase();
        if (supabase) {
            return await getStatsFromSupabase(res, supabase, id, municipality);
        }

        // Fallback: query AF API directly + use local data
        return await getStatsFromAF(res, id, municipality);

    } catch (error) {
        console.error('Error in municipality-stats:', error);
        return sendError(res, 500, 'Internal server error', error.message);
    }
};

// ── SUPABASE MODE ──────────────────────────────────────────────
async function getStatsFromSupabase(res, supabase, municipalityId, municipality) {
    // Use the database function for comprehensive stats
    const { data, error } = await supabase.rpc('get_municipality_stats', {
        p_municipality_id: municipalityId,
    });

    if (error) {
        console.error('Supabase RPC error:', error);
        // Fall back to AF API
        return await getStatsFromAF(res, municipalityId, municipality);
    }

    return res.json({
        ...data,
        meta: {
            source: 'supabase',
            municipality_id: municipalityId,
        },
    });
}

// ── AF API FALLBACK MODE ───────────────────────────────────────
async function getStatsFromAF(res, municipalityId, municipality) {
    // Fetch live jobs from AF API for this municipality
    const searchBody = {
        municipality: [municipality.conceptId],
        limit: 100,
        offset: 0,
    };

    let jobs = [];
    let totalJobs = 0;

    try {
        const afResponse = await fetch(`${JOBTECH_API}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(searchBody),
        });

        if (afResponse.ok) {
            const afData = await afResponse.json();
            jobs = afData.hits || [];
            totalJobs = afData.total?.value || jobs.length;
        }
    } catch (e) {
        console.warn('AF API error, using local data:', e.message);
    }

    // Group jobs by occupation
    const occupationCounts = {};
    jobs.forEach(job => {
        const occName = job.occupation?.label || job.occupation_group?.label || 'Övrigt';
        const occId = job.occupation?.concept_id || 'unknown';
        if (!occupationCounts[occId]) {
            occupationCounts[occId] = { name: occName, count: 0, employers: {} };
        }
        occupationCounts[occId].count++;
        const employer = job.employer?.name || 'Okänd';
        occupationCounts[occId].employers[employer] = (occupationCounts[occId].employers[employer] || 0) + 1;
    });

    // Sort by count descending
    const topOccupations = Object.entries(occupationCounts)
        .map(([id, data]) => ({
            occupationId: id,
            occupationName: data.name,
            activeJobs: data.count,
            topEmployers: Object.entries(data.employers)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name, count]) => ({ name, count })),
        }))
        .sort((a, b) => b.activeJobs - a.activeJobs);

    // Load substitutability data for transitions
    const substitutability = loadLocalData('substitutability.json');
    const transitions = [];

    if (substitutability) {
        // Find transitions INTO the top shortage occupations
        const topOccIds = topOccupations.slice(0, 10).map(o => o.occupationId);
        for (const [fromId, fromData] of Object.entries(substitutability)) {
            if (!fromData.relations) continue;
            for (const rel of fromData.relations) {
                if (rel.direction === 'can_become' && topOccIds.includes(rel.targetId) && rel.score >= 50) {
                    transitions.push({
                        fromOccupation: fromData.name,
                        fromId: fromId,
                        toOccupation: rel.targetName,
                        toId: rel.targetId,
                        score: rel.score,
                    });
                }
            }
        }
        transitions.sort((a, b) => b.score - a.score);
    }

    return res.json({
        municipality: {
            id: municipalityId,
            name: municipality.name,
            population: municipality.population,
            sizeTier: municipality.sizeTier,
        },
        jobs: {
            totalActive: totalJobs,
            uniqueOccupations: Object.keys(occupationCounts).length,
            snapshotDate: new Date().toISOString().split('T')[0],
            topOccupations: topOccupations.slice(0, 20),
        },
        shortages: topOccupations.slice(0, 10).map(o => ({
            occupationId: o.occupationId,
            occupationName: o.occupationName,
            openPositions: o.activeJobs,
            gap: -o.activeJobs,  // Simplified: assume all are shortages
        })),
        transitions: transitions.slice(0, 30),
        meta: {
            source: 'af_api_live',
            municipalityId,
            afConceptId: municipality.conceptId,
            timestamp: new Date().toISOString(),
            dataNote: 'Live data from Arbetsförmedlingen Platsbanken',
        },
    });
}
