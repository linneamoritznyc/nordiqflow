# PRD: TalentFlow Demo

**Product**: TalentFlow — Karriärintelligens för individer
**Type**: Interactive web demo (fundraising + user validation)
**Owner**: Linnea Moritz
**Date**: 2026-02-22
**Status**: Pre-build specification

---

## 1. Purpose of this Demo

This demo exists to answer ONE question for funders (Vinnova, Almi, Science Park):

> "Can you show me what the product does?"

It is NOT a production app. It is a functional prototype that:
- Uses **real AF data** (not mock data)
- Runs in a browser with **no login required**
- Takes **< 30 seconds** to deliver value to the user
- Proves the concept is technically feasible and desirable

### Who sees this demo?
1. **Funders** — Vinnova program managers, Almi advisors, Science Park mentors
2. **Municipal contacts** — Arbetsmarknadschefer evaluating CityIQ (they want to see what their residents get)
3. **Potential pilot users** — Job seekers in Vetlanda who might beta-test

### What does success look like?
- Funder says: "I understand what this does and why it matters"
- Municipal contact says: "I want my residents to have access to this"
- Job seeker says: "I didn't know I could become [X], this is useful"

---

## 2. User Flow (Single Path)

The demo has ONE flow. No login, no signup, no settings.

```
[Landing]  →  [Select occupation]  →  [Results page]
   3 sec         5 sec                  Explore freely
```

### Step 1: Landing (3 seconds to action)

**What the user sees:**
- Headline: "Vilka jobb kan du ta — som du inte visste om?"
- Subtext: "Skriv in ditt nuvarande yrke. Vi visar karriärvägar du aldrig sett."
- One search input with autocomplete
- Zero other UI. No nav, no features list, no signup.

**Technical:**
- Autocomplete searches `occupations.json` (3,000+ occupations, client-side)
- Debounced input (200ms), fuzzy matching on occupation name
- Shows SSYK group label under each suggestion for disambiguation

### Step 2: Select Occupation

**What happens when user picks "Butikschef":**
1. Look up occupation ID in `occupations.json`
2. Query `substitutability.json` for all `can_become` relations
3. For each target occupation, fetch live job count from AF JobSearch API
4. Sort results by composite score
5. Render results page

**Technical (all client-side except AF API call):**
- `occupations.json` (1.1 MB) — loaded on page init, cached
- `substitutability.json` (2.8 MB) — loaded on page init, cached
- `skills.json` (597 KB) — loaded on demand when user clicks a result
- AF JobSearch API — `GET https://jobsearch.api.jobtechdev.se/search?occupation-concept-id={id}&limit=0` — returns total count only

### Step 3: Results Page

**Layout:** Three panels.

#### Panel A: Career Transitions (left, 60% width)

A ranked list of occupations the user can transition to.

Each card shows:
| Field | Source | Example |
|-------|--------|---------|
| Occupation name | `substitutability.json` → `targetName` | "Verksamhetsledare" |
| Substitutability score | `substitutability.json` → `score` | 75/100 |
| Direction | `substitutability.json` → `direction` | "can_become" |
| Live job count | AF JobSearch API | "47 lediga jobb" |
| SSYK group | `ssyk-groups.json` | "Chefer inom hälso- och sjukvård" |

**Sorting:** By composite score = `(substitutability_score × 0.6) + (has_jobs × 0.4)`
where `has_jobs` = 1 if live job count > 0, else 0.

**Why this formula:** Simple, transparent, no black box. We want to show transitions that are BOTH feasible (high substitutability) AND have actual jobs available (not theoretical).

#### Panel B: Skills Gap (right panel, shown on click)

When user clicks a career transition card:
1. Look up both occupations in `skills.json` via SSYK → occupation → skills mapping
2. Compute: `gap = target_skills - source_skills`
3. Display: "Du har X av Y kompetenser. Du saknar: [list]"

**Note:** The demo does NOT suggest training programs. That requires education data integration (SUN taxonomy + YH database) which is post-demo scope.

#### Panel C: Live Jobs (expandable)

When user clicks "Se lediga jobb" on a transition card:
- Fetch from AF JobSearch API: `GET /search?occupation-concept-id={target_id}&limit=5`
- Show: title, employer, location, link to Platsbanken listing
- This proves the connection between career intelligence and actual job openings

---

## 3. Data Architecture

### What data is needed

