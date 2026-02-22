# NordiqFlow — Database Efficiency Strategy
# ==========================================
# Target: Every query < 500ms. Most queries < 50ms.
#
# Core principle: PRE-COMPUTE EVERYTHING. Never JOIN at read time.
# Inspired by LinkedIn (skills graph), Netflix (recommendations),
# Indeed (job analytics).
#
# Architecture layers:
#   1. SOURCE TABLES — Raw AF taxonomy data (write-heavy, rarely read directly)
#   2. PRE-COMPUTED TABLES — Denormalized, ready-to-serve (read-heavy)
#   3. CACHE TABLES — Dashboard snapshots, one row = one API response
#
# Refresh strategy:
#   - Source tables: Updated by import script (weekly for taxonomy, daily for jobs)
#   - Pre-computed: Refreshed by pg_cron after source updates
#   - Cache tables: Refreshed every 5 min (or on-demand after writes)
# ==========================================


-- ============================================================
-- LAYER 1: SOURCE TABLES (normalized, write-optimized)
-- ============================================================
-- These are your existing 002_complete_schema.sql tables.
-- Keep them as-is. They're the source of truth.
-- DON'T query these directly from the API. Ever.
--
-- occupations (430 rows)
-- skills (8,000 rows)
-- occupation_skill_relations (50,000 rows)
-- substitutability (51,000 rows)
-- demand_forecasts, salary_stats
-- municipalities, municipal_talent_gaps
-- user_profiles, user_profiles_career, user_skills
-- career_recommendations, etc.


-- ============================================================
-- LAYER 2: PRE-COMPUTED TABLES (denormalized, read-optimized)
-- ============================================================
-- These replace JOINs at query time with pre-computed results.
-- Populated by triggers or pg_cron refresh functions.

-- ────────────────────────────────────────────────────────────
-- 2A. OCCUPATION GRAPH (LinkedIn pattern)
-- ────────────────────────────────────────────────────────────
-- Instead of: SELECT ... FROM substitutability JOIN occupations JOIN ...
-- We store: One JSONB blob per occupation with ALL its data.
-- Query: SELECT * FROM occupation_graph WHERE id = ? → <5ms

