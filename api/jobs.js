/**
 * API endpoint: Search real jobs from Platsbanken via JobTech API
 * GET /api/jobs?q=developer&occupation_id=xxx&limit=10
 * GET /api/jobs?municipality=xJqx_SLC_415&limit=50  (by municipality concept ID)
 * GET /api/jobs?municipality_code=0684&limit=50      (by kommun code)
 *
 * Returns live job listings from Arbetsformedlingen's Platsbanken
 */

const { setCorsHeaders } = require('./_lib/supabase');

const JOBTECH_API = 'https://jobsearch.api.jobtechdev.se';

// Municipality code → AF concept ID mapping
const MUNICIPALITY_CODE_MAP = {
    '0684': 'xJqx_SLC_415', // Vetlanda
    '0682': 'KfXT_ySA_do2', // Nässjö
    '0680': 'VacK_WF6_XVg', // Eksjö
    '0683': 'KURg_KJF_Lwc', // Jönköping
    '0380': '2BEg_bTh_og8', // Uppsala
    '0180': 'AvNB_uwa_6n6', // Stockholm
    '1280': 'oYPt_yDA_Smw', // Malmö
    '1480': '6Bkz_F1q_gBR', // Göteborg
};

module.exports = async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed. Use GET.' });
    }

    try {
        const { q, occupation_id, occupation_group, municipality, municipality_code, region, limit = 10, offset = 0 } = req.query;

        // Build search request for JobTech API
        const searchBody = {
            limit: Math.min(parseInt(limit), 100),
            offset: parseInt(offset) || 0
        };

        // Add search query if provided
        if (q) {
            searchBody.q = q;
        }

        // Add occupation filter if provided
        if (occupation_id) {
            searchBody['occupation-name'] = [occupation_id];
        }

        // Add occupation group (SSYK code) if provided
        if (occupation_group) {
            searchBody['occupation-group'] = [occupation_group];
        }

        // Add municipality filter (by concept ID or code)
        if (municipality) {
            searchBody.municipality = [municipality];
        } else if (municipality_code && MUNICIPALITY_CODE_MAP[municipality_code]) {
            searchBody.municipality = [MUNICIPALITY_CODE_MAP[municipality_code]];
        }

        // Add region filter
        if (region) {
            searchBody.region = [region];
        }

        console.log('Searching JobTech API:', JSON.stringify(searchBody));

        // Call JobTech JobSearch API
        const response = await fetch(`${JOBTECH_API}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(searchBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('JobTech API error:', errorText);
            throw new Error(`JobTech API error: ${response.status}`);
        }

        const data = await response.json();

        // Transform the results to our format
        const jobs = (data.hits || []).map(job => ({
            id: job.id,
            title: job.headline,
            employer: job.employer?.name || 'Okänd arbetsgivare',
            location: formatLocation(job.workplace_address),
            municipality: job.workplace_address?.municipality || null,
            region: job.workplace_address?.region || null,

            // Job details
            description: job.description?.text_formatted || job.description?.text || '',
            descriptionShort: truncateText(job.description?.text || '', 300),

            // Employment info
            employmentType: job.employment_type?.label || null,
            duration: job.duration?.label || null,
            workingHoursType: job.working_hours_type?.label || null,
            salaryType: job.salary_type?.label || null,
            salaryDescription: job.salary_description || null,

            // Dates
            publishedDate: job.publication_date,
            lastApplicationDate: job.application_deadline,

            // Application info - THIS IS KEY!
            application: {
                url: job.application_details?.url || null,
                email: job.application_details?.email || null,
                reference: job.application_details?.reference || null,
                otherInfo: job.application_details?.other || null
            },

            // Direct link to Platsbanken
            platsbankenUrl: `https://arbetsformedlingen.se/platsbanken/annonser/${job.id}`,

            // Skills/requirements
            mustHave: (job.must_have || []).map(s => ({
                type: s.type,
                label: s.label || s.concept?.label
            })),
            niceToHave: (job.nice_to_have || []).map(s => ({
                type: s.type,
                label: s.label || s.concept?.label
            })),

            // Employer info
            employerWebsite: job.employer?.url || null,
            employerOrgNumber: job.employer?.organization_number || null,

            // Logo if available
            logoUrl: job.logo_url || null
        }));

        return res.json({
            jobs,
            total: data.total?.value || jobs.length,
            meta: {
                query: q || null,
                occupationId: occupation_id || null,
                limit: searchBody.limit,
                offset: searchBody.offset,
                source: 'Arbetsförmedlingen Platsbanken',
                apiVersion: 'JobTech JobSearch API'
            }
        });

    } catch (error) {
        console.error('Error fetching jobs:', error);
        return res.status(500).json({
            error: 'Failed to fetch jobs',
            details: error.message
        });
    }
};

function formatLocation(address) {
    if (!address) return 'Sverige';
    const parts = [];
    if (address.city) parts.push(address.city);
    if (address.municipality && address.municipality !== address.city) {
        parts.push(address.municipality);
    }
    if (address.region && !parts.some(p => p.includes(address.region))) {
        parts.push(address.region);
    }
    return parts.length > 0 ? parts.join(', ') : 'Sverige';
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}