| Dataset | Size | Source | Storage | Refresh |
|---------|------|--------|---------|---------|
| Occupations | 1.1 MB | `data/processed/occupations.json` | Static JSON (bundled) | Quarterly |
| Substitutability | 2.8 MB | `data/processed/substitutability.json` | Static JSON (bundled) | Quarterly |
| Skills | 597 KB | `data/processed/skills.json` | Static JSON (bundled) | Quarterly |
| SSYK Groups | 205 KB | `data/processed/ssyk-groups.json` | Static JSON (bundled) | Quarterly |
| Live Jobs | Dynamic | AF JobSearch API | API call (not stored) | Real-time |

**Total static data: ~4.7 MB** — small enough to bundle client-side. No database needed for the demo.

### Why no Supabase for the demo?

The demo serves static, read-only data. Adding Supabase would:
- Add deployment complexity (env vars, RLS policies, migrations)
- Add latency (network round-trip to Supabase)
- Add cost ($25/month minimum)
- Add a failure mode (Supabase outage = demo broken)

**Decision:** Demo uses bundled JSON files. When we build the real product, we move to Supabase.

### AF JobSearch API Integration

```
Endpoint: https://jobsearch.api.jobtechdev.se/search
Method: GET
Rate limit: 100 requests/minute (more than enough for demo)
Auth: None required (public API)
CORS: Supported

Parameters used:
- occupation-concept-id: AF taxonomy concept ID
- municipality: Municipality concept ID (optional, for location filtering)
- limit: Number of results (0 for count only, 5 for preview)
- offset: Pagination
```

**Fallback:** If AF API is down (rare but possible), show cached job counts from last successful fetch, with a "Data from [date]" notice.

---

## 4. Supabase Strategy (Post-Demo, Production)

When TalentFlow moves from demo to product, here is the Supabase storage plan.

### 4.1 Database Design

**Read-only AF data tables** (refreshed quarterly):

```sql
-- ~3,000 rows. One row per AF occupation.
af_occupations (
  id TEXT PRIMARY KEY,          -- AF concept ID (e.g., 'PQkQ_Dmk_ZF8')
  name TEXT NOT NULL,           -- 'Undersköterska, vård'
  ssyk_code TEXT,               -- '5321'
  ssyk_label TEXT,              -- 'Undersköterskor'
  definition TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- ~16,648 rows. One row per substitutability relation.
af_substitutability (
  id SERIAL PRIMARY KEY,
  source_id TEXT REFERENCES af_occupations(id),
  target_id TEXT REFERENCES af_occupations(id),
  score INTEGER CHECK (score IN (25, 50, 75)),
  direction TEXT CHECK (direction IN ('can_become', 'can_replace')),
  UNIQUE(source_id, target_id, direction)
)

-- ~8,000 rows. One row per skill concept.
af_skills (
  id TEXT PRIMARY KEY,          -- AF concept ID
  name TEXT NOT NULL,
  type TEXT                     -- 'technical', 'soft', etc.
)

-- ~50,000 rows. Many-to-many: which skills belong to which occupation.
af_occupation_skills (
  occupation_id TEXT REFERENCES af_occupations(id),
  skill_id TEXT REFERENCES af_skills(id),
  PRIMARY KEY (occupation_id, skill_id)
)

-- ~430 rows. SSYK-4 level groups.
af_ssyk_groups (
  code TEXT PRIMARY KEY,        -- '5321'
  label TEXT NOT NULL,
  definition TEXT,
  occupation_ids TEXT[]         -- Array of af_occupations IDs in this group
)
```

**Total AF data: ~78,000 rows.** This is tiny. PostgreSQL handles this trivially with no performance tuning needed.

**User data tables** (grows with usage):

