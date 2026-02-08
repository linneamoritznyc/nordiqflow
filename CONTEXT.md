# NordiqFlow - AI Context Document

*This document is designed to give AI assistants complete context about this project*

---

## Quick Summary

**NordiqFlow** is a Swedish labor market intelligence platform that transforms Arbetsförmedlingen's (Swedish Public Employment Service) open data into actionable products for individuals, businesses, and municipalities.

**Repository**: `github.com/linneamoritznyc/nordiqflow`  
**Deployment**: `https://nordiqflow-hr2n.vercel.app/`  
**Author**: Linnea Moritz  
**ORCID**: 0009-0004-9742-8608

---

## Project Origin Story

### Phase 1: Kompetensbryggan (Research Prototype)

The project started as **Kompetensbryggan** ("Skills Bridge AI") — a proof-of-concept that demonstrated:

1. Traditional job matching fails because it matches **titles**, not **skills**
2. Arbetsförmedlingen's taxonomy contains pre-computed career transitions that aren't surfaced to users
3. By extracting "skill atoms" from CVs and matching against a semantic graph, we can reveal hidden career paths

**Location**: `/Kompetensbryggan/` folder contains the original Python/Streamlit prototype.

### Phase 2: NordiqFlow (Production Platform)

Kompetensbryggan proved the thesis. NordiqFlow scales it into three commercial products:

| Product | Target | What It Does |
|---------|--------|--------------|
| **TalentFlow** | B2C (Job seekers) | Personalized career transition recommendations |
| **CityIQ** | B2G (Municipalities) | Talent gap analysis with education ROI |

---

## Core Technical Insight

Arbetsförmedlingen has **already computed** the hard stuff:

| What They Have | File/API | How We Use It |
|----------------|----------|---------------|
| Career transition scores | `substitutability-relations-between-occupations.json` | TalentFlow recommendations |
| Skill requirements per job | `concepts-and-common-relations.json` | Skill gap analysis |
| 5-year demand forecasts | Yrkesbarometer API | Predictive scoring |
| Education → Job mappings | JobEd Connect API | Training recommendations |
| NLP text enrichment | JobAd Enrichments API | CV → skill atoms |

**They don't surface this to users.** We build the UX layer.

---

## Repository Structure

```
nordiqflow/
├── Kompetensbryggan/          # Original research prototype
│   ├── bryggan.py             # Main Streamlit app
│   ├── loaders.py             # Data loading with hierarchy
│   ├── engine.py              # Matching logic
│   ├── *.json                 # Downloaded taxonomy data
│   └── README.md              # Prototype documentation
│
├── data/                      # Downloaded Arbetsförmedlingen datasets
│   └── raw/taxonomy/          # 60+ JSON files
│
├── data_scraper/              # Scripts to download AF data
│   ├── download_all_datasets.py
│   └── README.md
│
├── docs/                      # Documentation and research
│   ├── API_RESEARCH.md        # AF API documentation
│   ├── MATCHING_ALGORITHM.md  # Technical matching spec
│   ├── data_structure/        # Data schema guides
│   └── *.docx                 # Original research docs (Swedish)
│
├── index.html                 # Landing page (deployed to Vercel)
├── NORDIQFLOW_EXPLAINED.md    # Business overview
├── CONTEXT.md                 # This file (AI context)
└── README.md                  # Project README
```

---

## Key Data Files

### In `/Kompetensbryggan/` and `/data/raw/taxonomy/`:

| File | Size | Critical For |
|------|------|--------------|
| `skills.json` | 543 KB | 8,000+ skill "atoms" |
| `concepts-and-common-relations.json` | 34 MB | Master relationship graph |
| `substitutability-relations-between-occupations.json` | 2.3 MB | **Career transitions** (GOLD) |
| `ssyk-level-4-groups.json` | 153 KB | Swedish occupation codes |
| `the-ssyk-hierarchy-with-occupations.json` | 398 KB | Full occupation tree |

### Data Access Pattern

```python
# ALWAYS access data this way:
with open('skills.json') as f:
    data = json.load(f)
    concepts = data['data']['concepts']  # NOT data directly!
    
# IDs are STRINGS like '15e8_KDZ_31Z'
# Use re.escape() for labels like "C++" or ".NET"
```

---

## The Matching Algorithm

### Three-Layer System

1. **Semantic Matching**: CV text → NLP enrichment → concept IDs (not keywords)
2. **Graph Traversal**: Substitutability scores for career transitions
3. **Predictive Scoring**: Demand forecasts + salary delta + market situation

### Key Formula

```python
# Skill match percentage
score = len(candidate_skills & job_required_skills) / len(job_required_skills)

# Career transition score (from AF data)
substitutability_level = 75  # High (75), Medium (50), Low (25)
```

See `/docs/MATCHING_ALGORITHM.md` for full technical specification.

---

## Academic Foundation

This work builds on Nobel Prize-winning economic theory:

1. **Search and Matching Theory** (Diamond, Mortensen, Pissarides 2010)
   - Labor markets have "frictions" — semantic matching reduces them

2. **Human Capital Theory** (Becker 1964)
   - Skills transfer across jobs; titles hide this

3. **Signaling Theory** (Spence 1973)
   - Job titles are noisy signals; skill atoms are cleaner

4. **Synthetic Control Methods** (Abadie, Diamond 2010)
   - For measuring causal impact of the matching system

---

## Swedish Terms Reference

| Swedish | English | Context |
|---------|---------|---------|
| Arbetsförmedlingen (AF) | Public Employment Service | Data source |
| Kompetensbryggan | Skills Bridge | Original prototype |
| SSYK | Swedish occupation classification | Like O*NET |
| SNI | Swedish industry classification | Like NAICS |
| SUN | Swedish education classification | Education codes |
| Yrkesbarometer | Occupation barometer | 5-year forecasts |
| Släktskap | Kinship/Substitutability | Career transitions |

---

## For AI Assistants

### When Working on This Project:

1. **Data is already downloaded** — Check `/data/raw/taxonomy/` and `/Kompetensbryggan/`
2. **Substitutability is key** — This powers career transitions
3. **AF did the ML** — We build UX on their computations
4. **Two products, one backend** — TalentFlow and CityIQ share data
5. **Swedish UI, English docs** — B2C is Swedish, technical docs are English

### Common Tasks:

- **Add career recommendation logic**: Use `substitutability-relations-between-occupations.json`
- **Calculate skill gaps**: Compare candidate skills vs job requirements in `concepts-and-common-relations.json`
- **Find education paths**: Use JobEd Connect API or SUN mappings
- **Check demand forecasts**: Yrkesbarometer data

### Don't:

- Rebuild ML models — AF has pre-computed everything
- Use keyword matching — Use concept IDs
- Ignore hierarchy — Skills have parent/child relationships

---

## Links

- **Live Site**: https://nordiqflow-hr2n.vercel.app/
- **GitHub**: https://github.com/linneamoritznyc/nordiqflow
- **AF Open Data**: https://jobtechdev.se/
- **Taxonomy API**: https://taxonomy.api.jobtechdev.se/

---

*This document should give any AI assistant enough context to contribute meaningfully to NordiqFlow.*

*Last updated: January 5, 2026*