CREATE TABLE IF NOT EXISTS occupation_graph (
    id              TEXT PRIMARY KEY,              -- AF concept ID
    name_sv         TEXT NOT NULL,
    ssyk_code       TEXT,
    ssyk_level_1    TEXT,

    -- Pre-computed: all 1-hop transitions (denormalized)
    -- [{id, name, score, ssyk_code}, ...]
    can_become      JSONB NOT NULL DEFAULT '[]',   -- Sorted by score DESC
    can_be_reached  JSONB NOT NULL DEFAULT '[]',   -- Who can transition TO this

    -- Pre-computed: 2-hop transitions
    -- [{id, name, score, via_id, via_name, ssyk_code}, ...]
    can_become_2hop JSONB NOT NULL DEFAULT '[]',

    -- Pre-computed: required skills for this occupation
    -- [{id, name, importance}, ...]
    skills          JSONB NOT NULL DEFAULT '[]',

    -- Demand data
    demand_level    TEXT,                           -- from Yrkesbarometer
    median_salary   INT,                           -- Latest national median

    -- Metadata
    total_transitions INT DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- This is the ONLY table TalentFlow reads for career paths.
-- One query, zero JOINs, <5ms guaranteed.
CREATE INDEX idx_occ_graph_name ON occupation_graph USING GIN (name_sv gin_trgm_ops);
CREATE INDEX idx_occ_graph_ssyk ON occupation_graph(ssyk_code);

-- ────────────────────────────────────────────────────────────
-- 2B. MUNICIPALITY DASHBOARD CACHE (Indeed pattern)
-- ────────────────────────────────────────────────────────────
-- Instead of: 6 queries with JOINs across 4 tables
-- We store: One row per municipality with ALL dashboard data as JSONB.
-- Query: SELECT * FROM municipality_dashboard WHERE id = ? → <5ms

CREATE TABLE IF NOT EXISTS municipality_dashboard (
    id              TEXT PRIMARY KEY,              -- Kommun code e.g. "0684"
    name            TEXT NOT NULL,
    population      INT,
    size_tier       TEXT,

    -- Pre-computed KPI metrics
    total_active_jobs    INT DEFAULT 0,
    unique_occupations   INT DEFAULT 0,
    shortage_count       INT DEFAULT 0,
    unique_employers     INT DEFAULT 0,

    -- Pre-computed: Top shortage occupations (full data)
    -- [{occupation_id, name, ssyk_code, open_positions, gap, employers: [...],
    --   transition_paths: [{from_name, from_id, score}]}]
    shortages       JSONB NOT NULL DEFAULT '[]',

    -- Pre-computed: Career transitions into shortage occupations
    -- [{from_name, from_id, to_name, to_id, score}]
    transitions     JSONB NOT NULL DEFAULT '[]',

    -- Pre-computed: Regional comparison
    -- [{municipality_id, name, total_jobs, population}]
    regional_comparison JSONB DEFAULT '[]',

    -- Pre-computed: Top employers
    -- [{name, job_count}]
    top_employers   JSONB DEFAULT '[]',

    -- Snapshot metadata
    snapshot_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    data_source     TEXT DEFAULT 'af_api',
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- CityIQ dashboard = ONE query to this table. That's it.
-- No JOINs, no aggregations, no window functions at read time.

-- ────────────────────────────────────────────────────────────
-- 2C. ROI PRE-COMPUTED (per municipality × occupation)
-- ────────────────────────────────────────────────────────────
-- Instead of: compute ROI live in PL/pgSQL function
-- We store: pre-computed ROI for every shortage occupation
-- The frontend sliders just scale these base numbers client-side

CREATE TABLE IF NOT EXISTS roi_estimates (
    municipality_id TEXT NOT NULL,
    occupation_id   TEXT NOT NULL,
    occupation_name TEXT NOT NULL,
    median_salary   INT NOT NULL,
    kommunalskatt   NUMERIC(5,4) NOT NULL,

    -- Pre-computed for N=1 person (frontend multiplies by slider value)
    annual_tax_per_person       INT NOT NULL,  -- salary × 12 × kommunalskatt
    annual_welfare_saving       INT NOT NULL DEFAULT 108000,  -- 9000 × 12
    annual_benefit_per_person   INT NOT NULL,  -- tax + welfare

    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (municipality_id, occupation_id)
);

-- ROI slider just does: benefit_per_person × N_persons. Pure client-side math.
-- No API call needed when user moves a slider.


-- ============================================================
-- LAYER 3: REFRESH FUNCTIONS
-- ============================================================
-- These populate Layer 2 from Layer 1.
-- Run by pg_cron or after data imports.

-- ────────────────────────────────────────────────────────────
-- 3A. Refresh occupation graph
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION refresh_occupation_graph()
RETURNS void AS $$
DECLARE
    occ RECORD;
BEGIN
    -- For each occupation, pre-compute all its data
    FOR occ IN SELECT id, name_sv, ssyk_code, ssyk_level_1 FROM occupations
    LOOP
        INSERT INTO occupation_graph (id, name_sv, ssyk_code, ssyk_level_1,
            can_become, can_be_reached, can_become_2hop, skills,
            total_transitions)
        VALUES (
            occ.id, occ.name_sv, occ.ssyk_code, occ.ssyk_level_1,

            -- can_become: direct transitions OUT
            COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'id', s.to_occupation_id,
                    'name', o2.name_sv,
                    'score', s.level,
                    'ssyk', o2.ssyk_code
                ) ORDER BY s.level DESC)
                FROM substitutability s
                JOIN occupations o2 ON o2.id = s.to_occupation_id
                WHERE s.from_occupation_id = occ.id
            ), '[]'::jsonb),

            -- can_be_reached: transitions IN
            COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'id', s.from_occupation_id,
                    'name', o2.name_sv,
                    'score', s.level
                ) ORDER BY s.level DESC)
                FROM substitutability s
                JOIN occupations o2 ON o2.id = s.from_occupation_id
                WHERE s.to_occupation_id = occ.id
            ), '[]'::jsonb),

            -- can_become_2hop: 2-hop paths (A→B→C where A=this occ)
            COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'id', s2.to_occupation_id,
                    'name', o3.name_sv,
                    'score', ROUND(SQRT(s1.level::numeric * s2.level::numeric)),
                    'via_id', s1.to_occupation_id,
                    'via_name', o2.name_sv,
                    'ssyk', o3.ssyk_code
                ) ORDER BY SQRT(s1.level::numeric * s2.level::numeric) DESC)
                FROM substitutability s1
                JOIN substitutability s2 ON s1.to_occupation_id = s2.from_occupation_id
                JOIN occupations o2 ON o2.id = s1.to_occupation_id
                JOIN occupations o3 ON o3.id = s2.to_occupation_id
                WHERE s1.from_occupation_id = occ.id
                AND s1.level >= 50 AND s2.level >= 50
                AND s2.to_occupation_id != occ.id
                -- Exclude direct transitions (they're in can_become)
                AND NOT EXISTS (
                    SELECT 1 FROM substitutability d
                    WHERE d.from_occupation_id = occ.id
                    AND d.to_occupation_id = s2.to_occupation_id
                )
                LIMIT 50
            ), '[]'::jsonb),

            -- skills
            COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'id', sk.id,
                    'name', sk.name_sv,
                    'importance', osr.importance
                ) ORDER BY osr.importance)
                FROM occupation_skill_relations osr
                JOIN skills sk ON sk.id = osr.skill_id
                WHERE osr.occupation_id = occ.id
            ), '[]'::jsonb),

            -- total_transitions
            (SELECT COUNT(*) FROM substitutability WHERE from_occupation_id = occ.id)
        )
        ON CONFLICT (id) DO UPDATE SET
            name_sv = EXCLUDED.name_sv,
            ssyk_code = EXCLUDED.ssyk_code,
            ssyk_level_1 = EXCLUDED.ssyk_level_1,
            can_become = EXCLUDED.can_become,
            can_be_reached = EXCLUDED.can_be_reached,
            can_become_2hop = EXCLUDED.can_become_2hop,
            skills = EXCLUDED.skills,
            total_transitions = EXCLUDED.total_transitions,
            updated_at = NOW();
    END LOOP;

    -- Log
    INSERT INTO data_sync_log (source, status, records_updated)
    VALUES ('refresh_occupation_graph', 'success',
        (SELECT COUNT(*) FROM occupation_graph));
