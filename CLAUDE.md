# NordiqFlow - Project Context

## Overview
NordiqFlow builds AI-driven career and competency analysis for Sweden's labour market. Two products: **TalentFlow** (free career platform for individuals) and **CityIQ** (B2G municipal talent analytics).

## Site Structure
- Static HTML site deployed on Vercel from repo root
- TalentFlow app scaffolded in `talentflow/` (Next.js 15, not yet deployed)
- PDFs and downloadable docs go in `public/` folder
- Artiklar page (`artiklar.html`) serves as document library for investors/meetings

## Key Files
- `investors.html` — Investor pitch page (Swedish)
- `artiklar.html` — Document library with all downloadable PDFs/articles
- `talentflow/PRD.md` — TalentFlow product requirements
- `talentflow/DESIGN_SYSTEM.md` — Visual identity and component specs
- `talentflow/FEATURES.md` — Feature specifications
- `docs/DATABASE_SCHEMA.sql` — Database schema

## Investor Article: `nordiqflow_investor_article.docx.pdf`
Full investigative article about Sweden's employment matching crisis. Located in `public/`.

### What's in it:
The article covers six areas with real numbers and named sources:

- **Political timeline** — Reinfeldt's 2008 creation of AF, the Januariavtalet point 18, Maria Mindhammar's December 2019 appointment mid-chaos, the RoM launch, and the Tidöavtalet era cuts
- **The money trail** — SEK 79.8 billion in 2023 labour market spending, the 46-70% cost premium on Rusta och Matcha (IFAU Rapport 2024:17), provider performance ranging from 2% to 56%
- **Matching efficiency collapse** — Riksbank Beveridge curve analysis, the keyword matching failure, the aktivitetsrapport compliance trap
- **Skills mismatch crisis** — SCB Q3 2024 data (70,000 vacancies + 8.3% unemployment simultaneously), TechSverige's 18,000/year tech shortfall
- **The technology gap** — JobTech Dev's world-class open data vs. Platsbanken's title-matching interface
- **Investment thesis** — 6x fiscal ROI calculation at 1,000 users, 2-month acceleration assumption

## Tech Stack
- **Frontend**: Static HTML/CSS (current site), Next.js 15 + TypeScript + Tailwind (TalentFlow)
- **Backend**: Supabase (Auth + PostgreSQL + RLS)
- **AI**: Anthropic Claude Sonnet 4.5 (CV parsing, resume tailoring, cover letters)
- **Data**: Arbetsförmedlingen Open APIs (JobSearch, Taxonomy, Enrichments)
- **Deployment**: Vercel

## Brand
- Colors: Dark navy `#1a1a2e`, Purple accent `#667eea`, Gradient `#667eea → #764ba2`
- Language: Site primarily in Swedish, some English content
- Tone: Professional, data-driven, competent
