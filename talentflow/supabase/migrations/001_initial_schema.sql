-- =============================================================================
-- NordiqFlow / TalentFlow Database Schema
-- Target: PostgreSQL (Supabase)
-- =============================================================================
-- This schema covers:
--   1. AF Taxonomy mirror (read-only reference data)
--   2. Users & profiles
--   3. Resumes (multiple per user, tailored per job type)
--   4. Jobs (scraped from Platsbanken + enriched)
--   5. Applications (full pipeline tracking)
--   6. AI-generated content
-- =============================================================================

-- =============================================
-- SECTION 1: AF TAXONOMY (read-only mirror)
-- Synced from JobTech Taxonomy API
-- =============================================

CREATE TABLE af_regions (
    id              TEXT PRIMARY KEY,           -- AF concept ID
    name            TEXT NOT NULL,              -- e.g. "Stockholms län"
    nuts_code       TEXT                        -- EU NUTS code
);

CREATE TABLE af_municipalities (
    id              TEXT PRIMARY KEY,           -- AF concept ID
    name            TEXT NOT NULL,              -- e.g. "Malmö"
    municipality_code TEXT,                     -- SCB kommun code e.g. "1280"
    region_id       TEXT REFERENCES af_regions(id)
);

CREATE TABLE af_occupations (
    id              TEXT PRIMARY KEY,           -- AF concept ID
    name            TEXT NOT NULL,              -- e.g. "Mjukvaruutvecklare"
    ssyk_code       TEXT NOT NULL,              -- SSYK-2012 4-digit code
    ssyk_label      TEXT,                       -- SSYK group name
    definition      TEXT                        -- Occupation description
);

CREATE TABLE af_skills (
    id              TEXT PRIMARY KEY,           -- AF concept ID
    name            TEXT NOT NULL,              -- e.g. "Python-programmering"
    skill_type      TEXT,                       -- e.g. "kompetens", "mjuk kompetens"
    parent_id       TEXT REFERENCES af_skills(id)
);

CREATE TABLE af_occupation_skills (
    occupation_id   TEXT REFERENCES af_occupations(id),
    skill_id        TEXT REFERENCES af_skills(id),
    importance      TEXT,                       -- required | preferred | bonus
    PRIMARY KEY (occupation_id, skill_id)
);

CREATE TABLE af_substitutability (
    from_occupation_id TEXT REFERENCES af_occupations(id),
    to_occupation_id   TEXT REFERENCES af_occupations(id),
    score              INTEGER NOT NULL,        -- 25, 50, or 75
    direction          TEXT NOT NULL,            -- can_become | can_replace
    PRIMARY KEY (from_occupation_id, to_occupation_id, direction)
);

CREATE TABLE af_demand_forecast (
    occupation_id       TEXT REFERENCES af_occupations(id),
    region_id           TEXT REFERENCES af_regions(id),
    year                INTEGER NOT NULL,
    demand_level        INTEGER,                -- 1-5 scale from Yrkesbarometer
    competition_level   INTEGER,                -- 1-5 scale
    PRIMARY KEY (occupation_id, region_id, year)
);

-- Indexes for taxonomy lookups
CREATE INDEX idx_af_occupations_ssyk ON af_occupations(ssyk_code);
CREATE INDEX idx_af_municipalities_region ON af_municipalities(region_id);
CREATE INDEX idx_af_occupation_skills_skill ON af_occupation_skills(skill_id);
CREATE INDEX idx_af_substitutability_to ON af_substitutability(to_occupation_id);


-- =============================================
-- SECTION 2: USERS & PROFILES
-- =============================================

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               TEXT UNIQUE NOT NULL,
    name                TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),

    -- Profile
    current_occupation_id TEXT REFERENCES af_occupations(id),
    municipality_id       TEXT REFERENCES af_municipalities(id),
    years_experience      INTEGER,
    education_level       TEXT                -- grundskola | gymnasie | kandidat | master | doktor
);

CREATE TABLE user_skills (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id        TEXT REFERENCES af_skills(id),
    proficiency     INTEGER CHECK (proficiency BETWEEN 1 AND 5),
    source          TEXT NOT NULL,            -- cv_parsed | manual | inferred
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, skill_id)
);

CREATE TABLE user_experiences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    employer        TEXT,
    occupation_id   TEXT REFERENCES af_occupations(id),
    start_date      DATE,
    end_date        DATE,                    -- NULL = current
    description     TEXT
);