```sql
-- User profiles. Starts at 0, target: 500 in 3 months.
users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,
  current_occupation_id TEXT REFERENCES af_occupations(id),
  municipality_id TEXT,         -- For location-based recommendations
  created_at TIMESTAMPTZ DEFAULT now()
)

-- User's skills (self-reported + CV-parsed).
user_skills (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_id TEXT REFERENCES af_skills(id),
  proficiency INTEGER CHECK (proficiency BETWEEN 1 AND 5),
  source TEXT CHECK (source IN ('cv_parsed', 'self_reported')),
  PRIMARY KEY (user_id, skill_id)
)

-- Uploaded CVs.
user_cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_url TEXT,                -- Supabase Storage URL
  parsed_text TEXT,             -- Extracted text from PDF
  parsed_skills JSONB,          -- Claude's skill extraction result
  language TEXT DEFAULT 'sv',
  created_at TIMESTAMPTZ DEFAULT now()
)

-- AI-generated content (cover letters, tailored resumes).
ai_generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('cover_letter', 'tailored_resume', 'career_advice')),
  target_job_url TEXT,
  target_occupation_id TEXT,
  content TEXT,
  tokens_used INTEGER,          -- For cost tracking
  model TEXT DEFAULT 'claude-sonnet-4-5-20241022',
  created_at TIMESTAMPTZ DEFAULT now()
)
```

### 4.2 Materialized Views (Pre-computed for Speed)

```sql
-- Pre-compute 2-hop career paths. Refreshed weekly.
-- ~200,000 rows (each occupation × reachable occupations within 2 hops).
CREATE MATERIALIZED VIEW mv_career_paths_2hop AS
WITH RECURSIVE paths AS (
  SELECT
    source_id,
    target_id,
    score,
    1 AS depth,
    ARRAY[source_id] AS path
  FROM af_substitutability
  WHERE direction = 'can_become'

  UNION ALL

  SELECT
    p.source_id,
    s.target_id,
    LEAST(p.score, s.score) AS score,  -- bottleneck scoring
    p.depth + 1,
    p.path || s.source_id
  FROM paths p
  JOIN af_substitutability s ON s.source_id = p.target_id
  WHERE p.depth < 2
    AND s.target_id != ALL(p.path)      -- cycle detection
    AND s.direction = 'can_become'
)
SELECT DISTINCT ON (source_id, target_id)
  source_id,
  target_id,
  score,
  depth
FROM paths
ORDER BY source_id, target_id, score DESC;

-- Index for fast lookups
CREATE INDEX idx_career_paths_source ON mv_career_paths_2hop(source_id);
```

**Refresh:** `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_career_paths_2hop;`
Run via Supabase cron (pg_cron extension) every Sunday at 03:00.

### 4.3 pgvector (Semantic Search — Post-MVP)

