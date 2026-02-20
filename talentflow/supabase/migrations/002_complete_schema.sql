-- ============================================================
-- NordiqFlow — Complete Supabase Schema
-- ============================================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Order matters: run top to bottom.
-- ============================================================
-- ============================================================
-- 0. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- fuzzy text search
CREATE EXTENSION IF NOT EXISTS "unaccent";       -- Swedish character normalisation
-- ============================================================
-- 1. TAXONOMY — AF / JobTech Dev data
--    Source: taxonomy.api.jobtechdev.se
-- ============================================================
-- 430 Swedish occupations at SSYK-4 level
CREATE TABLE occupations (
  id              TEXT PRIMARY KEY,              -- AF concept_id  e.g. "DJh5_yyF_Cks"
  ssyk_code       TEXT UNIQUE,                   -- e.g. "5221"
  name_sv         TEXT NOT NULL,
  name_en         TEXT,
  description_sv  TEXT,
  ssyk_level_1    TEXT,                          -- Major group      e.g. "5"
  ssyk_level_2    TEXT,                          -- Sub-major group  e.g. "52"
  ssyk_level_3    TEXT,                          -- Minor group      e.g. "522"
  automation_risk NUMERIC(4,3),                  -- 0.0–1.0, from ALM-hypotesen
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_occupations_ssyk    ON occupations(ssyk_code);
CREATE INDEX idx_occupations_name_sv ON occupations USING GIN (name_sv gin_trgm_ops);
CREATE INDEX idx_occupations_name_en ON occupations USING GIN (name_en gin_trgm_ops);
-- 8,000+ competency "skill atoms"
CREATE TABLE skills (
  id          TEXT PRIMARY KEY,                  -- AF concept_id
  name_sv     TEXT NOT NULL,
  name_en     TEXT,
  type        TEXT CHECK (type IN (
                'skill', 'knowledge', 'ability',
                'tool', 'certification', 'language'
              )),
  esco_uri    TEXT,                              -- EU ESCO mapping if available
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_skills_name_sv ON skills USING GIN (name_sv gin_trgm_ops);
CREATE INDEX idx_skills_type    ON skills(type);
-- Which skills each occupation requires
-- Source: occupation-skill-relations.json
CREATE TABLE occupation_skill_relations (
  occupation_id  TEXT REFERENCES occupations(id) ON DELETE CASCADE,
  skill_id       TEXT REFERENCES skills(id)       ON DELETE CASCADE,
  importance     TEXT CHECK (importance IN ('required', 'preferred', 'optional')),
  PRIMARY KEY (occupation_id, skill_id)
);
CREATE INDEX idx_osr_occupation ON occupation_skill_relations(occupation_id);
CREATE INDEX idx_osr_skill      ON occupation_skill_relations(skill_id);
-- 51,000+ pre-computed career transitions
-- Source: substitutability-relations-between-occupations.json
-- NOTE: Matrix is non-symmetric. A→B ≠ B→A
CREATE TABLE substitutability (
  from_occupation_id  TEXT REFERENCES occupations(id) ON DELETE CASCADE,
  to_occupation_id    TEXT REFERENCES occupations(id) ON DELETE CASCADE,
  level               SMALLINT NOT NULL CHECK (level IN (25, 50, 75)),
  -- 25 = low, 50 = medium, 75 = high
  PRIMARY KEY (from_occupation_id, to_occupation_id)
);
CREATE INDEX idx_sub_from ON substitutability(from_occupation_id, level DESC);
CREATE INDEX idx_sub_to   ON substitutability(to_occupation_id);
-- Yrkesbarometer: 5-year demand forecasts per occupation per region
-- Source: AF Yrkesbarometer API, updated annually
CREATE TABLE demand_forecasts (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  occupation_id  TEXT REFERENCES occupations(id) ON DELETE CASCADE,
  nuts3_code     TEXT NOT NULL,                  -- Region e.g. "SE110" = Stockholm
  region_name    TEXT,
  forecast_year  SMALLINT NOT NULL,              -- e.g. 2026, 2027, 2028, 2029, 2030
  demand_level   TEXT CHECK (demand_level IN (
                   'very_high', 'high', 'balanced', 'low', 'very_low'
                 )),
  demand_score   NUMERIC(5,2),                   -- normalised 0–100
  open_positions INT,                            -- current active listings
  source_date    DATE,
  UNIQUE (occupation_id, nuts3_code, forecast_year)
);
CREATE INDEX idx_demand_occupation ON demand_forecasts(occupation_id);
CREATE INDEX idx_demand_region     ON demand_forecasts(nuts3_code);
CREATE INDEX idx_demand_year       ON demand_forecasts(forecast_year);
-- Salary statistics per occupation and region
-- Source: SCB lönestatistik + AF vacancy data
CREATE TABLE salary_stats (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  occupation_id   TEXT REFERENCES occupations(id) ON DELETE CASCADE,
  nuts3_code      TEXT NOT NULL,
  median_monthly  INT,                           -- SEK/month
  p25_monthly     INT,
  p75_monthly     INT,
  sample_year     SMALLINT,
  UNIQUE (occupation_id, nuts3_code, sample_year)
);
CREATE INDEX idx_salary_occupation ON salary_stats(occupation_id);
-- ============================================================
-- 2. USERS & AUTHENTICATION
--    Supabase Auth handles the auth.users table automatically.
--    This extends it with NordiqFlow-specific profile data.
-- ============================================================
CREATE TABLE user_profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bankid_verified     BOOLEAN DEFAULT FALSE,
  bankid_verified_at  TIMESTAMPTZ,
  -- Research consent (for IFAU RCT)
  research_consent    BOOLEAN DEFAULT FALSE,
  research_consent_at TIMESTAMPTZ,
  rct_arm             TEXT CHECK (rct_arm IN ('treatment', 'control', NULL)),
  -- Personal data (GDPR: minimal, user-provided)
  display_name        TEXT,
  municipality_code   TEXT,                      -- Kommunikod e.g. "0684" = Vetlanda
  -- Subscription
  plan                TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  plan_started_at     TIMESTAMPTZ,
  plan_expires_at     TIMESTAMPTZ,
  -- Timestamps
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================================
-- 3. TALENTFLOW — B2C career matching
-- ============================================================
-- A user's saved occupation profile (their "current job + skills")
CREATE TABLE user_profiles_career (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id              UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  current_occupation_id TEXT REFERENCES occupations(id),
  label                TEXT DEFAULT 'My Profile',   -- user can save multiple
  is_primary           BOOLEAN DEFAULT TRUE,
  raw_cv_text          TEXT,                         -- stored for re-parsing only
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_career_user ON user_profiles_career(user_id);
-- Skills extracted from a user's CV or manually selected
CREATE TABLE user_skills (
  user_profile_career_id  UUID REFERENCES user_profiles_career(id) ON DELETE CASCADE,
  skill_id                TEXT REFERENCES skills(id) ON DELETE CASCADE,
  source                  TEXT CHECK (source IN ('cv_extracted', 'manual', 'inferred')),
  confidence              NUMERIC(4,3) DEFAULT 1.0,  -- NLP confidence 0–1
  PRIMARY KEY (user_profile_career_id, skill_id)
);
CREATE INDEX idx_user_skills_profile ON user_skills(user_profile_career_id);
-- Stored career recommendations (cached per user + profile)
CREATE TABLE career_recommendations (
  id                      UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_profile_career_id  UUID REFERENCES user_profiles_career(id) ON DELETE CASCADE,
  target_occupation_id    TEXT REFERENCES occupations(id),
  -- Composite score components (see algoritmen.html)
  score_total             NUMERIC(5,3),           -- S(c,t) 0–1
  score_substitutability  NUMERIC(5,3),           -- sub(c,t)
  score_skill_match       NUMERIC(5,3),           -- M(c,t)
  score_demand            NUMERIC(5,3),           -- D(t)
  score_market            NUMERIC(5,3),           -- K(t)
  score_salary_delta      NUMERIC(5,3),           -- ΔL(c,t)
  skill_match_pct         NUMERIC(5,2),           -- e.g. 85.00 (%)
  salary_delta_monthly    INT,                    -- SEK/month difference
  generated_at            TIMESTAMPTZ DEFAULT NOW(),
  nuts3_code              TEXT                    -- region context
);
CREATE INDEX idx_rec_profile  ON career_recommendations(user_profile_career_id, score_total DESC);
CREATE INDEX idx_rec_target   ON career_recommendations(target_occupation_id);
-- Skill gaps per recommendation (which skills are missing)
CREATE TABLE recommendation_skill_gaps (
  recommendation_id  UUID REFERENCES career_recommendations(id) ON DELETE CASCADE,
  skill_id           TEXT REFERENCES skills(id),
  importance         TEXT CHECK (importance IN ('required', 'preferred')),
  PRIMARY KEY (recommendation_id, skill_id)
);
-- YH courses that close skill gaps
CREATE TABLE yh_courses (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name            TEXT NOT NULL,
  provider        TEXT,
  nuts3_code      TEXT,
  duration_hours  INT,
  start_date      DATE,
  cost_sek        INT,
  url             TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
-- Which courses close which skill gaps
CREATE TABLE course_skill_relations (
  course_id  UUID REFERENCES yh_courses(id) ON DELETE CASCADE,
  skill_id   TEXT REFERENCES skills(id)     ON DELETE CASCADE,
  PRIMARY KEY (course_id, skill_id)
);
CREATE INDEX idx_csr_skill ON course_skill_relations(skill_id);
-- User behaviour tracking (for research + product improvement)
-- GDPR note: only collected with research_consent = TRUE
CREATE TABLE user_events (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN (
                'search', 'view_recommendation', 'view_skill_gap',
                'click_course', 'click_apply', 'save_recommendation',
                'cv_upload', 'profile_update'
              )),
  payload     JSONB,                             -- flexible extra data
  session_id  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_events_user    ON user_events(user_id, created_at DESC);
CREATE INDEX idx_events_type    ON user_events(event_type);
CREATE INDEX idx_events_session ON user_events(session_id);
-- ============================================================
-- 4. CITYIQ — B2G municipal intelligence
-- ============================================================
CREATE TABLE municipalities (
  kod          TEXT PRIMARY KEY,                 -- Kommunikod e.g. "0684"
  name         TEXT NOT NULL,                    -- e.g. "Vetlanda"
  nuts3_code   TEXT,                             -- Region
  population   INT,
  size_tier    TEXT CHECK (size_tier IN ('small', 'medium', 'large')),
  -- < 30k / 30–100k / > 100k (matches CityIQ pricing tiers)
  is_pilot     BOOLEAN DEFAULT FALSE,
  pilot_start  DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
-- Snapshot of talent gaps per municipality (updated regularly)
CREATE TABLE municipal_talent_gaps (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  municipality_id TEXT REFERENCES municipalities(kod),
  occupation_id   TEXT REFERENCES occupations(id),
  snapshot_date   DATE NOT NULL,
  open_positions  INT,                           -- active job ads
  available_workers INT,                         -- registered job seekers
  gap             INT GENERATED ALWAYS AS        -- negative = shortage
                    (COALESCE(available_workers,0) - COALESCE(open_positions,0))
                  STORED,
  UNIQUE (municipality_id, occupation_id, snapshot_date)
);
CREATE INDEX idx_gaps_municipality ON municipal_talent_gaps(municipality_id, snapshot_date DESC);
CREATE INDEX idx_gaps_occupation   ON municipal_talent_gaps(occupation_id);
-- CityIQ ROI calculations (YH programme investment analysis)
CREATE TABLE municipal_roi_calculations (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  municipality_id     TEXT REFERENCES municipalities(kod),
  occupation_id       TEXT REFERENCES occupations(id),
  programme_name      TEXT,
  annual_cost_sek     INT,
  graduates_per_year  INT,
  annual_tax_revenue  INT,                       -- estimated SEK from employed graduates
  payback_months      INT GENERATED ALWAYS AS (
                        CASE
                          WHEN COALESCE(annual_tax_revenue, 0) > 0
                          THEN ROUND(annual_cost_sek::NUMERIC / (annual_tax_revenue / 12.0))::INT
                          ELSE NULL
                        END
                      ) STORED,
  five_year_roi_pct   NUMERIC(6,1),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================================
-- 5. RESEARCH / RCT INFRASTRUCTURE
--    For IFAU collaboration (see ifau_nordiqflow_proposal.pdf)
--    GDPR: only populated for users with research_consent = TRUE
-- ============================================================
CREATE TABLE rct_participants (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id           UUID REFERENCES user_profiles(id) ON DELETE RESTRICT,
  -- IFAU pseudonymised research ID (no PII, linkage done by IFAU)
  research_pseudo_id TEXT UNIQUE NOT NULL,
  rct_arm           TEXT NOT NULL CHECK (rct_arm IN ('treatment', 'control')),
  municipality_id   TEXT REFERENCES municipalities(kod),
  -- Stratification variables (for IFAU register linkage)
  age_group         TEXT CHECK (age_group IN ('18-24','25-34','35-44','45-54','55-64')),
  education_level   TEXT CHECK (education_level IN ('primary','secondary','post_secondary','tertiary')),
  unemployment_duration_days INT,
  enrolled_at       TIMESTAMPTZ DEFAULT NOW(),
  -- Outcome tracking (populated via IFAU register linkage, not by NordiqFlow)
  employment_date   DATE,                        -- first qualifying employment spell
  employment_occupation_id TEXT REFERENCES occupations(id),
  -- Study 1 primary outcome
  days_to_employment INT GENERATED ALWAYS AS (
    CASE
      WHEN employment_date IS NOT NULL
      THEN (employment_date - enrolled_at::DATE)::INT
      ELSE NULL
    END
  ) STORED
);
CREATE INDEX idx_rct_arm          ON rct_participants(rct_arm);
CREATE INDEX idx_rct_municipality ON rct_participants(municipality_id);
CREATE INDEX idx_rct_enrolled     ON rct_participants(enrolled_at);
-- Platform usage metrics per RCT participant (treatment arm only)
-- Aggregated weekly — no individual event logging beyond consent scope
CREATE TABLE rct_usage_weekly (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  participant_id    UUID REFERENCES rct_participants(id) ON DELETE CASCADE,
  week_start        DATE NOT NULL,
  sessions          INT DEFAULT 0,
  recommendations_viewed INT DEFAULT 0,
  skill_gaps_viewed INT DEFAULT 0,
  courses_clicked   INT DEFAULT 0,
  applications_clicked INT DEFAULT 0,
  UNIQUE (participant_id, week_start)
);
-- ============================================================
-- 6. SYSTEM / ADMIN
-- ============================================================
-- Track when AF data was last synced
CREATE TABLE data_sync_log (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source      TEXT NOT NULL,                     -- e.g. 'taxonomy_api', 'jobsearch_api'
  status      TEXT CHECK (status IN ('success', 'partial', 'failed')),
  records_updated INT,
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  error_msg   TEXT
);
-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS)
--    Users can only read their own data.
-- ============================================================
ALTER TABLE user_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles_career   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills            ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_skill_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE rct_participants       ENABLE ROW LEVEL SECURITY;
-- user_profiles: own row only
CREATE POLICY "users_own_profile"
  ON user_profiles FOR ALL
  USING (auth.uid() = id);
-- user_profiles_career: own rows only
CREATE POLICY "users_own_career"
  ON user_profiles_career FOR ALL
  USING (user_id = auth.uid());
-- user_skills: via career profile ownership
CREATE POLICY "users_own_skills"
  ON user_skills FOR ALL
  USING (
    user_profile_career_id IN (
      SELECT id FROM user_profiles_career WHERE user_id = auth.uid()
    )
  );
-- career_recommendations: via career profile ownership
CREATE POLICY "users_own_recommendations"
  ON career_recommendations FOR ALL
  USING (
    user_profile_career_id IN (
      SELECT id FROM user_profiles_career WHERE user_id = auth.uid()
    )
  );
-- recommendation_skill_gaps: via recommendation ownership
CREATE POLICY "users_own_skill_gaps"
  ON recommendation_skill_gaps FOR ALL
  USING (
    recommendation_id IN (
      SELECT r.id FROM career_recommendations r
      JOIN user_profiles_career c ON r.user_profile_career_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );
-- user_events: own rows only
CREATE POLICY "users_own_events"
  ON user_events FOR ALL
  USING (user_id = auth.uid());
-- rct_participants: own row only
CREATE POLICY "users_own_rct"
  ON rct_participants FOR ALL
  USING (user_id = auth.uid());
-- Taxonomy tables are public read (no PII)
ALTER TABLE occupations                ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupation_skill_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE substitutability           ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_forecasts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_stats               ENABLE ROW LEVEL SECURITY;
ALTER TABLE yh_courses                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_skill_relations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipalities             ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_occupations"   ON occupations                FOR SELECT USING (TRUE);
CREATE POLICY "public_read_skills"        ON skills                     FOR SELECT USING (TRUE);
CREATE POLICY "public_read_osr"           ON occupation_skill_relations FOR SELECT USING (TRUE);
CREATE POLICY "public_read_sub"           ON substitutability           FOR SELECT USING (TRUE);
CREATE POLICY "public_read_demand"        ON demand_forecasts           FOR SELECT USING (TRUE);
CREATE POLICY "public_read_salary"        ON salary_stats               FOR SELECT USING (TRUE);
CREATE POLICY "public_read_courses"       ON yh_courses                 FOR SELECT USING (TRUE);
CREATE POLICY "public_read_csr"           ON course_skill_relations     FOR SELECT USING (TRUE);
CREATE POLICY "public_read_municipalities" ON municipalities            FOR SELECT USING (TRUE);
-- ============================================================
-- 8. USEFUL VIEWS
-- ============================================================
-- Quick career recommendations view with names resolved
CREATE VIEW v_recommendations AS
SELECT
  r.id,
  r.user_profile_career_id,
  o_from.name_sv   AS from_occupation,
  o_to.name_sv     AS to_occupation,
  o_to.ssyk_code   AS to_ssyk,
  r.score_total,
  r.skill_match_pct,
  r.salary_delta_monthly,
  r.generated_at
FROM career_recommendations r
JOIN user_profiles_career c  ON r.user_profile_career_id = c.id
JOIN occupations o_from      ON c.current_occupation_id  = o_from.id
JOIN occupations o_to        ON r.target_occupation_id   = o_to.id;
-- CityIQ: top skill shortages per municipality
CREATE VIEW v_municipal_gaps AS
SELECT
  m.name            AS municipality,
  m.size_tier,
  o.name_sv         AS occupation,
  o.ssyk_code,
  g.open_positions,
  g.available_workers,
  g.gap,
  g.snapshot_date
FROM municipal_talent_gaps g
JOIN municipalities m ON g.municipality_id = m.kod
JOIN occupations    o ON g.occupation_id   = o.id
WHERE g.snapshot_date = (
  SELECT MAX(snapshot_date) FROM municipal_talent_gaps
);
-- ============================================================
-- 9. UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_occupations_updated
  BEFORE UPDATE ON occupations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_skills_updated
  BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_profiles_updated
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_career_updated
  BEFORE UPDATE ON user_profiles_career
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- ============================================================
-- DONE.
-- Tables:  occupations, skills, occupation_skill_relations,
--          substitutability, demand_forecasts, salary_stats,
--          user_profiles, user_profiles_career, user_skills,
--          career_recommendations, recommendation_skill_gaps,
--          yh_courses, course_skill_relations, user_events,
--          municipalities, municipal_talent_gaps,
--          municipal_roi_calculations,
--          rct_participants, rct_usage_weekly,
--          data_sync_log
-- Views:   v_recommendations, v_municipal_gaps
-- ============================================================
