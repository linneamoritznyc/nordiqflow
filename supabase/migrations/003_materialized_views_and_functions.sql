-- ============================================================
-- NordiqFlow — Migration 003: Materialized Views & Functions
-- ============================================================
-- Adds:
--   1. Materialized views for pre-computed analytics
--   2. Database functions for CityIQ dashboard
--   3. Municipality job snapshot infrastructure
--   4. Career path 2-hop materialized view
--   5. Trigger for automatic talent gap computation
-- ============================================================
-- Depends on: 002_complete_schema.sql (all base tables)
-- ============================================================

-- ============================================================
-- 1. MUNICIPALITY JOB SNAPSHOTS (time-series)
-- ============================================================
-- Daily snapshots of job ads per occupation per municipality
-- Populated by the sync script (scripts/sync-municipality-data.js)

CREATE TABLE IF NOT EXISTS municipality_job_snapshots (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    municipality_id TEXT REFERENCES municipalities(kod) ON DELETE CASCADE,
    occupation_id   TEXT REFERENCES occupations(id) ON DELETE CASCADE,
    snapshot_date   DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Job market data (from AF JobSearch API)
    active_jobs     INT NOT NULL DEFAULT 0,
    new_jobs_7d     INT DEFAULT 0,           -- new in last 7 days

    -- Employer breakdown (JSONB for flexibility)
    top_employers   JSONB,                    -- [{"name": "...", "count": 3}, ...]

    UNIQUE (municipality_id, occupation_id, snapshot_date)
);

CREATE INDEX idx_snapshots_municipality
    ON municipality_job_snapshots(municipality_id, snapshot_date DESC);
CREATE INDEX idx_snapshots_occupation
    ON municipality_job_snapshots(occupation_id);
CREATE INDEX idx_snapshots_date
    ON municipality_job_snapshots(snapshot_date DESC);

-- ============================================================
-- 2. MATERIALIZED VIEW: Municipality Overview
-- ============================================================
-- Pre-computed dashboard stats per municipality
-- Refreshed by: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_municipality_overview;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_municipality_overview AS
SELECT
    m.kod                           AS municipality_id,
    m.name                          AS municipality_name,
    m.size_tier,
    m.population,

    -- Latest snapshot stats
    COUNT(DISTINCT s.occupation_id) AS unique_occupations_hiring,
    COALESCE(SUM(s.active_jobs), 0) AS total_active_jobs,

    -- Talent gaps (latest snapshot)
    COUNT(DISTINCT CASE WHEN g.gap < 0 THEN g.occupation_id END) AS shortage_occupations,

    -- Snapshot freshness
    MAX(s.snapshot_date)            AS last_snapshot_date

FROM municipalities m
LEFT JOIN municipality_job_snapshots s
    ON s.municipality_id = m.kod
    AND s.snapshot_date = (
        SELECT MAX(snapshot_date)
        FROM municipality_job_snapshots
        WHERE municipality_id = m.kod
    )
LEFT JOIN municipal_talent_gaps g
    ON g.municipality_id = m.kod
    AND g.snapshot_date = (
        SELECT MAX(snapshot_date)
        FROM municipal_talent_gaps
        WHERE municipality_id = m.kod
    )
GROUP BY m.kod, m.name, m.size_tier, m.population;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_muni_overview_id
    ON mv_municipality_overview(municipality_id);

-- ============================================================
-- 3. MATERIALIZED VIEW: Top Shortage Occupations
-- ============================================================
-- Pre-computed: which occupations have the biggest shortages per municipality

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_municipality_shortages AS
SELECT
    g.municipality_id,
    m.name                      AS municipality_name,
    g.occupation_id,
    o.name_sv                   AS occupation_name,
    o.ssyk_code,
    g.open_positions,
    g.available_workers,
    g.gap,
    g.snapshot_date,

    -- Enrichments
    ss.median_monthly           AS median_salary,

    -- How many career transitions lead TO this occupation?
    (SELECT COUNT(*)
     FROM substitutability sub
     WHERE sub.to_occupation_id = g.occupation_id
     AND sub.level >= 50) AS transition_paths_in,

    -- Rank within municipality (1 = biggest shortage)
    ROW_NUMBER() OVER (
        PARTITION BY g.municipality_id
        ORDER BY g.gap ASC, g.open_positions DESC
    ) AS shortage_rank

