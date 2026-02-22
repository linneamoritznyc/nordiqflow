# PRD: CityIQ Demo — Vetlanda Pilot

**Product**: CityIQ — Kommunal talanganalys
**Type**: Interactive dashboard demo (sells to municipalities)
**Owner**: Linnea Moritz
**Date**: 2026-02-22
**Status**: Pre-build specification

---

## 1. Purpose of this Demo

This demo answers ONE question for the arbetsmarknadschef in Vetlanda:

> "Vad får jag för mina pengar?"

It shows what a municipality gets with a CityIQ license: a live dashboard with real data about THEIR labor market, not generic national statistics.

### Who sees this demo?
1. **Arbetsmarknadschefer** — The buyer. Decides budget allocation for labor market programs
2. **Kommunstyrelser** — Signs off on procurement. Needs ROI justification
3. **Funders** — Vinnova/Almi want to see the B2G product, not just B2C
4. **YH-utbildningsanordnare** — Potential partners who want to align programs with demand

### What does success look like?
- Arbetsmarknadschef says: "Jag vill ha detta för min kommun"
- Kommunstyrelse says: "75k/år är billigt jämfört med en konsultrapport"
- Funder says: "Ni har en riktig produkt med en riktig kund"

### This demo is also a sales tool
Unlike TalentFlow Demo (which validates the concept), CityIQ Demo must **close a deal**. Every screen should make the arbetsmarknadschef think: "I need this data. I don't have it today."

---

## 2. The Vetlanda Pilot Dashboard

### 2.1 Dashboard Overview

One page. Four sections. Real data.

