# TalentFlow — Product Requirements Document

**Product**: TalentFlow by NordiqFlow AB
**Version**: 1.0 (MVP)
**Author**: Linnea Moritz (ORCID 0009-0004-9742-8608)
**Date**: February 19, 2026
**Status**: Pre-launch

---

## 1. Executive Summary

TalentFlow is an AI-powered career application platform for the Swedish labor market. It transforms Arbetsformedlingen's open taxonomy data — 8,000+ skills, 440+ occupations, pre-computed career transition scores — into a personalized job-seeking experience that no existing Swedish tool provides.

**The problem**: Sweden's public job portal (Platsbanken) matches by keyword. A store manager searching for jobs sees other store manager positions — never the healthcare operations manager role that AF's own data says they're 75% qualified for. Job seekers write one generic CV and send it everywhere. Application tracking happens in spreadsheets or not at all.

**Our solution**: TalentFlow understands what you *can do*, not what you *have done*. It:

1. Parses your CV using AI, maps your skills to Arbetsformedlingen's taxonomy
2. Shows you jobs scored by actual skill overlap (not keyword frequency)
3. Generates tailored resumes that emphasize the right skills for each job type
4. Writes personalized cover letters referencing specific job requirements
5. Tracks your entire application pipeline in one place

**What this is not**: TalentFlow does not auto-apply. It does not replace Platsbanken or LinkedIn. It is the intelligent layer between the job seeker and the job market — making every application higher quality and every job search wider.

---

## 2. Target User

### Primary Persona: "Aktiv Sokare" (Active Seeker)

| Attribute | Detail |
|-----------|--------|
| Age | 25-50 |
| Situation | Actively job seeking (unemployed, notice period, or open to change) |
| Experience | 2+ years of professional experience |
| Digital comfort | Uses internet banking, books travel online, has a smartphone |
| Pain points | Writes one CV for all jobs. Doesn't know what skills to highlight. Loses track of applications. Doesn't discover non-obvious career moves. |
| Language | Swedish (primary), some speak English at work |

### Secondary Persona: "Karriarbytare" (Career Changer)

Someone in a stable job exploring what else they could do. Uses TalentFlow to understand transferable skills and browse possibilities without commitment. Lower urgency, higher curiosity.

### Anti-Personas (Not For MVP)