FROM municipal_talent_gaps g
JOIN municipalities m ON g.municipality_id = m.kod
JOIN occupations o ON g.occupation_id = o.id
LEFT JOIN salary_stats ss ON ss.occupation_id = g.occupation_id
    AND ss.nuts3_code = m.nuts3_code
    AND ss.sample_year = (SELECT MAX(sample_year) FROM salary_stats)
WHERE g.snapshot_date = (
    SELECT MAX(snapshot_date)
    FROM municipal_talent_gaps
    WHERE municipality_id = g.municipality_id
)
AND g.gap < 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_shortages_pk
    ON mv_municipality_shortages(municipality_id, occupation_id);
CREATE INDEX IF NOT EXISTS idx_mv_shortages_rank
    ON mv_municipality_shortages(municipality_id, shortage_rank);

-- ============================================================
-- 4. MATERIALIZED VIEW: Career Paths (2-hop)
-- ============================================================
-- Pre-computed career transition chains: A → B → C
-- Essential for TalentFlow "where can you go from here?" feature

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_career_paths_2hop AS
WITH direct AS (
    -- 1-hop: A → B
    SELECT
        s.from_occupation_id    AS source_id,
        o_from.name_sv          AS source_name,
        s.to_occupation_id      AS target_id,
        o_to.name_sv            AS target_name,
        o_to.ssyk_code          AS target_ssyk,
        s.level                 AS score,
        1                       AS hops,
        NULL::TEXT              AS via_id,
        NULL::TEXT              AS via_name
    FROM substitutability s
    JOIN occupations o_from ON s.from_occupation_id = o_from.id
    JOIN occupations o_to   ON s.to_occupation_id   = o_to.id
    WHERE s.level >= 25
),
two_hop AS (
    -- 2-hop: A → B → C (where B is high-substitutability)
    SELECT
        s1.from_occupation_id   AS source_id,
        o_from.name_sv          AS source_name,
        s2.to_occupation_id     AS target_id,
        o_target.name_sv        AS target_name,
        o_target.ssyk_code      AS target_ssyk,
        -- Combined score: geometric mean of two hops
        ROUND(SQRT(s1.level::NUMERIC * s2.level::NUMERIC))::INT AS score,
        2                       AS hops,
        s1.to_occupation_id     AS via_id,
        o_via.name_sv           AS via_name
    FROM substitutability s1
    JOIN substitutability s2 ON s1.to_occupation_id = s2.from_occupation_id
    JOIN occupations o_from   ON s1.from_occupation_id = o_from.id
    JOIN occupations o_via    ON s1.to_occupation_id   = o_via.id
    JOIN occupations o_target ON s2.to_occupation_id   = o_target.id
    WHERE s1.level >= 50
      AND s2.level >= 50
      -- Don't loop back to source
      AND s2.to_occupation_id != s1.from_occupation_id
      -- Don't duplicate direct paths
      AND NOT EXISTS (
          SELECT 1 FROM substitutability d
          WHERE d.from_occupation_id = s1.from_occupation_id
            AND d.to_occupation_id = s2.to_occupation_id
      )
)
SELECT * FROM direct
UNION ALL
SELECT * FROM two_hop;