```
┌─────────────────────────────────────────────────────────┐
│  HEADER: "CityIQ — Vetlanda kommun"                     │
│  Subtitle: "Arbetsmarknadsanalys Q1 2026"               │
│  Last updated: [live timestamp from AF API]              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  SECTION 1: Nyckeltal (4 metric cards)                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
│  │ Jobs │ │ Gap  │ │Trans.│ │ ROI  │                    │
│  └──────┘ └──────┘ └──────┘ └──────┘                   │
│                                                         │
│  SECTION 2: Bristyrken (shortage table)                 │
│  ┌─────────────────────────────────────┐                │
│  │ Rank │ Yrke │ Lediga │ Brist │ Trend│                │
│  │  1   │ ...  │  ...   │  ...  │  ... │                │
│  │  2   │ ...  │  ...   │  ...  │  ... │                │
│  └─────────────────────────────────────┘                │
│                                                         │
│  SECTION 3: Karriärövergångar (transition map)          │
│  "X personer i Vetlanda kan omskolas till bristyrken"   │
│  ┌─────────────────────────────────────┐                │
│  │ From → To diagram with counts      │                 │
│  └─────────────────────────────────────┘                │
│                                                         │
│  SECTION 4: Utbildnings-ROI                             │
│  "Om 50 invånare byter till bristyrken = X kr/år"      │
│  ┌─────────────────────────────────────┐                │
│  │ ROI calculator with sliders        │                  │
│  └─────────────────────────────────────┘                │
│                                                         │
│  SECTION 5: Prissättning & nästa steg                   │
│  "Boka pilot" CTA                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Section 1: Nyckeltal

Four key metrics, fetched in real-time from AF JobSearch API.

| Metric | Source | How computed | Example |
|--------|--------|-------------|---------|
| **Lediga jobb i Vetlanda** | AF JobSearch API | `GET /search?municipality=xJqx_SLC_415&limit=0` → `total.value` | 187 |
| **Bristindex** | Computed | Shortage occupations with > 3 postings and no decline in trend | -45 |
| **Möjliga övergångar** | `substitutability.json` | Count of unique `can_become` paths from surplus to shortage occupations | 312 |
| **Potentiell skatteintäkt** | Computed | `shortage_positions × avg_annual_tax_per_employed_person` | 8.2M SEK |

**Municipality concept IDs** (from AF taxonomy):
- Vetlanda: `xJqx_SLC_415`
- Nässjö: `KfXT_ySA_do2`
- Eksjö: `VacK_WF6_XVg`
- Jönköping: `KURg_KJF_Lwc`
- Jönköpings län: `MtbE_xWT_eMi`

### 2.3 Section 2: Bristyrken (Top 10 Shortage Occupations)

**How to compute "bristyrken" for Vetlanda:**

1. Fetch all jobs in Vetlanda from AF JobSearch API
2. Group by `occupation-concept-id` (the SSYK-4 level occupation)
3. Count job postings per occupation
4. Rank by count descending
5. Top 10 = shortage occupations (most postings = most unfilled demand)

**Table columns:**

| Column | Source | Example |
|--------|--------|---------|
| Rank | Computed | 1 |
| Yrke | AF taxonomy name | "Undersköterska, hemtjänst" |
| SSYK | SSYK-4 code | 5321 |
| Lediga tjänster | AF JobSearch API count | 18 |
| Annonsörer | Unique employer count from API | 5 |
| Trend | Compare with historical (if available) | "Ökande" / "Stabil" / "Minskande" |

**Expected Vetlanda top occupations** (based on the municipality's profile — manufacturing + aging population):
1. Undersköterskor (hemtjänst, äldreboende)
2. Maskinoperatörer (trä, metall — Vetlandas tillverkningsindustri)
3. Lärare (förskola, grundskola)
4. Lastbils-/bussförare
5. Svetsare, plåtslagare
6. Sjuksköterskor
7. Personliga assistenter
8. Kockar
9. Elektriker
10. Snickare/träarbetare

**Interactive:** Clicking a row expands to show individual job listings (from AF API).

### 2.4 Section 3: Karriärövergångar (Transition Map)

**The killer insight:** "Vetlanda har X personer i överskottsyrken som kan omskolas till bristyrken."

This section uses `substitutability.json` to show realistic career paths.

**How it works:**

1. Take the top 10 shortage occupations from Section 2
2. For each, find all occupations that have `can_become` or `can_replace` relations to it
3. Cross-reference with Vetlanda's labor pool (proxy: which occupations are NOT in the shortage list)
4. Show: "Person med yrke A → kan bli B (substitutability: 75%)"

**Example output for Vetlanda:**

```
FRÅN (överskott)              →  TILL (brist)                    MATCH
────────────────────────────────────────────────────────────────────────
Vårdbiträde                   →  Undersköterska, hemtjänst       25%
Hemsjukvårdare                →  Undersköterska, hemtjänst       75%
Plastmaskinoperatör           →  Processoperatör betong           25%
Plastmaskinoperatör           →  Maskinoperatör ytbehandling      25%
Träarbetare/Snickare          →  Möbelsnickare                   75%
Installationselektriker       →  Automationselektriker            75%
Barnskötare                   →  Elevassistent                   75%
```

**Visualization:** Sankey diagram or simple flow chart.
- Left column: source occupations (current workforce)
- Right column: target occupations (shortage)
- Lines between them: thickness = substitutability score
- Color: green (75), yellow (50), red (25)

### 2.5 Section 4: Utbildnings-ROI Calculator

**The pitch:** "En investering på X kr i utbildning ger Y kr i skatteintäkter."

**Interactive calculator with sliders:**

| Input | Default | Range | Source |
|-------|---------|-------|--------|
| Antal personer som omskolas | 50 | 10-200 | User adjustable |
| Genomsnittslön i bristyrke | 29,000 SEK/mån | Fixed | SCB median |
| Kommunalskattesats Vetlanda | 22.36% | Fixed | SKR data |
| Utbildningskostnad per person | 80,000 SEK | 40k-150k | YH-snitt |
| Tid till anställning | 6 månader | 3-12 | User adjustable |

**Output:**

```
Utbildningsinvestering:   50 × 80,000  =  4,000,000 SEK
Årlig skatteintäkt:       50 × 29,000 × 12 × 0.2236 = 3,893,760 SEK/år
Återbetalningstid:        ~12 månader
5-års ROI:                +387%
Alternativkostnad:        50 × 180,000 SEK/år (försörjningsstöd) = 9,000,000 SEK
Nettobesparing år 1:      9,000,000 - 4,000,000 + 3,893,760 = 8,893,760 SEK
```

**Note on numbers:** These are back-of-envelope calculations. They are directionally correct and useful for a pitch. In production, we would refine with actual SCB income data per occupation, actual municipal tax rates, and actual YH program costs.

### 2.6 Section 5: Prissättning & Nästa Steg

**Direct in the dashboard. Not hidden behind a link.**

| Package | Invånare | Pris/år | Inkluderar |
|---------|----------|---------|------------|
| Pilot (gratis) | < 30,000 | 0 SEK (3 mån) | CityIQ-rapport + TalentFlow för 100 invånare |
| Liten kommun | < 30,000 | 75,000 SEK | Full CityIQ + TalentFlow för alla invånare |
| Medelstor kommun | 30,000-100,000 | 150,000 SEK | Allt + månadsrapporter + dedicated support |
| Stor kommun | > 100,000 | 250,000 SEK | Allt + custom dashboards + API-access + workshops |

**Why these prices work:**
- Under direktupphandlingsgränsen (700k SEK) = inget upphandlingsförfarande
- Arbetsmarknadschefen kan besluta själv eller via nämnd
- 75k/år < en enda konsultdag (McKinsey: ~25k/dag)
- Vetlanda's arbetsmarknadsbudget: ~15M SEK/år → CityIQ = 0.5% av budget

**CTA:** "Boka pilot" → mailto:linnea@nordiqflow.com med ämnesrad "CityIQ Pilot — Vetlanda"

---

## 3. Data Architecture

### 3.1 What data is needed for the demo

| Dataset | Size | Source | Storage | Refresh |
|---------|------|--------|---------|---------|
| Occupations | 1.1 MB | `data/processed/occupations.json` | Static JSON | Quarterly |
| Substitutability | 2.8 MB | `data/processed/substitutability.json` | Static JSON | Quarterly |
| Skills | 597 KB | `data/processed/skills.json` | Static JSON | Quarterly |
| SSYK Groups | 205 KB | `data/processed/ssyk-groups.json` | Static JSON | Quarterly |
| Live Jobs (Vetlanda) | Dynamic | AF JobSearch API | API call | Real-time |
| Live Jobs (comparison) | Dynamic | AF JobSearch API | API call | Real-time |

### 3.2 AF JobSearch API Calls (per dashboard load)

```
# 1. Total jobs in Vetlanda
GET /search?municipality=xJqx_SLC_415&limit=0
→ Returns: { "total": { "value": 187 } }