For semantic skill matching (e.g., user types "machine learning" and we match it to AF's "maskininlärning" concept):

```sql
-- Add embedding column to skills table
ALTER TABLE af_skills ADD COLUMN embedding vector(1536);

-- Generate embeddings via OpenAI ada-002 (batch job, one-time)
-- Cost: 8,000 skills × 1536 dims ≈ $0.10 total
-- Store in af_skills.embedding

-- Semantic search function
CREATE FUNCTION search_skills_semantic(query_embedding vector(1536), match_count INT)
RETURNS TABLE(id TEXT, name TEXT, similarity FLOAT)
AS $$
  SELECT id, name, 1 - (embedding <=> query_embedding) AS similarity
  FROM af_skills
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql;
```

**Decision: pgvector is NOT needed for the demo.** The demo uses exact name matching on occupations. Semantic search is a production feature for when users upload CVs with free-text skill descriptions.

### 4.4 Data Sizing Summary

| Table | Rows | Size | Growth |
|-------|------|------|--------|
| af_occupations | 3,000 | ~500 KB | Static (quarterly refresh) |
| af_substitutability | 16,648 | ~1 MB | Static |
| af_skills | 8,000 | ~800 KB | Static |
| af_occupation_skills | 50,000 | ~3 MB | Static |
| af_ssyk_groups | 430 | ~200 KB | Static |
| mv_career_paths_2hop | ~200,000 | ~15 MB | Recomputed weekly |
| users | 0 → 500 | Negligible | ~100/month |
| user_skills | 0 → 5,000 | Negligible | ~1,000/month |
| user_cvs | 0 → 300 | ~50 MB (with stored text) | ~60/month |
| ai_generated_content | 0 → 2,000 | ~10 MB | ~400/month |
| **Total** | **~280,000** | **~31 MB** | **Trivial** |

**Supabase Free Tier limit: 500 MB.** We are at ~6% of capacity. No scaling concerns for 12+ months.

### 4.5 Row Level Security (RLS)

```sql
-- Users can only read their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- AF data is readable by everyone (public reference data)
ALTER TABLE af_occupations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AF data is public" ON af_occupations
  FOR SELECT USING (true);
-- Same for af_substitutability, af_skills, af_occupation_skills, af_ssyk_groups

-- AI content is private per user
ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own AI content" ON ai_generated_content
  FOR SELECT USING (auth.uid() = user_id);
```

---

## 5. What the Demo Does NOT Include

Explicitly out of scope for the demo. These are production features.

| Feature | Why excluded | When |
|---------|-------------|------|
| User accounts / login | Adds friction, not needed to prove value | Production v1 |
| CV upload + AI parsing | Requires Claude API key, costs money per use | Production v1 |
| Resume/cover letter generation | Requires Claude API | Production v1 |
| Saved profiles | Requires database | Production v1 |
| Education recommendations | Requires SUN taxonomy + YH integration | Production v1.1 |
| Salary data | No reliable open data source yet | Production v1.1 |
| Demand forecasting | Requires Yrkesbarometer integration | Production v1.1 |
| Mobile app | Web-first | 2027 |

---

## 6. Technical Implementation

### Stack (demo only)

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Static HTML + vanilla JS | Zero build step, instant deploy, no dependencies |
| Data | Bundled JSON files | No database needed for read-only demo |
| API | AF JobSearch (direct) | Public, free, CORS-enabled |
| Hosting | Vercel (existing) | Already deployed, zero cost |
| Styling | Inline CSS (match existing site) | Consistent brand, no build tools |

**Alternative considered:** Next.js (in `talentflow/` scaffolding). Rejected for demo because:
- Adds build complexity
- Requires `npm install` + node_modules
- Slower iteration
- Demo is one page, not an app

### Performance Targets

| Metric | Target | How |
|--------|--------|-----|
| Initial load | < 3 seconds | JSON files gzipped (~1.2 MB total) |
| Autocomplete response | < 100ms | Client-side search, data already loaded |
| Career results render | < 500ms | Client-side lookup + 1 AF API call |
| AF API response | < 1 second | Simple GET, small payload |

### Error Handling

| Error | User sees | Technical |
|-------|-----------|-----------|
| AF API timeout | "Jobbannonser kunde inte laddas just nu. Karriärdata visas ändå." | Results still show, job count shows "—" |
| AF API rate limit | Same as above | Unlikely (100 req/min limit, demo generates ~5) |
| Occupation not in substitutability data | "Vi har inte karriärdata för detta yrke ännu." | ~1,500 of 3,000 occupations have substitutability data |
| Browser can't load JSON | "Något gick fel. Ladda om sidan." | Retry with exponential backoff |

---

## 7. Metrics (How We Know the Demo Works)

### For funders
- **Demo completion rate**: % of users who select an occupation and see results
- **Time to value**: Seconds from page load to first career result shown
- **"Aha moment" proxy**: % of users who click on at least 2 career transition cards

### For product validation
- **Occupation coverage**: % of selected occupations that have substitutability data
- **Job availability**: % of shown career transitions that have > 0 live jobs
- **Unique sessions**: Total demo usage (tracked via Plausible, GDPR-compliant)

### Not measured in demo
- Conversion (no signup)
- Retention (no accounts)
- Revenue (free)

---

## 8. Open Questions

| Question | Impact | Decision needed by |
|----------|--------|-------------------|
| Should the demo show a "Sign up for early access" CTA? | Lead capture for pilot | Before demo launch |
| Should we filter jobs by Vetlanda/Jönköpings län by default? | More relevant for local funders | Before funder demo |
| Should the demo support English? | Broader audience but more work | After Swedish version works |

---

## 9. Timeline

| Week | Deliverable |
|------|-------------|
| 1 | Data loading + autocomplete working |
| 2 | Substitutability results rendering + AF API integration |
| 3 | Skills gap panel + UI polish |
| 4 | Testing, bug fixes, deploy to nordiqflow.vercel.app |

**Total: 4 weeks to functional demo.**

---

## 10. Relationship to Existing Demo

The current `demo.html` exists but has problems:
1. It pretends to do AI processing (shows "embedding vectors", "cosine similarity") when it actually does a JSON lookup
2. It's overly complex UI — too many panels, animations, technical jargon
3. It doesn't clearly show the "aha moment" (career transitions you didn't know about)

The new TalentFlow demo should:
- Be honest about what it does (lookup in AF data, not AI)
- Be radically simple (one input, one results page)
- Focus on the insight, not the technology
- Eventually replace `demo.html` on the site