- Employers or recruiters (that's a different product)
- Brand new graduates with no work experience (matching requires experience data)
- Non-Swedish speakers (UI is Swedish only in v1)

---

## 3. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 15 (App Router, TypeScript) | SSR for SEO, RSC for performance, monorepo-friendly |
| **Styling** | Tailwind CSS v4 | Utility-first, no design system library dependency, fast iteration |
| **Authentication** | Supabase Auth (Google OAuth + email magic links) | Zero-password UX, EU data residency, handles sessions |
| **Database** | Supabase (PostgreSQL 15) | Row-Level Security, real-time subscriptions, generous free tier |
| **File Storage** | Supabase Storage | CV PDF uploads (private buckets, signed URLs) |
| **AI** | Anthropic Claude API (Sonnet 4.5) | CV parsing, resume tailoring, cover letter generation |
| **Job Data** | Arbetsformedlingen Open APIs | Job listings, taxonomy, skills, NLP enrichment, substitutability |
| **PDF Generation** | @react-pdf/renderer | Server-side resume-to-PDF generation |
| **Hosting** | Vercel | Edge functions, preview deployments, monorepo support |
| **Analytics** | Plausible Analytics | GDPR-compliant, no cookie consent needed, EU-hosted |

### Deployment Architecture

```
Browser --> Vercel Edge Network --> Next.js App
                                    |-- Supabase (Auth, DB, Storage)
                                    |-- Anthropic Claude API
                                    +-- Arbetsformedlingen APIs
```

- Vercel project root: `talentflow/`
- Production domain: `app.nordiqflow.com`
- Staging: automatic preview URLs from Vercel (per PR)
- Environment variables: Vercel dashboard (never in code)

---

## 4. Information Architecture

### Sitemap

```
/                               Landing page (unauthenticated only)
/login                          Sign in with Google or email
/welcome                        Onboarding wizard (first login only)
  /welcome/step/1               Step 1: Tell us about yourself
  /welcome/step/2               Step 2: Upload your CV
  /welcome/step/3               Step 3: Review parsed profile

/dashboard                      Home base after login
/profile                        View/edit full profile
  /profile/upload               Upload a new CV (can be accessed anytime)

/jobs                           Search and browse jobs
  /jobs/[id]                    Job detail + fit breakdown

/resumes                        Manage all resumes + uploaded CVs
  /resumes/new                  Create a new tailored resume
  /resumes/[id]                 Edit a resume (split editor + preview)

/applications                   Application pipeline (kanban + list views)
  /applications/[id]            Application detail (job, resume, cover letter, notes)

/settings                       Account, preferences, data export, delete account
```

### Navigation

Top navigation bar on every authenticated page:

```
[TalentFlow logo]  Oversikt  Jobb  CV:n  Ansokningar      [Linnea M. v]
```

The user menu dropdown contains: Min profil, Installningar, Logga ut.

### Protected Routes

All routes except `/`, `/login`, and `/auth/callback` require authentication. Unauthenticated requests redirect to `/login`. After login, first-time users go to `/welcome`; returning users go to `/dashboard`.

---

## 5. Data Model

### 5.1 Users & Profiles

A user has one profile with:

- **Identity**: Name, email, Google avatar (from OAuth)
- **Professional context**: Current occupation (SSYK), municipality, years of experience, education level
- **Skills**: List of skills mapped to AF taxonomy concept IDs, each with proficiency (1-5) and source (parsed from CV, manually added, or inferred)
- **Work experience**: List of positions with title, employer, dates, description, occupation mapping
- **Education**: List of degrees with institution, field, dates, SUN code
- **Target occupations**: What kinds of jobs they're looking for (optional, helps refine matching)
- **Preferences**: Preferred locations, employment type (heltid/deltid), minimum salary, remote preference

### 5.2 Uploaded CVs

Users can upload **multiple CV files** over time:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner |
| `file_name` | text | Original filename ("Linnea_CV_2026.pdf") |
| `file_url` | text | Supabase Storage URL (signed, private) |
| `file_size_bytes` | integer | For upload limit enforcement |
| `raw_text` | text | Extracted text from PDF (for re-parsing) |
| `parsed_data` | jsonb | AI parse result (skills, experiences, education) |
| `is_primary` | boolean | Which CV is the "active" source of profile data |
| `language` | text | "sv" or "en" |
| `uploaded_at` | timestamp | When uploaded |

**Why multiple CVs?**
- People have Swedish and English versions
- People update their CV over time and want to re-parse
- Career changers might have different CVs for different directions
- Having the raw text stored means we can re-parse when our AI prompts improve

**Primary CV**: One CV is marked as primary. Its parsed data populates the user profile. The user can switch which CV is primary at any time.

### 5.3 Resumes (Generated)

Generated resumes are distinct from uploaded CVs. They're structured JSON documents created by the AI, tailored for specific job types:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner |
| `name` | text | User-chosen name ("Backend-utvecklare CV") |
| `target_type` | text | "base" / "occupation" / "job" |
| `target_occupation_id` | text | If tailored for an occupation type |
| `target_job_id` | UUID | If tailored for a specific job posting |
| `content_json` | jsonb | Structured resume (summary, experience, skills, education) |
| `content_version` | integer | Increments on each save (version history) |
| `pdf_url` | text | Last generated PDF URL |
| `pdf_generated_at` | timestamp | When PDF was last generated |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Resume types**:
1. **Base resume** (`target_type = "base"`): One per user. Contains everything. Created during onboarding from parsed CV data. Updated when profile changes.
2. **Occupation-tailored** (`target_type = "occupation"`): Tailored for a job category (e.g., "Backend-utvecklare"). Reusable across multiple applications.
3. **Job-tailored** (`target_type = "job"`): Tailored for a specific job posting. Maximum specificity.

**Version history**: Each save increments `content_version`. A separate `resume_versions` table stores past content snapshots so users can undo changes.

### 5.4 Jobs

Jobs are cached from Platsbanken and enriched with skill extraction:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Internal ID |
| `af_job_id` | text | Platsbanken ad ID (for deduplication) |
| `title` | text | Job title |
| `employer` | text | Company name |
| `employer_logo_url` | text | If available |
| `occupation_id` | text | SSYK occupation (from AF data) |
| `municipality_id` | text | Location |
| `region_id` | text | Region |
| `description_raw` | text | Full job ad text |
| `description_html` | text | Formatted HTML if available |
| `salary_range` | text | Salary info (as text -- AF doesn't standardize) |
| `employment_type` | text | Heltid, deltid, vikariat, etc. |
| `application_url` | text | Where to actually apply |
| `application_email` | text | If email application |
| `application_deadline` | date | Last day to apply |
| `published_at` | timestamp | When posted on Platsbanken |
| `is_active` | boolean | Still open for applications |
| `enriched_at` | timestamp | When we ran NLP skill extraction |

**Job skills** (extracted via AF NLP Enrichment API):

| Field | Type | Purpose |
|-------|------|---------|
| `job_id` | UUID | |
| `skill_id` | text | AF taxonomy skill concept ID |
| `confidence` | float | NLP extraction confidence (0-1) |
| `requirement_level` | text | "required" / "preferred" / "mentioned" |

**Cache strategy**: Jobs are fetched from AF on search and stored locally. Re-fetched if older than 24 hours. Active/inactive status checked against AF periodically.

### 5.5 Applications

Full pipeline tracking from save to outcome:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | |
| `user_id` | UUID | |
| `job_id` | UUID | The job applied for |
| `resume_id` | UUID | Which resume was used (nullable for "saved" status) |
| `status` | text | saved / applied / interview / offer / rejected / withdrawn |
| `fit_score` | integer | Score at time of save/apply (snapshot -- doesn't change) |
| `cover_letter` | text | AI-generated, user-edited cover letter text |
| `cover_letter_language` | text | "sv" / "en" |
| `applied_at` | timestamp | When user marked as applied |
| `interview_at` | timestamp | When interview is scheduled |
| `response_at` | timestamp | When outcome received |
| `notes` | text | Free-form notes |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Application skill gaps** (what skills the user is missing for this specific job):

| Field | Type | Purpose |
|-------|------|---------|
| `application_id` | UUID | |
| `skill_id` | text | Missing AF skill |
| `importance` | text | "required" / "preferred" |

**Status transitions**:
```
saved --> applied --> interview --> offer
                                --> rejected
                   --> rejected
         --> withdrawn (from any active state)
```

Users can move backwards (e.g., change "applied" back to "saved" if they made a mistake). But they cannot change a status after "offer" or "rejected" (terminal states -- though they can add notes).

### 5.6 AF Taxonomy Mirror

Read-only tables synced from Arbetsformedlingen's Taxonomy API:

- `af_occupations` -- 440+ occupations with SSYK codes
- `af_skills` -- 8,000+ skills with hierarchy (parent/child)
- `af_occupation_skills` -- Which skills each occupation typically requires
- `af_substitutability` -- Career transition scores between occupations (25/50/75)
- `af_regions` -- 21 Swedish regions (lan)
- `af_municipalities` -- 290 municipalities (kommuner)
- `af_demand_forecast` -- Yrkesbarometer demand/competition data

These tables are populated by a data sync script (run manually or on a schedule). The taxonomy data changes quarterly.

### 5.7 AI Activity Log

Every AI operation is logged for transparency and cost tracking:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | |
| `user_id` | UUID | |
| `action_type` | text | cv_parse, resume_tailor, cover_letter, fit_score |
| `input_tokens` | integer | Tokens sent to Claude |
| `output_tokens` | integer | Tokens received |
| `model` | text | Model used (e.g., "claude-sonnet-4-5-20250929") |
| `duration_ms` | integer | How long the API call took |
| `cost_usd` | decimal | Estimated cost |
| `created_at` | timestamp | |

---

## 6. Feature Specifications (Summary)

Detailed specs are in `FEATURES.md`. This is the overview.

### 6.1 Authentication

- **Google OAuth** (primary) + **email magic links** (fallback for users without Google)
- Supabase Auth handles sessions, tokens, and refresh
- First login triggers user creation + onboarding wizard
- Returning login goes to `/dashboard`

### 6.2 Onboarding Wizard

Three-step wizard on first login:

1. **About you**: Current occupation (autocomplete from AF taxonomy), municipality, years of experience
2. **Upload CV**: Drag-and-drop PDF or paste text. Optional — user can skip.
3. **Review profile**: Confirm parsed skills, edit experience/education, save.

This replaces the blank dashboard problem. After onboarding, the user has a populated profile and can immediately see matched jobs.

### 6.3 CV Upload & AI Parsing

- Upload PDF (max 10MB) or paste text
- Server extracts text from PDF (pdf-parse)
- Claude AI parses text into structured data: skills, experiences, education, detected occupation
- Parsed skills are fuzzy-matched against AF taxonomy to get concept IDs
- User reviews results, edits as needed, confirms
- **Multiple CVs supported**: Users can upload additional CVs anytime
- **Primary CV**: One CV feeds the profile. User can switch which one.
- **Raw text stored**: Enables re-parsing when AI improves

### 6.4 Skill Profile

- Skills displayed as tags/chips, grouped by category
- Each skill shows: name, proficiency (1-5 dots), source (CV / manual)
- User can add skills manually (autocomplete from AF taxonomy, 8,000+ options)
- User can remove skills
- Proficiency is self-assessed (default: 3 for parsed skills)

### 6.5 Job Discovery

- Real-time search against AF JobSearch API
- Each result shows fit score (0-100) based on skill overlap
- Filters: location (kommun), occupation category, minimum fit score, employment type
- Sort: fit score, date posted, deadline, relevance
- Job detail page: full description + fit breakdown (matched skills, missing skills, career path relevance)
- Pagination (20 results per page)
- Quick save button on each card (adds to "Sparade" pipeline)

### 6.6 Fit Score Calculation

Scores how well a user matches a specific job. Computed server-side.

**Formula** (three weighted components):

```
Fit Score = (skill_overlap x 0.6) + (substitutability x 0.3) + (location x 0.1)

Where:
  skill_overlap = |user_skills intersection job_skills| / |job_skills|  (0-1)
  substitutability = AF score between user's occupation and job's occupation (0/0.25/0.5/0.75)
  location = 1.0 if same kommun, 0.5 if same lan, 0.0 otherwise
```

Displayed as 0-100 with color coding:
- 80-100: Green (strong match)
- 50-79: Amber (partial match, some skill gaps)
- 0-49: Red (significant gaps)

### 6.7 Resume Builder

- **Base resume**: Auto-generated from profile data on first CV parse. Contains everything.
- **Tailored resumes**: AI rewrites the base resume to emphasize skills/experience relevant to a target job or occupation type.
- Split-pane editor: structured form on left, live PDF preview on right
- Sections: Summary, Experience (reordered + rewritten bullets), Skills (filtered + grouped), Education
- Export to PDF (server-side via @react-pdf/renderer)
- Version history: undo changes, compare versions

### 6.8 AI Cover Letter

- Generated from: user profile + job posting + selected resume + fit breakdown
- Swedish by default, English available
- References specific requirements from the job ad
- User can edit the full text
- "Regenerera" creates a new version (different angle/emphasis)
- "Kopiera" copies to clipboard for pasting into external applications
- Saved per application

### 6.9 Application Tracker

- **Kanban view**: Drag cards between columns (Sparade -> Ansokta -> Intervju -> Erbjudande)
- **List view**: Table with sortable columns (job, company, status, fit, date, resume)
- Each application card shows: job title, employer, fit score, date, resume used
- Application detail page: job posting, resume used, cover letter, status timeline, notes
- Status changes logged with timestamps (visible as timeline)
- Stats bar: total applications, active count, response rate
- Rejected applications in collapsed section (not prominent, but accessible)

### 6.10 Settings

- Account: name, email (read-only from OAuth)
- Preferences: default location, employment type, language for AI outputs
- **Data export**: Download all your data as JSON (GDPR Article 20)
- **Delete account**: Permanently delete all data (GDPR Article 17). Requires confirmation.

---

## 7. AI Integration

### 7.1 Models Used

| Task | Model | Input | Output | Est. Cost/Call |
|------|-------|-------|--------|----------------|
| CV Parsing | Claude Sonnet 4.5 | CV text (~2000 tokens) | Structured JSON (~1500 tokens) | ~$0.02 |
| Resume Tailoring | Claude Sonnet 4.5 | Profile + job (~3000 tokens) | Tailored resume JSON (~2000 tokens) | ~$0.03 |
| Cover Letter | Claude Sonnet 4.5 | Profile + job + fit (~2500 tokens) | Letter text (~800 tokens) | ~$0.02 |

**Monthly cost estimate** (at 100 WAU, 3 AI actions/user/week):
- 1,200 API calls x $0.025 avg = **~$30/month**

### 7.2 AI Safety Guardrails

- AI never fabricates experience. Prompts explicitly say "only include real experience from the profile"
- AI never auto-submits applications. User always reviews and confirms
- All AI outputs are editable. Users control the final version
- AI activity is logged (model, tokens, cost) for monitoring
- Rate limiting: max 20 AI calls per user per day (prevents abuse, keeps costs predictable)

### 7.3 Fallback Behavior

If Claude API is down or rate-limited:
- CV parsing: Show manual entry form instead
- Resume tailoring: Show the base resume and let user edit manually
- Cover letter: Show a template the user can fill in
- Error message: "AI-tjansten ar tillfalligt otillganglig. Du kan fortsatta manuellt."

---

## 8. External API Dependencies

| API | Base URL | Auth | Rate Limits | Fallback |
|-----|----------|------|-------------|----------|
| AF JobSearch | `jobsearch.api.jobtechdev.se` | None | Undocumented (~100 req/min) | Show cached results |
| AF Taxonomy | `taxonomy.api.jobtechdev.se` | None | Undocumented | Use local mirror tables |
| AF Enrichments | `jobad-enrichments.api.jobtechdev.se` | None | Undocumented | Skip enrichment, use raw text |
| Anthropic Claude | `api.anthropic.com` | API key | Per plan | Manual entry fallback |
| Supabase | Project URL | Project keys | Per plan | App non-functional |

**Caching strategy**:
- Taxonomy data: Synced to DB, refreshed quarterly
- Job listings: Cached in DB per search, 24-hour TTL
- Job skill enrichments: Cached per job, never expires (job ads don't change)
- AF demand forecasts: Synced to DB, refreshed bi-annually

---

## 9. Security & Privacy

### Authentication & Authorization

- All auth via Supabase (handles JWTs, refresh, session management)
- Row-Level Security (RLS) on every user-data table: `WHERE user_id = auth.uid()`
- API routes validate JWT on every request
- File uploads: private Supabase Storage bucket, access via signed URLs (15-minute expiry)

### API Key Management

- `ANTHROPIC_API_KEY`: Server-side only (Vercel env var, never exposed to client)
- `SUPABASE_SERVICE_ROLE_KEY`: Server-side only (for admin operations)
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Client-safe (RLS enforces access)

### GDPR Compliance

| Right | Implementation |
|-------|---------------|
| Right to access (Art. 15) | `/settings` -> "Ladda ner mina data" exports JSON |
| Right to portability (Art. 20) | Same export, machine-readable format |
| Right to erasure (Art. 17) | `/settings` -> "Radera mitt konto" deletes all data |
| Right to rectification (Art. 16) | User can edit all profile data anytime |
| Data minimization (Art. 5) | We only store what's needed for the service |
| Consent (Art. 6) | Legitimate interest for core features; consent for analytics |

### Data Residency

- Supabase: EU region (Frankfurt or Stockholm)
- Vercel: Edge functions run globally, but DB calls go to EU
- Anthropic: US-based API (CV text leaves EU -- disclosed in privacy policy, processing is necessary for service)

---

## 10. Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | < 1.2s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| Time to Interactive | < 3.0s | Lighthouse |
| Job search results | < 2s | Server response time |
| CV parse (AI) | < 20s | End-to-end with loading state |
| Cover letter (AI) | < 15s | End-to-end with loading state |
| Resume PDF generation | < 5s | Server-side rendering |
| Page transitions | Instant | Client-side navigation |

---

## 11. MVP Scope

### In Scope (v1.0)

- Google OAuth + email magic link authentication
- Onboarding wizard (3 steps)
- Multiple CV upload with AI parsing
- Skill profile with AF taxonomy mapping
- Job search with fit scores and filtering
- Job detail with fit breakdown
- Resume builder with AI tailoring (base + occupation + job-specific)
- AI cover letter generation (Swedish/English)
- Application tracker (kanban + list views)
- PDF export for resumes
- Settings with GDPR data export/delete
- Swedish language UI
- Plausible analytics

### Out of Scope (v1.0)

- Mobile native app (responsive web only)
- Push notifications / email notifications
- Employer/recruiter features
- LinkedIn import
- Payment / subscription tiers
- Multi-language UI (only Swedish)
- Auto-apply functionality
- Career transition planner (separate from job matching)
- Team/collaborative features
- API for third-party integrations
- Offline mode

### v1.1 Candidates (Post-Launch)

- Email notifications (application deadline reminders, new job matches)
- LinkedIn CV import
- Interview preparation (AI-generated questions based on job + profile)
- Salary comparison data
- Career transition explorer (full use of substitutability graph)
- Chrome extension for saving jobs from any site

---

## 12. Success Metrics

### Quantitative (3 months post-launch)

| Metric | Target | How Measured |
|--------|--------|-------------|
| Registered users | 500 | Supabase Auth count |
| Weekly active users | 100 | Plausible analytics |
| CV uploads | 600 | Database count |
| Resumes created | 1,200 | Database count |
| Cover letters generated | 800 | AI activity log |
| Applications tracked | 2,500 | Database count |
| Avg. fit score of applied jobs | > 65% | Application data |
| PDF downloads | 1,000 | API route count |

### Qualitative

- User feedback: "TalentFlow showed me jobs I wouldn't have found" > 60% of surveyed users
- User feedback: "The tailored CV helped me feel more confident applying" > 70%
- User feedback: "I understand my skill gaps better now" > 65%

### Business Validation

- Demonstrates demand for skill-based matching in Sweden
- Validates the technology before institutional sales (CityIQ for municipalities)
- Creates a user base for future B2B product referrals

---

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| AF API deprecation or breaking changes | Low | High | Taxonomy data cached locally; job search can fall back to stored jobs |
| Claude API cost overruns | Medium | Medium | Rate limits (20 calls/user/day), spending caps on Anthropic dashboard, Haiku for simple tasks |
| Low organic adoption | High | Medium | Launch on AF community forums (jobtechdev.se), LinkedIn content, university career centers |
| GDPR complaint | Low | High | Data export/delete built in from day 1, EU data residency, privacy policy reviewed |
| AI generates poor/hallucinated content | Medium | Medium | All AI output user-editable, never auto-submitted, clear "AI-genererat" labels |
| Supabase free tier limits hit | Medium | Low | Monitor usage, upgrade to Pro ($25/mo) when needed |
| Resume PDF quality issues | Medium | Low | Use battle-tested @react-pdf/renderer, test with real Swedish text |

---

## 14. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- Auth flow (Google OAuth + email magic links)
- Onboarding wizard
- CV upload + AI parsing + profile save
- Base resume auto-generation
- Database setup + RLS policies

### Phase 2: Job Discovery (Weeks 3-4)
- Job search API integration
- Fit score calculation
- Job listing page with filters
- Job detail page with fit breakdown
- Quick-save to applications

### Phase 3: Resume & Cover Letter (Weeks 5-6)
- Resume builder (editor + preview)
- AI resume tailoring
- PDF generation and download
- AI cover letter generation
- Save to application

### Phase 4: Pipeline & Polish (Weeks 7-8)
- Application tracker (kanban + list)
- Application detail page
- Status timeline
- Settings page (preferences, GDPR)
- Error handling, loading states, empty states
- Mobile responsive pass
- Analytics setup

### Phase 5: Launch (Week 9)
- Production deployment
- Domain setup (app.nordiqflow.com)
- Privacy policy / terms of service
- Launch communications
- Monitoring and alerting

---

## 15. Open Questions

| Question | Decision Needed By | Owner |
|----------|-------------------|-------|
| Should we support BankID login in addition to Google? | Before launch | Linnea |
| What's the privacy policy language for sending CV text to Anthropic US? | Before launch | Legal advisor |
| Should we partner with any Arbetsformedlingen offices for user testing? | Phase 4 | Linnea |
| What's the pricing model for post-free-tier? | Post-launch (3 months) | Linnea |
| Should career transition recommendations be in v1 or v1.1? | Phase 2 | Linnea |