END;
$$ LANGUAGE plpgsql;


-- ────────────────────────────────────────────────────────────
-- 3B. Refresh municipality dashboard
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION refresh_municipality_dashboard(p_municipality_id TEXT)
RETURNS void AS $$
DECLARE
    v_muni RECORD;
    v_shortages JSONB;
    v_transitions JSONB;
    v_top_employers JSONB;
    v_total_jobs INT;
    v_unique_occs INT;
    v_unique_employers INT;
BEGIN
    SELECT * INTO v_muni FROM municipalities WHERE kod = p_municipality_id;
    IF NOT FOUND THEN RETURN; END IF;

    -- Get latest snapshots
    SELECT
        COALESCE(SUM(active_jobs), 0),
        COUNT(DISTINCT occupation_id)
    INTO v_total_jobs, v_unique_occs
    FROM municipality_job_snapshots
    WHERE municipality_id = p_municipality_id
    AND snapshot_date = (
        SELECT MAX(snapshot_date) FROM municipality_job_snapshots
        WHERE municipality_id = p_municipality_id
    );

    -- Build shortages JSONB with embedded transition paths
    SELECT jsonb_agg(shortage ORDER BY (shortage->>'open_positions')::int DESC)
    INTO v_shortages
    FROM (
        SELECT jsonb_build_object(
            'occupation_id', g.occupation_id,
            'name', o.name_sv,
            'ssyk_code', o.ssyk_code,
            'open_positions', g.open_positions,
            'gap', g.gap,
            'transition_paths', COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'from_name', o2.name_sv,
                    'from_id', s.from_occupation_id,
                    'score', s.level
                ) ORDER BY s.level DESC)
                FROM substitutability s
                JOIN occupations o2 ON o2.id = s.from_occupation_id
                WHERE s.to_occupation_id = g.occupation_id
                AND s.level >= 50
                LIMIT 5
            ), '[]'::jsonb)
        ) AS shortage
        FROM municipal_talent_gaps g
        JOIN occupations o ON o.id = g.occupation_id
        WHERE g.municipality_id = p_municipality_id
        AND g.snapshot_date = (
            SELECT MAX(snapshot_date) FROM municipal_talent_gaps
            WHERE municipality_id = p_municipality_id
        )
        AND g.gap < 0
        ORDER BY g.gap ASC
        LIMIT 20
    ) sub;

    -- Build transitions JSONB
    SELECT jsonb_agg(trans ORDER BY (trans->>'score')::int DESC)
    INTO v_transitions
    FROM (
        SELECT DISTINCT jsonb_build_object(
            'from_name', o_from.name_sv,
            'from_id', s.from_occupation_id,
            'to_name', o_to.name_sv,
            'to_id', s.to_occupation_id,
            'score', s.level
        ) AS trans
        FROM municipal_talent_gaps g
        JOIN substitutability s ON s.to_occupation_id = g.occupation_id
        JOIN occupations o_from ON o_from.id = s.from_occupation_id
        JOIN occupations o_to ON o_to.id = s.to_occupation_id
        WHERE g.municipality_id = p_municipality_id
        AND g.gap < 0 AND s.level >= 50
        AND g.snapshot_date = (
            SELECT MAX(snapshot_date) FROM municipal_talent_gaps
            WHERE municipality_id = p_municipality_id
        )
        ORDER BY (jsonb_build_object('score', s.level)->>'score')::int DESC
        LIMIT 30
    ) sub;

    -- Count unique employers
    SELECT COUNT(DISTINCT e.value->>'name')
    INTO v_unique_employers
    FROM municipality_job_snapshots mjs,
         jsonb_array_elements(mjs.top_employers) AS e
    WHERE mjs.municipality_id = p_municipality_id
    AND mjs.snapshot_date = (
        SELECT MAX(snapshot_date) FROM municipality_job_snapshots
        WHERE municipality_id = p_municipality_id
    );

    -- Upsert dashboard
    INSERT INTO municipality_dashboard (
        id, name, population, size_tier,
        total_active_jobs, unique_occupations, shortage_count, unique_employers,
        shortages, transitions, snapshot_date
    ) VALUES (
        p_municipality_id, v_muni.name, v_muni.population, v_muni.size_tier,
        v_total_jobs, v_unique_occs,
        COALESCE(jsonb_array_length(v_shortages), 0),
        COALESCE(v_unique_employers, 0),
        COALESCE(v_shortages, '[]'::jsonb),
        COALESCE(v_transitions, '[]'::jsonb),
        CURRENT_DATE
    )
    ON CONFLICT (id) DO UPDATE SET
        total_active_jobs = EXCLUDED.total_active_jobs,
        unique_occupations = EXCLUDED.unique_occupations,
        shortage_count = EXCLUDED.shortage_count,
        unique_employers = EXCLUDED.unique_employers,
        shortages = EXCLUDED.shortages,
        transitions = EXCLUDED.transitions,
        snapshot_date = EXCLUDED.snapshot_date,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Refresh ALL municipality dashboards