CREATE INDEX IF NOT EXISTS idx_mv_career_source
    ON mv_career_paths_2hop(source_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_mv_career_target
    ON mv_career_paths_2hop(target_id);

-- ============================================================
-- 5. DATABASE FUNCTIONS
-- ============================================================

-- Function: Get municipality dashboard stats
CREATE OR REPLACE FUNCTION get_municipality_stats(p_municipality_id TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'municipality', json_build_object(
            'id', m.kod,
            'name', m.name,
            'population', m.population,
            'size_tier', m.size_tier,
            'is_pilot', m.is_pilot
        ),
        'jobs', json_build_object(
            'total_active', COALESCE(SUM(s.active_jobs), 0),
            'unique_occupations', COUNT(DISTINCT s.occupation_id),
            'snapshot_date', MAX(s.snapshot_date)
        ),
        'shortages', (
            SELECT json_agg(shortage ORDER BY shortage->>'gap' ASC)
            FROM (
                SELECT json_build_object(
                    'occupation_id', g.occupation_id,
                    'occupation_name', o.name_sv,
                    'ssyk_code', o.ssyk_code,
                    'open_positions', g.open_positions,
                    'available_workers', g.available_workers,
                    'gap', g.gap
                ) AS shortage
                FROM municipal_talent_gaps g
                JOIN occupations o ON g.occupation_id = o.id
                WHERE g.municipality_id = p_municipality_id
                AND g.snapshot_date = (
                    SELECT MAX(snapshot_date)
                    FROM municipal_talent_gaps
                    WHERE municipality_id = p_municipality_id
                )
                AND g.gap < 0
                ORDER BY g.gap ASC
                LIMIT 20
            ) sub
        ),
        'transitions', (
            SELECT json_agg(trans)
            FROM (
                SELECT json_build_object(
                    'from_occupation', o_from.name_sv,
                    'to_occupation', o_to.name_sv,
                    'score', sub.level,
                    'to_occupation_id', sub.to_occupation_id
                ) AS trans
                FROM municipal_talent_gaps g
                JOIN substitutability sub ON sub.to_occupation_id = g.occupation_id
                JOIN occupations o_from ON sub.from_occupation_id = o_from.id
                JOIN occupations o_to ON sub.to_occupation_id = o_to.id
                WHERE g.municipality_id = p_municipality_id
                AND g.gap < 0
                AND sub.level >= 50
                AND g.snapshot_date = (
                    SELECT MAX(snapshot_date)
                    FROM municipal_talent_gaps
                    WHERE municipality_id = p_municipality_id
                )
                ORDER BY sub.level DESC, g.gap ASC
                LIMIT 30
            ) sub
        )
    ) INTO result
    FROM municipalities m
    LEFT JOIN municipality_job_snapshots s
        ON s.municipality_id = m.kod
        AND s.snapshot_date = (
            SELECT MAX(snapshot_date)
            FROM municipality_job_snapshots
            WHERE municipality_id = m.kod
        )
    WHERE m.kod = p_municipality_id
    GROUP BY m.kod, m.name, m.population, m.size_tier, m.is_pilot;

    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Calculate ROI for a training programme
CREATE OR REPLACE FUNCTION calculate_roi(
    p_municipality_id TEXT,
    p_occupation_id TEXT,
    p_persons INT DEFAULT 20,
    p_training_cost_per_person INT DEFAULT 150000,
    p_months_acceleration INT DEFAULT 2
)
RETURNS JSON AS $$
DECLARE
    v_median_salary INT;
    v_kommunalskatt NUMERIC := 0.2236;  -- Vetlanda 2024
    v_welfare_cost_monthly INT := 9000;  -- Average welfare/unemployment cost
    v_total_training_cost INT;
    v_annual_tax_revenue INT;
    v_annual_welfare_savings INT;
    v_annual_total_benefit INT;
    v_payback_months INT;
    v_five_year_roi NUMERIC;
    v_occupation_name TEXT;
BEGIN
    -- Get median salary for occupation in region
    SELECT ss.median_monthly, o.name_sv
    INTO v_median_salary, v_occupation_name
    FROM salary_stats ss
    JOIN municipalities m ON m.nuts3_code = ss.nuts3_code
    JOIN occupations o ON o.id = ss.occupation_id
    WHERE ss.occupation_id = p_occupation_id
    AND m.kod = p_municipality_id
    ORDER BY ss.sample_year DESC
    LIMIT 1;

    -- Fallback: use national average if no regional data
    IF v_median_salary IS NULL THEN
        SELECT ss.median_monthly, o.name_sv
        INTO v_median_salary, v_occupation_name
        FROM salary_stats ss
        JOIN occupations o ON o.id = ss.occupation_id
        WHERE ss.occupation_id = p_occupation_id
        ORDER BY ss.sample_year DESC
        LIMIT 1;
    END IF;

    -- Fallback salary estimate
    IF v_median_salary IS NULL THEN
        v_median_salary := 32000;  -- National average
        SELECT name_sv INTO v_occupation_name
        FROM occupations WHERE id = p_occupation_id;
    END IF;

    -- Calculate
    v_total_training_cost := p_persons * p_training_cost_per_person;
    v_annual_tax_revenue := ROUND(p_persons * v_median_salary * 12 * v_kommunalskatt);
    v_annual_welfare_savings := p_persons * v_welfare_cost_monthly * 12;
    v_annual_total_benefit := v_annual_tax_revenue + v_annual_welfare_savings;

    IF v_annual_total_benefit > 0 THEN
        v_payback_months := ROUND(v_total_training_cost::NUMERIC / (v_annual_total_benefit / 12.0));
    END IF;

    v_five_year_roi := ROUND(
        ((v_annual_total_benefit * 5.0 - v_total_training_cost) / v_total_training_cost * 100)::NUMERIC,
        1
    );

    RETURN json_build_object(
        'municipality_id', p_municipality_id,
        'occupation_id', p_occupation_id,
        'occupation_name', v_occupation_name,
        'inputs', json_build_object(
            'persons', p_persons,
            'training_cost_per_person', p_training_cost_per_person,
            'months_acceleration', p_months_acceleration,
            'median_salary', v_median_salary,
            'kommunalskatt', v_kommunalskatt,
            'welfare_cost_monthly', v_welfare_cost_monthly
        ),
        'results', json_build_object(
            'total_training_cost', v_total_training_cost,
            'annual_tax_revenue', v_annual_tax_revenue,
            'annual_welfare_savings', v_annual_welfare_savings,
            'annual_total_benefit', v_annual_total_benefit,
            'payback_months', v_payback_months,
            'five_year_roi_pct', v_five_year_roi,
            'five_year_net_benefit', (v_annual_total_benefit * 5 - v_total_training_cost)
        )
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get career transitions for a specific occupation
CREATE OR REPLACE FUNCTION get_career_transitions(
    p_occupation_id TEXT,
    p_min_score INT DEFAULT 25,
    p_include_2hop BOOLEAN DEFAULT TRUE
)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_build_object(
            'occupation', json_build_object(
                'id', o.id,
                'name', o.name_sv,
                'ssyk_code', o.ssyk_code
            ),
            'can_become', (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'id', cp.target_id,
                        'name', cp.target_name,
                        'ssyk_code', cp.target_ssyk,
                        'score', cp.score,
                        'hops', cp.hops,
                        'via_id', cp.via_id,
                        'via_name', cp.via_name
                    ) ORDER BY cp.score DESC, cp.hops ASC
                ), '[]'::json)
                FROM mv_career_paths_2hop cp
                WHERE cp.source_id = p_occupation_id
                AND cp.score >= p_min_score
                AND (p_include_2hop OR cp.hops = 1)
            ),
            'can_be_reached_from', (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'id', sub.from_occupation_id,
                        'name', o2.name_sv,
                        'score', sub.level
                    ) ORDER BY sub.level DESC
                ), '[]'::json)
                FROM substitutability sub
                JOIN occupations o2 ON sub.from_occupation_id = o2.id
                WHERE sub.to_occupation_id = p_occupation_id
                AND sub.level >= p_min_score
            )
        )
        FROM occupations o
        WHERE o.id = p_occupation_id
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 6. REFRESH FUNCTION (for pg_cron)
-- ============================================================
-- Call this to refresh all materialized views
-- Schedule with: SELECT cron.schedule('refresh-views', '0 5 * * *', 'SELECT refresh_all_views()');

