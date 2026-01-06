# Kompetensbryggan (Skills Bridge AI)

*The foundational research prototype that led to NordiqFlow*

---

## What Is This?

Kompetensbryggan ("The Skills Bridge") is a proof-of-concept skill-matching engine that demonstrates how AI can identify **latent competencies** in job seekers by analyzing their CVs against Sweden's official labor market taxonomy.

**This prototype proved the core thesis that became NordiqFlow:**
> Traditional job matching fails because it matches job *titles*, not *skills*. By extracting "skill atoms" from unstructured text and matching them against a semantic graph, we can reveal career paths that keyword matching would never find.

---

## The Problem It Solves

### The Granularity Gap

When a job seeker writes "Google Ads" on their CV, and a job posting requires "Marketing", traditional systems see **0% match** because the strings don't match.

But in reality:
- Google Ads **is a subset of** Digital Marketing
- Digital Marketing **is a subset of** Marketing
- Therefore: Google Ads experience **implies** Marketing competence

Kompetensbryggan solves this by using Arbetsförmedlingen's taxonomy graph to traverse these hierarchical relationships.

### Before vs After

| Traditional Matching | Kompetensbryggan |
|---------------------|------------------|
| "Google Ads" ≠ "Marketing" → 0% | "Google Ads" ⊂ "Marketing" → 85% |
| Exact keyword matching | Semantic graph traversal |
| Binary (match/no match) | Percentage with skill gap analysis |
| No career suggestions | "You're 3 skills away from Role X" |

---

## How It Works

### 1. Skill Atom Extraction

```python
# From bryggan.py
for s_id, s_name in db['skills'].items():
    if re.search(rf"\b{re.escape(s_name.lower())}\b", cv_text):
        detected.append({'id': s_id, 'name': s_name})
```

The system scans CV text for exact matches against 8,000+ skills in the JobTech taxonomy. Each match is a "skill atom" — the smallest unit of competence.

### 2. Hierarchical Expansion

```python
# From loaders.py
parents = [str(b['id']) for b in s.get('broader', []) if 'id' in b]
if parents:
    db['hierarchy'][s_id] = parents
```

For each detected skill, we also include its parent concepts. If you have "Python", you implicitly have "Programming".

### 3. Occupation Matching

```python
# From bryggan.py
for rel in db['relations']:
    job_skills = {r['id'] for r in rel.get('relations', [])}
    hits = my_ids.intersection(job_skills)
    score = len(hits) / len(job_skills)
```

We calculate what percentage of each occupation's required skills you possess.

### 4. Gap Analysis

```python
missing = job_skills - my_ids
for m in missing:
    all_missing[m] = all_missing.get(m, 0) + 1
```

We identify which skills you're missing, and rank them by how many jobs they would unlock.

---

## Data Sources

All data comes from **Arbetsförmedlingen's Open Data** (JobTech):

| File | Size | Purpose |
|------|------|---------|
| `skills.json` | 543 KB | 8,000+ competence "atoms" |
| `concepts-and-common-relations.json` | 34 MB | Master graph with all relationships |
| `the-ssyk-hierarchy-with-occupations.json` | 398 KB | Swedish occupation classification |
| `substitutability-relations-between-occupations.json` | 2.3 MB | Pre-computed career transitions |
| `sni-*.json` | Various | Industry classifications |
| `sun-*.json` | Various | Education classifications |

---

## Running the Prototype

```bash
cd Kompetensbryggan
pip install streamlit PyPDF2 plotly pandas
streamlit run bryggan.py
```

Upload a PDF CV and see:
1. **Your Profile** — Detected skill atoms
2. **Top Matches** — Occupations ranked by skill overlap
3. **Development Plan** — Skills that unlock the most jobs

---

## From Kompetensbryggan to NordiqFlow

Kompetensbryggan proved the concept. NordiqFlow scales it into three products:

| Kompetensbryggan | NordiqFlow |
|------------------|------------|
| Single-user CV analysis | TalentFlow: Career guidance platform |
| Manual skill gap display | Automated education pathway recommendations |
| Local prototype | Cloud-deployed SaaS |
| — | SkillHedge: Tradeable labor market indices |
| — | CityIQ: Municipal talent gap analysis |

**The key insight that transferred:**
> Arbetsförmedlingen has already computed career transitions (substitutability scores), skill requirements, and demand forecasts. They just don't surface it to users. We build the UX layer.

---

## Academic Foundation

This work is grounded in Nobel Prize-winning economic theory:

1. **Search and Matching Theory** (Diamond, Mortensen, Pissarides 2010)
   - Labor markets have "frictions" — it takes time to match workers to jobs
   - Kompetensbryggan reduces these frictions through semantic matching

2. **Human Capital Theory** (Becker 1964)
   - Skills are investments that transfer across jobs
   - Our system reveals "general human capital" hidden behind job titles

3. **Signaling Theory** (Spence 1973)
   - Job titles are "noisy signals" of actual competence
   - Skill atoms provide a cleaner signal

---

## Key Files

| File | Purpose |
|------|---------|
| `bryggan.py` | Main Streamlit application |
| `loaders.py` | Data loading with hierarchical mapping |
| `engine.py` | Core matching logic |
| `visualizer.py` | Plotly visualizations |
| `ARCHITECTURE.txt` | Technical documentation |

---

## For AI Agents Reading This

If you're an AI assistant working on this codebase:

1. **Data envelope**: Always access `root['data']['concepts']`, never the root directly
2. **ID types**: All JobTech IDs are strings like `'15e8_KDZ_31Z'`
3. **Regex safety**: Use `re.escape()` for labels like "C++" or ".NET"
4. **Relation merging**: Occupations need both `related` AND `broader` fields for full skill profiles
5. **The parent project is NordiqFlow**: This folder contains the research prototype; the production system is being built in the parent directory

---

*Last updated: January 5, 2026*
