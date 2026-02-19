# TalentFlow - Product Requirements Document

**Product**: TalentFlow by NordiqFlow
**Version**: 1.0 (MVP)
**Author**: Linnea Moritz
**Date**: February 2026

---

## 1. Overview

TalentFlow is an AI-powered job application tool for the Swedish labor market. It helps job seekers create tailored resumes, discover jobs they're actually qualified for (not just keyword matches), and apply with AI-generated cover letters — all powered by Arbetsformedlingen's open taxonomy data.

### What makes it different

Arbetsformedlingen's Platsbanken is a job board. You search, you read ads, you apply manually. TalentFlow is an **application engine**:

- It understands your skills (not your job title)
- It finds jobs you didn't know you qualified for
- It writes a different resume for each type of job
- It tracks everything in one place

### Target user

Swedish job seekers actively looking for work or considering a career change. Initial focus: ages 25-45, white-collar and skilled trades, comfortable with digital tools.

---

## 2. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 15 (App Router) | Already used in project, SSR, great DX |
| Styling | Tailwind CSS | Fast iteration, consistent design |
| Auth | Supabase Auth (Google OAuth) | Simple, free tier, handles sessions |
| Database | Supabase (PostgreSQL) | Relational data, RLS, free tier |
| File Storage | Supabase Storage | CV uploads (PDF) |
| AI | Anthropic Claude API | CV parsing, cover letter generation, resume tailoring |
| Job Data | Arbetsformedlingen APIs | Job listings, taxonomy, skills, substitutability |
| Hosting | Vercel | Already deployed, monorepo support |
| Language | TypeScript | Type safety across the stack |

### Deployment

- Vercel project with Root Directory set to `talentflow/`
- Separate from the nordiqflow.com marketing site
- Domain: `app.nordiqflow.com` or `talentflow.nordiqflow.com`

---

## 3. Core User Flow

```
Sign in with Google
       |
       v
Upload CV (PDF or paste text)
       |
       v
AI parses CV --> extracts skills, experience, education
       |
       v
Dashboard shows:
  - Your skill profile (mapped to AF taxonomy)
  - Matched jobs from Platsbanken (scored by fit)
  - Career directions you could take
       |
       v
User browses jobs --> sees fit score + skill gaps for each
       |
       v
User picks a job --> TalentFlow generates:
  - Tailored resume (emphasizes relevant skills)
  - Cover letter (references specific job requirements)
       |
       v
User reviews/edits --> applies
       |
       v
Application tracked in pipeline (saved/applied/interview/offer/rejected)
```

---

## 4. MVP Features (v1.0)

### 4.1 Authentication

- **Google OAuth** via Supabase Auth
- No email/password for MVP (reduces friction)
- Session persists across visits
- User profile created on first login

### 4.2 CV Upload & Parsing

- Upload PDF or paste text
- Claude AI extracts:
  - Skills (mapped to AF skill taxonomy IDs)
  - Work experience (titles, employers, dates)
  - Education (degree, field, institution)
  - Current/most recent occupation (mapped to SSYK)
- User can review and edit extracted data
- Parsed profile stored in database

### 4.3 Skill Profile

- Visual display of user's skills mapped to AF taxonomy
- Skills grouped by category (tech, soft skills, domain knowledge)
- Proficiency levels (self-assessed or inferred from experience years)
- Skill gaps highlighted when viewing specific jobs

### 4.4 Job Discovery

- Jobs scraped from Platsbanken via AF JobSearch API
- Each job enriched with:
  - Required skills (via AF NLP enrichment)
  - Occupation classification (SSYK)
  - Location (kommun/lan)
- **Fit score** (0-100) for each job based on:
  - Skill overlap between user profile and job requirements
  - Substitutability score (can the user realistically do this job?)
  - Location match
- Filter by: location, occupation category, fit score, salary
- Sort by: fit score, date posted, salary, deadline

### 4.5 Resume Builder

- **Base resume**: Master resume with all experience/skills
- **Tailored resumes**: Generated per job type or specific job
  - AI selects which skills/experience to emphasize
  - AI rewrites bullet points to match job language
  - User can edit everything
- Multiple resumes stored and named ("Tech Resume", "PM Resume")
- Export to PDF

### 4.6 AI Cover Letter

- Generated per job application
- References specific skills from job ad
- Highlights user's matching experience
- Swedish language (with option for English)
- User can edit before sending

### 4.7 Application Tracker

- Kanban-style pipeline: Saved -> Applied -> Interview -> Offer -> Rejected
- Each application links to: job, resume used, cover letter, notes
- Timeline of activity
- Basic stats: total applied, response rate, active applications

---