# 2. Jobs grouped by occupation (for bristyrken)
GET /search?municipality=xJqx_SLC_415&limit=100&offset=0
→ Returns: 100 job listings with occupation-concept-id
→ Client groups by occupation, counts per group

# 3. Repeat with offset=100 if total > 100
GET /search?municipality=xJqx_SLC_415&limit=100&offset=100

# 4. Comparison: Nässjö (for regional context)
GET /search?municipality=KfXT_ySA_do2&limit=0

# 5. Comparison: Jönköpings län
GET /search?region=MtbE_xWT_eMi&limit=0
```

**Total API calls per load: 4-6.** Well within 100/minute rate limit.

### 3.3 Computed Metrics (Client-Side)

All analytics are computed in the browser from the raw data:

```javascript
// 1. Group jobs by occupation
const jobsByOccupation = {};
jobs.forEach(job => {
  const occId = job.occupation?.concept_id;
  if (occId) {
    jobsByOccupation[occId] = (jobsByOccupation[occId] || 0) + 1;
  }
});

// 2. Sort by count = bristyrken
const shortageOccupations = Object.entries(jobsByOccupation)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

// 3. For each shortage occupation, find career transitions
shortageOccupations.forEach(([occId, count]) => {
  const transitions = findTransitionsTo(occId, substitutabilityData);
  // transitions = [{ from: "Vårdbiträde", score: 25 }, ...]
});