CREATE TABLE user_education (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    institution     TEXT,
    degree          TEXT,
    field           TEXT,
    sun_code        TEXT,                    -- Swedish SUN classification
    start_date      DATE,
    end_date        DATE
);

-- What kind of jobs is the user targeting?
CREATE TABLE user_target_occupations (
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    occupation_id   TEXT REFERENCES af_occupations(id),
    priority        INTEGER DEFAULT 1,       -- 1 = top choice
    PRIMARY KEY (user_id, occupation_id)
);


-- =============================================
-- SECTION 3: RESUMES
-- Multiple resumes per user, each tailored
-- =============================================

CREATE TABLE resumes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,            -- "Tech Resume", "PM Resume"
    target_occupation_id TEXT REFERENCES af_occupations(id),
    is_base         BOOLEAN DEFAULT false,   -- true = master resume with everything
    content_json    JSONB NOT NULL,           -- structured resume sections
    pdf_url         TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Which skills does each resume emphasize?
CREATE TABLE resume_skills (
    resume_id       UUID REFERENCES resumes(id) ON DELETE CASCADE,
    skill_id        TEXT REFERENCES af_skills(id),
    emphasis        TEXT NOT NULL,            -- primary | secondary | mentioned
    PRIMARY KEY (resume_id, skill_id)
);


-- =============================================
-- SECTION 4: JOBS (scraped & enriched)
-- =============================================

CREATE TABLE jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    af_job_id       TEXT UNIQUE,             -- Platsbanken annons-ID
    title           TEXT NOT NULL,
    employer        TEXT,
    occupation_id   TEXT REFERENCES af_occupations(id),
    municipality_id TEXT REFERENCES af_municipalities(id),
    region_id       TEXT REFERENCES af_regions(id),

    description_raw TEXT,                    -- original ad text
    salary_range    TEXT,
    employment_type TEXT,                    -- tillsvidare | visstid | etc.

    application_url TEXT,
    application_deadline DATE,

    source          TEXT DEFAULT 'platsbanken', -- platsbanken | linkedin | other
    scraped_at      TIMESTAMPTZ DEFAULT now(),
    is_active       BOOLEAN DEFAULT true
);

-- Skills extracted from job ad (via AF NLP enrichment API)
CREATE TABLE job_skills (
    job_id          UUID REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id        TEXT REFERENCES af_skills(id),
    requirement     TEXT NOT NULL,           -- required | preferred | bonus
    PRIMARY KEY (job_id, skill_id)
);

CREATE INDEX idx_jobs_occupation ON jobs(occupation_id);
CREATE INDEX idx_jobs_municipality ON jobs(municipality_id);
CREATE INDEX idx_jobs_active ON jobs(is_active) WHERE is_active = true;
CREATE INDEX idx_jobs_deadline ON jobs(application_deadline);


-- =============================================
-- SECTION 5: APPLICATIONS
-- Full pipeline: saved → applied → interview → offer/rejected
-- =============================================

CREATE TABLE applications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id          UUID REFERENCES jobs(id),
    resume_id       UUID REFERENCES resumes(id),

    status          TEXT NOT NULL DEFAULT 'saved',
    -- saved | applied | interview | offer | rejected | withdrawn

    fit_score       INTEGER,                 -- 0-100, AI-computed
    cover_letter    TEXT,                     -- AI-generated, user-edited

    applied_at      TIMESTAMPTZ,
    response_at     TIMESTAMPTZ,
    notes           TEXT,

    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- What skills is the user missing for this specific job?
CREATE TABLE application_skill_gaps (
    application_id  UUID REFERENCES applications(id) ON DELETE CASCADE,
    skill_id        TEXT REFERENCES af_skills(id),
    importance      TEXT,                    -- required | preferred
    learning_estimate_weeks INTEGER,         -- estimated weeks to learn
    PRIMARY KEY (application_id, skill_id)
);

CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);


-- =============================================
-- SECTION 6: AI ACTIVITY LOG
-- Track what the AI does for transparency
-- =============================================

CREATE TABLE ai_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type     TEXT NOT NULL,           -- cv_parse | cover_letter | fit_score | resume_tailor
    input_summary   TEXT,                    -- what was sent to the AI
    output_summary  TEXT,                    -- what came back
    model           TEXT,                    -- e.g. "claude-sonnet-4-5-20250929"
    tokens_used     INTEGER,
    created_at      TIMESTAMPTZ DEFAULT now()
);
