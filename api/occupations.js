/**
 * API endpoint: Search and list occupations
 * GET /api/occupations?q=developer&limit=20
 * GET /api/occupations?id=xxx
 *
 * Supports Supabase (trigram fuzzy search) or local JSON fallback.
 */

const { getSupabase, isSupabaseEnabled, loadLocalData, setCorsHeaders, sendError } = require('./_lib/supabase');

module.exports = async (req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return sendError(res, 405, 'Use GET.');

    try {
        const { q, limit = 20, id, offset = 0 } = req.query;

        // Try Supabase first
        const supabase = getSupabase();
        if (supabase) {
            return await searchSupabase(res, supabase, { q, limit: parseInt(limit), id, offset: parseInt(offset) });
        }

        // Fallback: local JSON
        return await searchLocal(res, { q, limit: parseInt(limit), id, offset: parseInt(offset) });

    } catch (error) {
        console.error('Error in occupations:', error);
        return sendError(res, 500, 'Internal server error', error.message);
    }
};

async function searchSupabase(res, supabase, { q, limit, id, offset }) {
    // Single occupation by ID
    if (id) {
        const { data, error } = await supabase
            .from('occupations')
            .select('id, name_sv, name_en, ssyk_code, description_sv, ssyk_level_1, ssyk_level_2, ssyk_level_3')
            .eq('id', id)
            .single();

        if (error || !data) {
            return sendError(res, 404, 'Occupation not found');
        }
        return res.json({
            data: {
                id: data.id,
                name: data.name_sv,
                nameEn: data.name_en,
                ssykCode: data.ssyk_code,
                definition: data.description_sv,
            },
        });
    }

    // Search by query (uses GIN trigram index)
    if (q && q.length >= 2) {
        const { data, error } = await supabase
            .from('occupations')
            .select('id, name_sv, ssyk_code, ssyk_level_3')
            .or(`name_sv.ilike.%${q}%,ssyk_code.like.${q}%`)
            .order('name_sv')
            .limit(limit);

        if (error) {
            console.error('Supabase search error:', error);
            return await searchLocal(res, { q, limit, id, offset });
        }

        return res.json({
            query: q,
            count: data.length,
            data: data.map(o => ({
                id: o.id,
                name: o.name_sv,
                ssykCode: o.ssyk_code,
            })),
            meta: { source: 'supabase' },
        });
    }

    // Paginated list
    const { data, error, count } = await supabase
        .from('occupations')
        .select('id, name_sv, ssyk_code', { count: 'exact' })
        .order('name_sv')
        .range(offset, offset + limit - 1);

    return res.json({
        total: count || data?.length || 0,
        offset,
        limit,
        data: (data || []).map(o => ({
            id: o.id,
            name: o.name_sv,
            ssykCode: o.ssyk_code,
        })),
        meta: { source: 'supabase' },
    });
}

async function searchLocal(res, { q, limit, id, offset }) {
    const searchIndex = loadLocalData('search-index.json');
    const occupations = loadLocalData('occupations.json');

    if (!searchIndex || !occupations) {
        return sendError(res, 500, 'Occupation data not available');
    }

    // Single occupation by ID
    if (id) {
        const occ = occupations[id];
        if (!occ) return sendError(res, 404, 'Occupation not found');
        return res.json({ data: occ });
    }

    // Search by query
    if (q && q.length >= 2) {
        const query = q.toLowerCase();
        const results = searchIndex
            .filter(occ =>
                occ.nameLower.includes(query) ||
                occ.ssykLabel.toLowerCase().includes(query) ||
                occ.ssykCode.includes(query)
            )
            .slice(0, limit)
            .map(occ => ({
                id: occ.id,
                name: occ.name,
                ssykCode: occ.ssykCode,
                ssykLabel: occ.ssykLabel,
            }));

        return res.json({
            query: q,
            count: results.length,
            data: results,
            meta: { source: 'local_json' },
        });
    }

    // Paginated list
    const results = searchIndex
        .slice(offset, offset + limit)
        .map(occ => ({
            id: occ.id,
            name: occ.name,
            ssykCode: occ.ssykCode,
            ssykLabel: occ.ssykLabel,
        }));

    return res.json({
        total: searchIndex.length,
        offset,
        limit,
        data: results,
        meta: { source: 'local_json' },
    });
}