// 4. ROI calculation
const roiCalc = (persons, avgSalary, taxRate, trainingCost) => ({
  investment: persons * trainingCost,
  annualTaxRevenue: persons * avgSalary * 12 * taxRate,
  paybackMonths: Math.ceil((persons * trainingCost) / (persons * avgSalary * taxRate)),
  fiveYearROI: ((persons * avgSalary * 12 * taxRate * 5) - (persons * trainingCost)) / (persons * trainingCost) * 100
});
```

---

## 4. Supabase Strategy (Post-Demo, Production CityIQ)

When CityIQ moves to production, here is the full Supabase architecture.

### 4.1 CityIQ-Specific Tables

In addition to all AF data tables (shared with TalentFlow, see TalentFlow PRD):

```sql
-- Municipal customer accounts.
-- One row per subscribing municipality.
cityiq_municipalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_concept_id TEXT NOT NULL,    -- AF taxonomy ID (e.g., 'xJqx_SLC_415')
  name TEXT NOT NULL,                       -- 'Vetlanda'
  population INTEGER,                       -- 27700
  tax_rate DECIMAL(5,2),                    -- 22.36 (kommunalskattesats)
  plan TEXT CHECK (plan IN ('pilot', 'small', 'medium', 'large')),
  plan_start DATE,
  plan_end DATE,
  contact_name TEXT,
  contact_email TEXT,
  contact_role TEXT,                         -- 'Arbetsmarknadschef'
  created_at TIMESTAMPTZ DEFAULT now()
)

-- CityIQ dashboard users. Staff at the municipality who have login access.
cityiq_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id),  -- Supabase Auth
  municipality_id UUID REFERENCES cityiq_municipalities(id),
  name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Cached job snapshots. We snapshot Vetlanda's jobs daily
-- to build historical trends.
cityiq_job_snapshots (
  id SERIAL PRIMARY KEY,
  municipality_concept_id TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  total_jobs INTEGER,
  jobs_by_occupation JSONB,     -- { "occId1": 15, "occId2": 8, ... }
  jobs_by_employer JSONB,       -- { "employer1": 12, ... }
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(municipality_concept_id, snapshot_date)
)

-- Pre-computed shortage analysis per municipality.
-- Refreshed daily by cron job.
cityiq_shortage_analysis (
  id SERIAL PRIMARY KEY,
  municipality_concept_id TEXT NOT NULL,
  analysis_date DATE NOT NULL,
  occupation_id TEXT REFERENCES af_occupations(id),
  occupation_name TEXT,
  ssyk_code TEXT,
  job_count INTEGER,              -- Current open positions
  employer_count INTEGER,         -- Unique employers posting
  trend TEXT CHECK (trend IN ('increasing', 'stable', 'decreasing')),
  transition_count INTEGER,       -- How many occupations can transition here
  priority_score DECIMAL(5,2),    -- Composite shortage priority
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(municipality_concept_id, analysis_date, occupation_id)
)

