# NordiqFlow - Revolutionizing Sweden's Labor Market

*A comprehensive explanation of what NordiqFlow is, why it matters, and how it improves upon Arbetsförmedlingen*

---

## The Problem We're Solving

### What Arbetsförmedlingen Does Today

Arbetsförmedlingen (AF) is Sweden's Public Employment Service. They have:
- **Platsbanken** — A job search engine (basically Indeed, but government-run)
- **Open Data APIs** — 60+ datasets about the labor market
- **Taxonomy** — A semantic graph of occupations, skills, and education

**What they DON'T do:**
- Help people understand career transitions
- Show which skills transfer between jobs
- Predict future demand for specific competencies
- Help municipalities plan education investments
- Enable financial hedging against talent shortages

### The Gap

AF has **incredible data** but uses it for **basic job search**. It's like having a Ferrari engine and using it to power a bicycle.

**NordiqFlow takes that Ferrari engine and builds the actual car.**

---

## What NordiqFlow Actually Is

NordiqFlow is a **unified intelligence platform** built on top of Arbetsförmedlingen's open data. It transforms raw government data into actionable intelligence for two distinct audiences:

### 1. TalentFlow (B2C) — For Individuals

**The Problem:** A retail store manager doesn't know they could become a healthcare operations manager with 85% skill overlap.

**The Solution:**
```
Input:  "I'm a Store Manager in Retail"
Output: "You can become a Healthcare Operations Manager with 85% skill match.
         Missing skills: Healthcare Administration (400 YH hours).
         Salary increase: +7,000 SEK/month.
         Demand: HIGH in Stockholm (official AF forecast)."
```

**How it works:**
1. User inputs current role
2. System looks up SSYK code (Swedish occupation classification)
3. Queries AF's **substitutability data** (pre-computed career transitions!)
4. Calculates skill gap using AF's skill taxonomy
5. Finds education pathways via JobEd Connect API
6. Pulls salary data from JobSearch API
7. Checks 5-year demand forecast from Yrkesbarometer

**Price:** Free for all users (funded via municipal CityIQ licenses)

---

### 2. CityIQ (B2G/GovTech) — For Municipalities

**The Problem:** Uppsala has 200 open developer jobs but only graduates 50 developers per year. The municipality doesn't know this, and doesn't know which education investments would have the best ROI.

**The Solution:** Real-time talent gap analysis with ROI calculations.

**Example Dashboard:**
```
┌─────────────────────────────────────────────────────────────┐
│  UPPSALA KOMMUN - Talent Intelligence Dashboard             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔴 CRITICAL GAPS                                           │
│  ├─ Cloud Engineers: 200 open jobs, 50 graduates/year      │
│  ├─ Nurses: 450 open jobs, 180 graduates/year              │
│  └─ Electricians: 120 open jobs, 40 graduates/year         │
│                                                             │
│  💡 RECOMMENDED INVESTMENTS                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Cybersecurity YH Program                            │   │
│  │ Cost: 5M SEK/year                                   │   │
│  │ Graduates: 40/year                                  │   │
│  │ Jobs filled: 35/year (87.5% placement)              │   │
│  │ Tax revenue: 3.2M SEK/year                          │   │
│  │ ROI: 18 months                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Price:** 50-200k SEK/year depending on municipality size

---

## How We Improve Arbetsförmedlingen

### What AF Has (Raw Materials)

| Dataset | What It Contains | How AF Uses It |
|---------|------------------|----------------|
| SSYK Taxonomy | 430 occupation codes | Job categorization |
| Skills Database | 8,000 competencies | Job ad tagging |
| Substitutability | Career transition scores | **NOT USED** |
| Yrkesbarometer | 5-year demand forecasts | PDF reports |
| JobEd Connect | Education → Job mappings | **NOT USED** |
| Historical Ads | 10+ years of job data | **NOT USED** |

### What NordiqFlow Builds (Intelligence Layer)

| NordiqFlow Feature | AF Data Used | Value Created |
|--------------------|--------------|---------------|
| Career Pathfinder | Substitutability + Skills | Personalized transition recommendations |
| Skill Gap Analysis | Skills + JobEd Connect | "You need X to become Y" |
| Demand Forecasting | Yrkesbarometer + Historical | Predictive career advice |
| Demand Analysis | JobSearch + Skills | Labor market intelligence |
| Municipal ROI Calculator | All datasets combined | Education investment decisions |

### The Key Insight

**AF has already computed the hard stuff:**
- ✅ Which jobs are similar (substitutability scores)
- ✅ Which skills each job requires
- ✅ Which education leads to which jobs
- ✅ 5-year demand forecasts

**They just don't surface it to users.**

NordiqFlow takes these pre-computed relationships and builds user-facing products on top.

---

## The Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              ARBETSFÖRMEDLINGEN DATA LAYER                       │
│                                                                  │
│  Taxonomy API    JobSearch API    Historical API    JobStream   │
│       │               │                │                │       │
│       └───────────────┴────────────────┴────────────────┘       │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NORDIQFLOW INTELLIGENCE LAYER                 │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Supabase (PostgreSQL 15)                      │  │
│  │   pgvector (semantic search) + RLS (GDPR)               │  │
│  │   Recursive CTEs (graph-like career path queries)       │  │
│  │   Auto-generated REST API (no separate backend needed)  │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                         │                                        │
└─────────────────────────┼────────────────────────────────────────┘
                          │
           ┌──────────────┼──────────────┐
           │              │              │
           ▼              ▼              ▼
           ┌────────────┐            ┌────────────┐
           │ TalentFlow │            │   CityIQ   │
           │   (B2C)    │            │   (B2G)    │
           │            │            │            │
           │  React/    │            │  Dashboard │
           │  Next.js   │            │  + Reports │
           └────────────┘            └────────────┘
```

