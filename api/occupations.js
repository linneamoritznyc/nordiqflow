/**
 * API endpoint: Search and list occupations
 * GET /api/occupations?q=developer&limit=20
 */

const fs = require('fs');
const path = require('path');

// Load data at cold start
let searchIndex = null;
let occupations = null;

function loadData() {
    if (!searchIndex) {
        const dataPath = path.join(process.cwd(), 'data/processed/search-index.json');
        searchIndex = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
    if (!occupations) {
        const occPath = path.join(process.cwd(), 'data/processed/occupations.json');
        occupations = JSON.parse(fs.readFileSync(occPath, 'utf8'));
    }
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        loadData();

        const { q, limit = 20, id } = req.query;

        // If ID is provided, return single occupation
        if (id) {
            const occ = occupations[id];
            if (!occ) {
                return res.status(404).json({ error: 'Occupation not found' });
            }
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
                .slice(0, parseInt(limit))
                .map(occ => ({
                    id: occ.id,
                    name: occ.name,
                    ssykCode: occ.ssykCode,
                    ssykLabel: occ.ssykLabel
                }));

            return res.json({
                query: q,
                count: results.length,
                data: results
            });
        }

        // Return paginated list
        const offset = parseInt(req.query.offset) || 0;
        const results = searchIndex
            .slice(offset, offset + parseInt(limit))
            .map(occ => ({
                id: occ.id,
                name: occ.name,
                ssykCode: occ.ssykCode,
                ssykLabel: occ.ssykLabel
            }));

        return res.json({
            total: searchIndex.length,
            offset,
            limit: parseInt(limit),
            data: results
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