-- Generated reports (PDF exports, quarterly summaries).
cityiq_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id UUID REFERENCES cityiq_municipalities(id),
  report_type TEXT CHECK (report_type IN ('quarterly', 'annual', 'custom')),
  title TEXT,
  period_start DATE,
  period_end DATE,
  file_url TEXT,                  -- Supabase Storage URL for PDF
  generated_at TIMESTAMPTZ DEFAULT now()
)
```

### 4.2 Materialized Views for CityIQ

```sql
-- Municipality labor market overview.
-- Refreshed daily at 05:00.
CREATE MATERIALIZED VIEW mv_municipality_overview AS
SELECT
  m.municipality_concept_id,
  m.name,
  m.population,
  m.tax_rate,
  (SELECT total_jobs FROM cityiq_job_snapshots
   WHERE municipality_concept_id = m.municipality_concept_id
   ORDER BY snapshot_date DESC LIMIT 1) AS current_jobs,
  (SELECT COUNT(DISTINCT occupation_id) FROM cityiq_shortage_analysis
   WHERE municipality_concept_id = m.municipality_concept_id
   AND analysis_date = CURRENT_DATE
   AND job_count > 3) AS shortage_occupation_count,
  (SELECT SUM(job_count) FROM cityiq_shortage_analysis
   WHERE municipality_concept_id = m.municipality_concept_id
   AND analysis_date = CURRENT_DATE) AS total_shortage_positions,
  (SELECT jsonb_agg(jsonb_build_object(
     'occupation', occupation_name,
     'jobs', job_count,
     'trend', trend
   ) ORDER BY job_count DESC)
   FROM cityiq_shortage_analysis
   WHERE municipality_concept_id = m.municipality_concept_id
   AND analysis_date = CURRENT_DATE
   LIMIT 10) AS top_shortages
FROM cityiq_municipalities m;

-- Career transition opportunities per municipality.
-- Shows which current workforce can fill shortage roles.
-- Refreshed weekly.
CREATE MATERIALIZED VIEW mv_municipality_transitions AS
SELECT
  sa.municipality_concept_id,
  sa.occupation_id AS shortage_occupation_id,
  sa.occupation_name AS shortage_occupation_name,
  sub.source_id AS source_occupation_id,
  occ.name AS source_occupation_name,
  sub.score AS substitutability_score,
  sub.direction
FROM cityiq_shortage_analysis sa
JOIN af_substitutability sub ON sub.target_id = sa.occupation_id
JOIN af_occupations occ ON occ.id = sub.source_id
WHERE sa.analysis_date = CURRENT_DATE
  AND sub.direction IN ('can_become', 'can_replace')
ORDER BY sa.municipality_concept_id, sub.score DESC;
```

### 4.3 Daily Data Pipeline (Supabase Edge Function + pg_cron)

```
Schedule: Every day at 04:00 CET

Step 1: Fetch jobs from AF JobSearch API for each subscribed municipality
Step 2: Insert snapshot into cityiq_job_snapshots
Step 3: Compute shortage analysis → insert into cityiq_shortage_analysis
Step 4: Refresh materialized views
Step 5: Compare with yesterday's snapshot → compute trends
Step 6: Send alert email if significant changes detected
```

**Implementation:** Supabase Edge Function (Deno runtime) triggered by pg_cron.

**Cost:** One API call per municipality per day. At 30 municipalities = 30 API calls/day = trivial.

### 4.4 Data Sizing for CityIQ

| Table | Rows (Year 1) | Rows (Year 3) | Size |
|-------|---------------|---------------|------|
| cityiq_municipalities | 5 | 50 | Negligible |
| cityiq_users | 25 | 250 | Negligible |
| cityiq_job_snapshots | 1,825 (5 × 365) | 54,750 | ~50 MB |
| cityiq_shortage_analysis | 18,250 (5 × 10 × 365) | 547,500 | ~200 MB |
| cityiq_reports | 20 (quarterly) | 600 | ~100 MB (PDFs in Storage) |
| mv_municipality_overview | 5 | 50 | Negligible |
| mv_municipality_transitions | 500 | 5,000 | ~5 MB |
| **Total CityIQ-specific** | **~20,000** | **~600,000** | **~355 MB** |

**Combined with TalentFlow data: ~386 MB.** Supabase Pro ($25/month) includes 8 GB database. We're at ~5% capacity at Year 3.

### 4.5 Multi-Tenancy (RLS for Municipal Isolation)

Each municipality only sees their own data:

```sql
-- Municipality staff can only see their own municipality's data
ALTER TABLE cityiq_shortage_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Municipality sees own data" ON cityiq_shortage_analysis
  FOR SELECT USING (
    municipality_concept_id = (
      SELECT cm.municipality_concept_id
      FROM cityiq_users cu
      JOIN cityiq_municipalities cm ON cm.id = cu.municipality_id
      WHERE cu.auth_user_id = auth.uid()
    )
  );