CREATE OR REPLACE FUNCTION refresh_all_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_municipality_overview;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_municipality_shortages;
    REFRESH MATERIALIZED VIEW mv_career_paths_2hop;

    -- Log the refresh
    INSERT INTO data_sync_log (source, status, records_updated)
    VALUES ('materialized_view_refresh', 'success', 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. ADDITIONAL RLS POLICIES
-- ============================================================

-- Municipality job snapshots: public read
ALTER TABLE municipality_job_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_snapshots"
    ON municipality_job_snapshots FOR SELECT USING (TRUE);

-- Municipal talent gaps: already has RLS from 002, but ensure public read
-- (municipal data is not PII — it's aggregate statistics)

-- ============================================================
-- 8. ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================

-- Composite index for common CityIQ queries
CREATE INDEX IF NOT EXISTS idx_talent_gaps_composite
    ON municipal_talent_gaps(municipality_id, snapshot_date DESC, gap ASC);

-- Full-text search on occupation names (for autocomplete)
CREATE INDEX IF NOT EXISTS idx_occupations_name_trgm
    ON occupations USING GIN (name_sv gin_trgm_ops);

-- Substitutability lookup optimization
CREATE INDEX IF NOT EXISTS idx_sub_level_high
    ON substitutability(from_occupation_id, level DESC)
    WHERE level >= 50;

-- ============================================================
-- DONE.
-- New objects:
--   Tables: municipality_job_snapshots
--   Mat. Views: mv_municipality_overview, mv_municipality_shortages,
--               mv_career_paths_2hop
--   Functions: get_municipality_stats(), calculate_roi(),
--              get_career_transitions(), refresh_all_views()
-- ============================================================