---

## The Data We've Already Downloaded

In `/data/raw/taxonomy/` we have:

| File | Records | Purpose |
|------|---------|---------|
| `ssyk-level-4-groups.json` | 430 occupations | Core job taxonomy |
| `skills.json` | 8,000 skills | Competency matching |
| `substitutability-relations-between-occupations.json` | 50,000+ relations | **Career transitions** |
| `ssyk-level-4-groups-with-related-occupations.json` | AI-computed similarities | Job recommendations |
| `sni-hierarchy.json` | 800 industries | Sector analysis |
| `sun-field-hierarchy.json` | 400 education paths | Training recommendations |
| `concepts-and-common-relations.json` | 34MB | Full knowledge graph |

**Total: ~35MB of structured labor market intelligence**

---

## Why This Matters for Sweden

### The Macro Problem

Sweden has:
- **Structural unemployment** — People with wrong skills for available jobs
- **Talent shortages** — Companies can't find qualified workers
- **Education mismatch** — Schools teaching skills the market doesn't need
- **Regional imbalances** — Stockholm has jobs, rural areas have workers

### How NordiqFlow Helps

1. **Individuals** get personalized career guidance based on actual data, not guesswork
2. **Companies** can hedge against talent shortages and plan workforce needs
3. **Municipalities** can invest in education that actually fills local gaps
4. **The economy** becomes more efficient as skills flow to where they're needed

---

## The Competitive Moat

### Why Competitors Can't Easily Replicate This

1. **Data Moat** — No one else has built a unified graph over AF's 60+ datasets
2. **Network Effects** — More TalentFlow users → better data → more value for CityIQ
3. **Regulatory Position** — We're building on government infrastructure, positioning as "labor market infrastructure"
4. **First-Mover** — 10+ years of historical data means AI models competitors can't train

### What LinkedIn/Indeed Don't Have

- **Official government taxonomy** — They use their own, less accurate classifications
- **Substitutability scores** — They guess at career transitions, we have official data
- **Education mappings** — They don't know which courses lead to which jobs
- **Municipal integration** — They don't serve government customers

---

## Business Model — Third-Party Payer

| Product | Target | Year 2 ARR |
|---------|--------|------------|
| TalentFlow | Free for all users | Included in CityIQ license |
| CityIQ + TalentFlow | 30 municipalities @ 75-250k/yr | 4.5M SEK |
| **TOTAL** | | **4.5M SEK** |

The municipality buys a CityIQ license, residents get TalentFlow for free — like 1177 is free for patients but the region pays.

---

## Current Status

### Completed ✅
- Downloaded all 60+ AF datasets
- Built landing page and documentation
- Mapped API structure and data relationships
- Identified key datasets for each product

### In Progress 🔄
- Building Supabase database with pgvector
- Designing TalentFlow UI (Next.js 15)
- Creating API layer via Supabase auto-generated REST

### Next Steps 📋
- [ ] Import and normalize all datasets into Supabase
- [ ] Build recursive CTE queries for career transitions
- [ ] Create `/transitions` API endpoint
- [ ] Design TalentFlow MVP interface
- [ ] Pilot CityIQ with 3 municipalities

---

## For Future Development Sessions

When working on NordiqFlow, remember:

1. **The data is already downloaded** — Check `/data/raw/taxonomy/`
2. **Substitutability is the key dataset** — This powers career transitions
3. **AF has done the ML work** — We're building UX on top of their computations
4. **Two products, one data layer** — TalentFlow and CityIQ share the same backend
5. **Swedish language** — UI should be in Swedish for B2C, English for B2B

---

## The Vision

**NordiqFlow becomes the intelligence layer for Sweden's labor market.**

Every career decision, every hiring choice, every education investment flows through our intelligence layer. We're not replacing Arbetsförmedlingen—we're making their data actually useful.

The government collects the data. We turn it into decisions.

---

*Last updated: January 5, 2026*
*Document location: `/Users/bashar/Desktop/nordiqflow/NORDIQFLOW_EXPLAINED.md`*