CREATE OR REPLACE FUNCTION refresh_all_dashboards()
RETURNS void AS $$
DECLARE
    muni RECORD;
BEGIN
    FOR muni IN SELECT kod FROM municipalities WHERE is_pilot = TRUE
    LOOP
        PERFORM refresh_municipality_dashboard(muni.kod);
    END LOOP;

    INSERT INTO data_sync_log (source, status)
    VALUES ('refresh_all_dashboards', 'success');
END;
$$ LANGUAGE plpgsql;


-- ────────────────────────────────────────────────────────────
-- 3C. Refresh ROI estimates
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION refresh_roi_estimates()
RETURNS void AS $$
BEGIN
    -- For each municipality × shortage occupation, pre-compute ROI base numbers
    INSERT INTO roi_estimates (
        municipality_id, occupation_id, occupation_name,
        median_salary, kommunalskatt,
        annual_tax_per_person, annual_welfare_saving, annual_benefit_per_person
    )
    SELECT
        g.municipality_id,
        g.occupation_id,
        o.name_sv,
        COALESCE(ss.median_monthly, 32000) AS median_salary,
        0.2236 AS kommunalskatt,  -- TODO: per-municipality from a tax table
        ROUND(COALESCE(ss.median_monthly, 32000) * 12 * 0.2236) AS annual_tax,
        108000 AS welfare,  -- 9000 × 12
        ROUND(COALESCE(ss.median_monthly, 32000) * 12 * 0.2236) + 108000 AS total
    FROM municipal_talent_gaps g
    JOIN occupations o ON o.id = g.occupation_id
    LEFT JOIN salary_stats ss ON ss.occupation_id = g.occupation_id
        AND ss.nuts3_code = (SELECT nuts3_code FROM municipalities WHERE kod = g.municipality_id)
        AND ss.sample_year = (SELECT MAX(sample_year) FROM salary_stats)
    WHERE g.gap < 0
    AND g.snapshot_date = (
        SELECT MAX(snapshot_date) FROM municipal_talent_gaps
        WHERE municipality_id = g.municipality_id
    )
    ON CONFLICT (municipality_id, occupation_id) DO UPDATE SET
        occupation_name = EXCLUDED.occupation_name,
        median_salary = EXCLUDED.median_salary,
        annual_tax_per_person = EXCLUDED.annual_tax_per_person,
        annual_benefit_per_person = EXCLUDED.annual_benefit_per_person,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- LAYER 4: SCHEDULING (pg_cron)