## 5. Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Marketing page for non-logged-in users, dashboard for logged-in |
| `/login` | Login | Google OAuth sign-in |
| `/dashboard` | Dashboard | Overview: skill profile, top job matches, recent applications |
| `/profile` | Profile | Edit parsed CV data, skills, preferences |
| `/profile/upload` | CV Upload | Upload PDF or paste CV text |
| `/jobs` | Job Browser | Search and browse matched jobs with fit scores |
| `/jobs/[id]` | Job Detail | Full job posting, fit breakdown, skill gaps, apply button |
| `/resumes` | Resume List | All saved resumes |
| `/resumes/[id]` | Resume Editor | Edit a specific resume |
| `/resumes/new` | New Resume | Create tailored resume (select target job/occupation) |
| `/applications` | Applications | Kanban pipeline of all applications |
| `/applications/[id]` | Application Detail | Full application with job, resume, cover letter, notes |
| `/settings` | Settings | Account, preferences, notifications |

---

## 6. Database Schema

See `docs/DATABASE_SCHEMA.sql` for the full PostgreSQL schema.

Key tables:
- `users` - Account + profile (current occupation, location)
- `user_skills` - Skills extracted from CV, mapped to AF taxonomy
- `resumes` - Multiple per user, each with target occupation
- `jobs` - Scraped from Platsbanken, enriched with skills
- `applications` - Links user + job + resume, tracks status
- `application_skill_gaps` - What skills are missing per application
- `af_*` tables - Mirror of AF taxonomy data (occupations, skills, regions, etc.)

---

## 7. AI Integration Points

### 7.1 CV Parsing (existing, needs upgrade)

- **Current**: `/api/parse-cv.js` uses Claude to extract skills from text
- **Upgrade**: Return structured data matching database schema (experiences, education, skills with AF IDs)
- **Model**: Claude Sonnet 4.5

### 7.2 Resume Tailoring (new)

- Input: Base resume + target job posting
- Output: Rewritten resume emphasizing relevant skills/experience
- Model: Claude Sonnet 4.5
- Prompt strategy: Provide AF skill overlap data to guide the AI

### 7.3 Cover Letter Generation (new)

- Input: User profile + job posting + selected resume
- Output: Cover letter in Swedish (or English)
- Model: Claude Sonnet 4.5
- Must reference specific skills and experience, not generic text

### 7.4 Fit Scoring (new)

- Input: User skills + job required skills
- Output: Score 0-100 + breakdown
- Can be computed without AI (pure data comparison against AF taxonomy)
- AI used only for edge cases (skill inference)

---

## 8. External API Dependencies

| API | Auth Required | Used For |
|-----|---------------|----------|
| AF JobSearch API | No | Real-time job listings |
| AF Taxonomy API | No | Occupations, skills, regions, municipalities |
| AF JobAd Enrichments API | No | Extract skills from job ad text |
| Anthropic Claude API | Yes (API key) | CV parsing, resume tailoring, cover letters |
| Supabase | Yes (project keys) | Auth, database, storage |
| Google OAuth | Yes (client ID) | User authentication |

---

## 9. Non-Functional Requirements

### Performance
- Page load: < 2 seconds
- Job search results: < 3 seconds
- AI operations (CV parse, cover letter): < 15 seconds with loading state

### Security
- All API keys server-side only (Vercel env vars)
- Supabase Row Level Security on all user data
- No user data shared between accounts
- GDPR compliant: users can export and delete their data

### Scalability
- Supabase free tier: 500MB database, 1GB storage, 50k monthly active users
- Vercel free tier: 100GB bandwidth, serverless functions
- AF APIs: no rate limits documented, but be respectful (cache results)

### Language
- UI: Swedish (primary), English (future)
- AI outputs: Swedish by default, English optional
- Code/docs: English

---

## 10. MVP Scope Boundaries

### In scope (v1.0)
- Google login
- CV upload and AI parsing
- Job browsing with fit scores
- Resume builder with AI tailoring
- Cover letter generation
- Application tracking
- Swedish language UI

### Out of scope (v1.0)
- Mobile app
- Email notifications
- Team/employer features
- LinkedIn integration
- Payment/subscription
- Multi-language UI
- Auto-apply (user must manually submit applications)
- Career transition recommendations (use existing nordiqflow.com demo for now)

---

## 11. Success Metrics

| Metric | Target (3 months post-launch) |
|--------|-------------------------------|
| Registered users | 500 |
| Weekly active users | 100 |
| Resumes created | 1,000 |
| Applications tracked | 2,000 |
| Average fit score accuracy | Users report "useful" > 70% of the time |

---

## 12. Risks

| Risk | Mitigation |
|------|-----------|
| AF API goes down or changes | Cache job data locally, taxonomy data already downloaded |
| Claude API costs | Monitor usage, set spending caps, use Haiku for simple tasks |
| Low initial adoption | Leverage nordiqflow.com traffic, AF community forums |
| GDPR compliance | Supabase handles EU data residency, add data export/delete |
| Resume quality | Always let users edit AI output, never auto-submit |
