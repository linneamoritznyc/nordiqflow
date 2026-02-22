/**
 * API endpoint: ROI Calculator for CityIQ
 * GET /api/roi-calculator?municipality=0684&occupation_id=xxx&persons=20
 * POST /api/roi-calculator { municipality, occupation_id, persons, training_cost, salary, months }
 *
 * Calculates fiscal ROI of investing in career transitions / training programmes.
 * Core CityIQ value proposition: municipalities can see the fiscal return
 * on investing in reskilling their unemployed residents.
 *
 * Formula:
 *   Annual tax revenue = persons × salary × 12 × kommunalskatt (22.36%)
 *   Annual welfare savings = persons × 9,000 SEK/month × 12
 *   Payback = training_cost / (annual_benefit / 12)
 *   5-year ROI = ((annual_benefit × 5 - total_cost) / total_cost) × 100
 */

const { getSupabase, loadLocalData, setCorsHeaders, sendError } = require('./_lib/supabase');

// Default parameters
const DEFAULTS = {
    kommunalskatt: 0.2236,          // Vetlanda kommun 2024
    welfareCostMonthly: 9000,       // Average försörjningsstöd + AK-kassa cost
    defaultSalary: 32000,           // National median if no data
    defaultTrainingCost: 150000,    // Per person
    defaultPersons: 20,
    defaultMonthsAcceleration: 2,
};

// Approximate median salaries by SSYK level-1 (fallback if no DB data)
const SSYK_SALARY_ESTIMATES = {
    '1': 52000, // Chefer
    '2': 45000, // Specialister
    '3': 38000, // Tekniker
    '4': 30000, // Administration
    '5': 28000, // Service, omsorg, försäljning
    '6': 28000, // Jordbruk, trädgård, skog, fiske
    '7': 33000, // Byggverksamhet, tillverkning
    '8': 31000, // Maskinoperatörer, transport
    '9': 26000, // Servicepersonal utan utbildningskrav
};

module.exports = async (req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        let params;
        if (req.method === 'POST') {
            params = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        } else if (req.method === 'GET') {
            params = req.query;
        } else {
            return sendError(res, 405, 'Use GET or POST.');
        }

        const {
            municipality = '0684',
            occupation_id,
            occupation_name,
            persons = DEFAULTS.defaultPersons,
            training_cost = DEFAULTS.defaultTrainingCost,
            salary,
            months_acceleration = DEFAULTS.defaultMonthsAcceleration,
            kommunalskatt = DEFAULTS.kommunalskatt,
        } = params;

        // Resolve occupation
        let occId = occupation_id;
        let occName = occupation_name || null;
        let medianSalary = salary ? parseInt(salary) : null;
        let ssykCode = null;

        // Try Supabase
        const supabase = getSupabase();
        if (supabase && occId) {
            const { data } = await supabase.rpc('calculate_roi', {
                p_municipality_id: municipality,
                p_occupation_id: occId,
                p_persons: parseInt(persons),
                p_training_cost_per_person: parseInt(training_cost),
                p_months_acceleration: parseInt(months_acceleration),
            });
            if (data) {
                return res.json({ ...data, meta: { source: 'supabase' } });
            }
        }

        // Fallback: calculate locally
        const occupations = loadLocalData('occupations.json');

        if (occId && occupations?.[occId]) {
            occName = occupations[occId].name;
            ssykCode = occupations[occId].ssykCode;
        } else if (occupation_name && occupations) {
            const nameLower = occupation_name.toLowerCase();
            for (const [id, occ] of Object.entries(occupations)) {
                if (occ.name.toLowerCase().includes(nameLower)) {
                    occId = id;
                    occName = occ.name;
                    ssykCode = occ.ssykCode;
                    break;
                }
            }
        }

        // Estimate salary if not provided
        if (!medianSalary && ssykCode) {
            const level1 = ssykCode.charAt(0);
            medianSalary = SSYK_SALARY_ESTIMATES[level1] || DEFAULTS.defaultSalary;
        }
        if (!medianSalary) medianSalary = DEFAULTS.defaultSalary;

        const nPersons = parseInt(persons);
        const nTrainingCost = parseInt(training_cost);
        const nMonths = parseInt(months_acceleration);
        const nKommunalskatt = parseFloat(kommunalskatt);

        // ── ROI Calculation ────────────────────────────
        const totalTrainingCost = nPersons * nTrainingCost;
        const annualTaxRevenue = Math.round(nPersons * medianSalary * 12 * nKommunalskatt);
        const annualWelfareSavings = nPersons * DEFAULTS.welfareCostMonthly * 12;
        const annualTotalBenefit = annualTaxRevenue + annualWelfareSavings;

        const paybackMonths = annualTotalBenefit > 0
            ? Math.round(totalTrainingCost / (annualTotalBenefit / 12))
            : null;

        const fiveYearNetBenefit = annualTotalBenefit * 5 - totalTrainingCost;
        const fiveYearRoiPct = totalTrainingCost > 0
            ? Math.round((fiveYearNetBenefit / totalTrainingCost) * 1000) / 10
            : 0;

        // Monthly breakdown for charts
        const monthlyBreakdown = [];
        let cumulativeBenefit = 0;
        for (let m = 1; m <= 60; m++) {
            cumulativeBenefit += annualTotalBenefit / 12;
            monthlyBreakdown.push({
                month: m,
                cumulativeBenefit: Math.round(cumulativeBenefit),
                cumulativeCost: totalTrainingCost,
                net: Math.round(cumulativeBenefit - totalTrainingCost),
                breakeven: cumulativeBenefit >= totalTrainingCost,
            });
        }

        return res.json({
            municipalityId: municipality,
            occupationId: occId || null,
            occupationName: occName || 'Generell beräkning',
            ssykCode,

            inputs: {
                persons: nPersons,
                trainingCostPerPerson: nTrainingCost,
                monthsAcceleration: nMonths,
                medianSalary,
                kommunalskatt: nKommunalskatt,
                welfareCostMonthly: DEFAULTS.welfareCostMonthly,
            },

            results: {
                totalTrainingCost,
                annualTaxRevenue,
                annualWelfareSavings,
                annualTotalBenefit,
                paybackMonths,
                fiveYearRoiPct,
                fiveYearNetBenefit,

                // Per-person metrics
                perPerson: {
                    trainingCost: nTrainingCost,
                    annualTaxReturn: Math.round(medianSalary * 12 * nKommunalskatt),
                    annualWelfareSaving: DEFAULTS.welfareCostMonthly * 12,
                    annualTotalReturn: Math.round(medianSalary * 12 * nKommunalskatt + DEFAULTS.welfareCostMonthly * 12),
                },
            },

            monthlyBreakdown: monthlyBreakdown.filter(m => m.month <= 36), // First 3 years

            meta: {
                source: 'local_calculation',
                salarySource: salary ? 'user_provided' : (ssykCode ? 'ssyk_estimate' : 'national_average'),
                formula: 'Annual benefit = (persons × salary × 12 × kommunalskatt) + (persons × 9000 × 12)',
                note: 'Based on IFAU Rapport 2024:17 methodology. Kommunalskatt = Vetlanda 2024.',
            },
        });

    } catch (error) {
        console.error('Error in roi-calculator:', error);
        return sendError(res, 500, 'Internal server error', error.message);
    }
};