-- Same pattern for cityiq_job_snapshots, cityiq_reports
```

**Vetlanda cannot see Nässjö's data. Nässjö cannot see Vetlanda's data.** Standard multi-tenant SaaS pattern.

---

## 5. What the Demo Does NOT Include

| Feature | Why excluded | When |
|---------|-------------|------|
| User accounts / login | Demo is public, shown in meetings | Production v1 |
| Historical trends | Requires daily snapshots over time (need to start collecting) | Production v1 (after 30+ days of data) |
| PDF export | Nice-to-have, not needed to prove value | Production v1 |
| Comparison with other municipalities | Privacy concern (municipality data isolation) | Production v1.1 (opt-in) |
| Demand forecasting (5-year) | Requires Yrkesbarometer API integration | Production v1.1 |
| Education program recommendations | Requires SUN taxonomy + YH database | Production v1.1 |
| Custom dashboards | Enterprise feature | Large plan only |
| API access | Enterprise feature | Large plan only |

---

## 6. Technical Implementation (Demo)

### Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Static HTML + vanilla JS | Same as rest of site, no build step |
| Data | Bundled JSON + AF API (live) | Real data, no mocking |
| Charts | Chart.js or simple HTML/CSS | Lightweight, no D3.js complexity needed |
| Hosting | Vercel (existing) | Already deployed |
| Page | `cityiq-vetlanda.html` | Dedicated URL for Vetlanda pilot |

### Municipality Selector (Future)

The demo hardcodes Vetlanda. In production, a municipality selector lets CityIQ customers switch between their subscribed municipalities:

```
GET /search?municipality={selected_concept_id}&limit=100
```

The demo can easily be cloned for Nässjö or Eksjö by changing the concept ID.

### Performance Targets

| Metric | Target | How |
|--------|--------|-----|
| Dashboard load | < 5 seconds | JSON files cached + 4-6 AF API calls in parallel |
| ROI calculator response | Instant | Client-side computation, no API |
| Job detail expansion | < 1 second | Single AF API call per expansion |

---

## 7. Revenue Model — Why the State Pays

### The Logic

```
Problem:  Arbetslöshet kostar kommunen pengar (försörjningsstöd, socialtjänst)
Solution: Bättre matchning → kortare arbetslöshetsperioder → lägre kostnader
Product:  CityIQ visar VILKA som kan omskolas till VAD
Price:    75k/år (< 1 konsultdag på McKinsey)
ROI:      Om 10 personer går från bidrag till jobb = ~1.8M SEK/år i skatteintäkter
```

### Revenue Projections (from BUSINESS_MODEL.md, validated)

| Year | Municipalities | Avg Revenue | ARR |
|------|---------------|-------------|-----|
| 1 (2026) | 3-5 pilot | 50,000 SEK (rabatt) | 150-250k SEK |
| 2 (2027) | 15-25 | 150,000 SEK | 2.3-3.8M SEK |
| 3 (2028) | 30-50 | 150,000 SEK | 4.5-7.5M SEK |

### Unit Economics

- **Licensintäkt**: 150,000 SEK/år (snitt)
- **CAC**: 30-80k SEK (6-18 mån säljcykel)
- **Marginal serving cost**: ~5,000 SEK/år (Supabase + API calls)
- **Bruttomarginal**: ~95%
- **LTV (5 år)**: 750,000 SEK
- **LTV:CAC**: 9-25x

### Procurement Advantage

All prices are **under 700,000 SEK/year** = under the Swedish direct procurement threshold (direktupphandling). This means:
- No formal tender process (LOU) required
- Arbetsmarknadschefen can decide via nämnd
- Decision cycle: weeks, not months
- No Anbud paperwork

### TalentFlow is the Flywheel

TalentFlow (the person-facing product) is FREE for residents. But it's not a charity — it's a **customer acquisition tool**:

1. Municipality buys CityIQ → residents get free TalentFlow
2. Residents use TalentFlow → generates usage data
3. Usage data makes CityIQ more valuable → municipality renews
4. Happy municipality → references for selling to next municipality
5. More municipalities → more TalentFlow users → more data → better product

**TalentFlow alone doesn't generate revenue. CityIQ generates revenue. Together, they create a flywheel.**

---

## 8. Comparison: CityIQ Demo vs. TalentFlow Demo

| Aspect | TalentFlow Demo | CityIQ Demo |
|--------|----------------|-------------|
| **Audience** | Individuals (job seekers) | Municipalities (buyers) |
| **Purpose** | Prove concept works | Close a sale |
| **Input** | "What's your occupation?" | Municipality name (hardcoded: Vetlanda) |
| **Output** | Career transitions for YOU | Labor market analysis for YOUR KOMMUN |
| **Data** | Substitutability + skills | Jobs API + substitutability + ROI |
| **Tone** | Inspiring, personal | Professional, data-driven, ROI-focused |
| **CTA** | "Sign up for early access" | "Boka pilot — 75k SEK/år" |
| **Success** | User says "wow" | Buyer says "how much?" |

---

## 9. Open Questions

| Question | Impact | Decision needed by |
|----------|--------|-------------------|
| Should we include real workforce data (antal inskrivna arbetssökande per yrke)? | Much stronger pitch, but requires SCB/AF data we may not have | Before first funder meeting |
| Should the demo support other municipalities (dropdown selector)? | Shows scalability, but dilutes Vetlanda focus | After Vetlanda pilot works |
| Should we add a "Jämför med riket" benchmark? | Contextualizes local data | Post-demo v1 |
| How do we handle occupations with no substitutability data? | ~50% of occupations have no transitions | Show "Data saknas" honestly |
| Should the ROI calculator be editable by the viewer? | More engaging but risk of unrealistic inputs | Yes, with sensible min/max bounds |

---

## 10. Timeline

| Week | Deliverable |
|------|-------------|
| 1 | AF API integration working for Vetlanda (jobs, grouping, counting) |
| 2 | Shortage occupations table + career transitions rendering |
| 3 | ROI calculator + pricing section + visual polish |
| 4 | Testing with real data, fix edge cases, deploy |

**Total: 4 weeks to functional CityIQ demo.**

Both demos (TalentFlow + CityIQ) can be built in parallel since they share the same data files but have different UIs.

---

## 11. Appendix: Vetlanda Context

**Vetlanda kommun:**
- Population: 27,700
- Kommunalskattesats: 22.36%
- Major industries: Manufacturing (IKEA supplier chain, Vetlanda Trä), healthcare/eldercare, education
- AF municipality concept ID: `xJqx_SLC_415`
- Region: Jönköpings län (`MtbE_xWT_eMi`)

**Why Vetlanda first:**
1. Linnea lives in Vetlanda — local relationships
2. Science Park Vetlanda connection
3. Letter of Intent already exists (`public/loi_vetlanda_12sidor.pdf`)
4. Small municipality = fast decision process
5. Manufacturing + eldercare = clear shortage occupations (easy to demonstrate value)

**Nearby municipalities for expansion:**
- Eksjö (17,400 inv, `VacK_WF6_XVg`)
- Nässjö (31,800 inv, `KfXT_ySA_do2`)
- Jönköping (144,000 inv, `KURg_KJF_Lwc`) — target for Fas 2

**Local knowledge embedded in the product:**
- Vetlanda's manufacturing base = maskinoperatörer, svetsare, CNC-operatörer are in demand
- Aging population = undersköterskor, sjuksköterskor, hemtjänst are perennial shortages
- Small municipality = no university, dependent on YH and komvux for workforce development
- This is exactly the type of municipality that needs CityIQ — too small for McKinsey, too data-poor to DIY