-- ============================================================
-- Taxonomy data changes weekly → refresh graph weekly
-- Job data changes daily → refresh dashboards daily
-- ROI depends on salary data → refresh weekly

-- SELECT cron.schedule('refresh-occ-graph',  '0 4 * * 0', 'SELECT refresh_occupation_graph()');
-- SELECT cron.schedule('refresh-dashboards', '0 5 * * *', 'SELECT refresh_all_dashboards()');
-- SELECT cron.schedule('refresh-roi',        '0 4 * * 1', 'SELECT refresh_roi_estimates()');


-- ============================================================
-- EXPECTED QUERY PERFORMANCE
-- ============================================================
--
-- Query                           | Table                    | Expected
-- --------------------------------|--------------------------|----------
-- Career paths for occupation X   | occupation_graph         | < 5ms
-- Municipality dashboard          | municipality_dashboard   | < 5ms
-- Occupation autocomplete         | occupation_graph (GIN)   | < 10ms
-- ROI base data                   | roi_estimates            | < 5ms
-- Full CityIQ page load           | 1 query to dashboard     | < 50ms
-- Full TalentFlow career page     | 1 query to graph         | < 50ms
--
-- Network overhead (Vercel→Supabase): ~30-60ms per request
-- Total API response time: < 100ms for any single endpoint
--
-- Compare to current design:
-- - Career 2-hop: recursive CTE = 200-800ms
-- - Dashboard: 6 JOINed queries = 500-2000ms
-- - Autocomplete: already fast (GIN trigram) = 5ms


-- ============================================================
-- EDGE CACHING (Vercel layer)
-- ============================================================
-- For the API endpoints, add Cache-Control headers:
--
-- Occupation graph: cache 1 hour (taxonomy changes weekly)
--   res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
--
-- Municipality dashboard: cache 5 minutes (job data changes daily)
--   res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
--
-- ROI estimates: cache 1 hour
--   res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
--
-- Autocomplete: cache 24 hours (occupation list is static)
--   res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
--
-- This means: first request hits Supabase (~100ms).
-- All subsequent requests from Vercel edge: ~5ms (served from CDN).


-- ============================================================
-- WHAT TO DELETE FROM CURRENT SCHEMA
-- ============================================================
-- These become unnecessary with Layer 2:
--
-- DELETE: mv_municipality_overview (replaced by municipality_dashboard)
-- DELETE: mv_municipality_shortages (replaced by municipality_dashboard.shortages)
-- DELETE: mv_career_paths_2hop (replaced by occupation_graph.can_become_2hop)
-- DELETE: get_municipality_stats() function (replaced by single table read)
-- DELETE: calculate_roi() function (replaced by roi_estimates + client math)
-- DELETE: get_career_transitions() function (replaced by occupation_graph)
--
-- The materialized views were a step in the right direction but they
-- still require JOINs at read time. The denormalized tables don't.
