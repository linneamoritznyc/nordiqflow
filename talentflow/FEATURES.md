# TalentFlow - Feature Specification

Detailed user flows, component specs, and implementation notes for each feature.

---

## Feature 1: Authentication (Google OAuth)

### User Flow

```
User visits app.nordiqflow.com
       |
       v
Not logged in --> show landing page with "Logga in med Google" button
       |
       v
Click --> redirect to Google OAuth consent screen
       |
       v
User approves --> redirect back to /dashboard
       |
       v
First login? --> create user row in database with Google email + name
Returning?   --> load existing profile
```

### Implementation

- **Supabase Auth** with Google provider
- `src/lib/supabase.ts` — client-side Supabase instance
- `src/lib/supabase-server.ts` — server-side Supabase instance (for API routes)
- `src/middleware.ts` — protect routes, redirect unauthenticated users to `/login`
- Auth callback handled at `/auth/callback` (Supabase convention)

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `LoginButton` | `src/components/auth/LoginButton.tsx` | "Logga in med Google" button |
| `UserMenu` | `src/components/auth/UserMenu.tsx` | Avatar + dropdown (profile, settings, logga ut) |
| `AuthProvider` | `src/components/auth/AuthProvider.tsx` | React context for auth state |

### Database

On first login, insert into `users`:
```sql
INSERT INTO users (id, email, name)
VALUES (auth.uid(), auth.email(), auth.raw_user_meta_data->>'full_name');
```

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Feature 2: CV Upload & AI Parsing

### User Flow

```
User clicks "Ladda upp CV" on dashboard
       |
       v
Option A: Upload PDF file (drag & drop or file picker)
Option B: Paste text into textarea
       |
       v
Loading state: "Analyserar ditt CV..." (10-15 seconds)
       |
       v
Results page shows extracted data:
  - Skills (checkboxes, user can add/remove)
  - Work experience (editable cards)
  - Education (editable cards)
  - Detected occupation: "Vi tror att du ar [Mjukvaruutvecklare]"
       |
       v
User reviews, edits, confirms
       |
       v
Profile saved to database
```

### Implementation

- **PDF parsing**: Extract text from PDF on the server (pdf-parse npm package)
- **AI parsing**: Send text to Claude API with structured prompt
- **Skill mapping**: Match extracted skill names against AF taxonomy (fuzzy match)
- **Occupation detection**: Match job titles against SSYK hierarchy

### AI Prompt Strategy

```
System: You are a Swedish CV parser. Extract structured data from the CV text below.
Return JSON with: skills (list of skill names), experiences (list with title, employer,
start_date, end_date, description), education (list with institution, degree, field,
start_date, end_date). All text should remain in its original language.

User: [CV text]
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CVUpload` | `src/components/profile/CVUpload.tsx` | File upload + text paste |
| `CVParseResults` | `src/components/profile/CVParseResults.tsx` | Show/edit parsed results |
| `SkillChips` | `src/components/profile/SkillChips.tsx` | Editable skill list with AF IDs |
| `ExperienceCard` | `src/components/profile/ExperienceCard.tsx` | Editable work experience |
| `EducationCard` | `src/components/profile/EducationCard.tsx` | Editable education entry |

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/parse-cv` | POST | Upload CV, return parsed JSON |
| `/api/skills/search` | GET | Search AF skills taxonomy (for autocomplete) |
| `/api/occupations/search` | GET | Search AF occupations (for autocomplete) |

---

## Feature 3: Skill Profile & Dashboard

### User Flow

```
User logs in --> lands on /dashboard
       |
       v
Dashboard shows 3 sections:

1. SKILL PROFILE (left/top)
   - Visual grid of skills grouped by category
   - Each skill shows: name, proficiency bar, source (CV/manual)
   - "Lagg till kompetens" button to add manually
   - Link to /profile for full edit

2. TOP JOB MATCHES (center)
   - 5-10 jobs with highest fit score
   - Each shows: title, employer, location, fit score %, deadline
   - Click --> /jobs/[id]
   - "Se alla jobb" link --> /jobs

3. RECENT APPLICATIONS (right/bottom)
   - Last 5 applications with status badges
   - Click --> /applications/[id]
   - "Se alla" link --> /applications
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `Dashboard` | `src/app/dashboard/page.tsx` | Main dashboard page |
| `SkillGrid` | `src/components/dashboard/SkillGrid.tsx` | Visual skill display |
| `TopMatches` | `src/components/dashboard/TopMatches.tsx` | Job match cards |
| `RecentApplications` | `src/components/dashboard/RecentApplications.tsx` | Application status list |
| `FitScoreBadge` | `src/components/shared/FitScoreBadge.tsx` | Colored score badge (red/yellow/green) |

---

## Feature 4: Job Discovery

### User Flow

```
User navigates to /jobs
       |
       v
Search bar + filters:
  - Text search (job title, employer, keyword)
  - Location (kommun dropdown, populated from AF municipality data)
  - Occupation category (SSYK level 2 groups)
  - Minimum fit score slider (0-100)
  - Sort by: fit score | date | deadline | salary
       |
       v
Results list:
  - Job cards showing: title, employer, location, fit score, posted date, deadline
  - Fit score color coded: 80+ green, 50-79 yellow, <50 red
  - Each card clickable --> /jobs/[id]
       |
       v
Job detail page (/jobs/[id]):
  - Full job description
  - FIT BREAKDOWN:
    - Overall score: 78%
    - Skills you have: Python, SQL, Git (green checkmarks)
    - Skills you're missing: Kubernetes, AWS (red X marks)
    - Substitutability: "Your role as Backend-utvecklare is 75% related"
  - ACTION BUTTONS:
    - "Skapa anpassat CV" --> /resumes/new?job=[id]
    - "Skriv personligt brev" --> generates cover letter
    - "Spara" --> saves to application pipeline as "saved"
```

### Implementation

- Jobs fetched from AF JobSearch API in real-time
- Results cached in Supabase (jobs table) with 24-hour TTL
- Fit score computed server-side by comparing user_skills vs job_skills
- Job skills extracted via AF JobAd Enrichments API (cached per job)

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/jobs` | GET | Search jobs (proxies AF JobSearch API + adds fit scores) |
| `/api/jobs/[id]` | GET | Single job detail with full fit breakdown |
| `/api/jobs/[id]/fit` | GET | Detailed skill comparison for a specific job |

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `JobSearch` | `src/app/jobs/page.tsx` | Search page with filters |
| `JobFilters` | `src/components/jobs/JobFilters.tsx` | Filter sidebar/bar |
| `JobCard` | `src/components/jobs/JobCard.tsx` | Job result card |
| `JobDetail` | `src/app/jobs/[id]/page.tsx` | Full job view |
| `FitBreakdown` | `src/components/jobs/FitBreakdown.tsx` | Visual skill comparison |
| `SkillMatch` | `src/components/jobs/SkillMatch.tsx` | Green check / red X skill list |
| `LocationPicker` | `src/components/shared/LocationPicker.tsx` | Kommun/lan selector using AF data |

---

## Feature 5: Resume Builder

### User Flow

```
User clicks "Skapa anpassat CV" (from job detail or /resumes)
       |
       v
Step 1: SELECT TARGET
  - Option A: "For this specific job" (pre-selected if coming from job detail)
  - Option B: "For this type of role" (select SSYK occupation)
  - Option C: "General resume" (base resume, all skills)
       |
       v
Step 2: AI GENERATES DRAFT
  Loading: "Anpassar ditt CV..."
  AI takes: base profile + target job/occupation
  AI outputs: restructured resume with relevant skills emphasized
       |
       v
Step 3: EDIT
  - Section-by-section editor:
    - Summary/profile statement (AI-written, editable)
    - Work experience (reordered by relevance, bullet points rewritten)
    - Skills (filtered to relevant ones, grouped)
    - Education
  - Live preview on the right side
       |
       v
Step 4: SAVE & EXPORT
  - Name the resume ("Backend Developer Resume")
  - Save to database
  - Export as PDF
```

### Implementation

- Resume content stored as structured JSON in `resumes.content_json`:
  ```json
  {
    "summary": "Erfaren backend-utvecklare med...",
    "experience": [
      {
        "title": "Senior Developer",
        "employer": "Spotify",
        "period": "2020-2024",
        "bullets": ["Led migration to...", "Built API for..."]
      }
    ],
    "skills": ["Python", "PostgreSQL", "Docker"],
    "education": [...]
  }
  ```
- PDF generation via server-side rendering (react-pdf or puppeteer)
- AI tailoring compares user profile skills vs target job skills, then rewrites

### AI Prompt Strategy

```
System: You are a professional Swedish resume writer. Given a user's full profile
and a target job description, create a tailored resume that emphasizes the skills
and experience most relevant to the target job. Rewrite bullet points to use
language that matches the job ad. Keep it honest - only include real experience.
Output as structured JSON.

User:
PROFILE: [user profile JSON]
TARGET JOB: [job description + required skills]
```

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/resumes` | GET | List user's resumes |
| `/api/resumes` | POST | Create new resume (AI-generated) |
| `/api/resumes/[id]` | PUT | Update resume content |
| `/api/resumes/[id]` | DELETE | Delete resume |
| `/api/resumes/[id]/pdf` | GET | Generate and return PDF |

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ResumeList` | `src/app/resumes/page.tsx` | List all resumes |
| `ResumeEditor` | `src/app/resumes/[id]/page.tsx` | Edit resume |
| `ResumeNew` | `src/app/resumes/new/page.tsx` | Create flow (target select + AI generation) |
| `ResumePreview` | `src/components/resumes/ResumePreview.tsx` | Live PDF-like preview |
| `SectionEditor` | `src/components/resumes/SectionEditor.tsx` | Edit individual resume section |
| `TargetSelector` | `src/components/resumes/TargetSelector.tsx` | Pick job or occupation for tailoring |

---

## Feature 6: AI Cover Letter

### User Flow

```
User is on job detail page (/jobs/[id])
       |
       v
Clicks "Skriv personligt brev"
       |
       v
Loading: "Skriver personligt brev..." (5-10 seconds)
       |
       v
Cover letter appears in editor:
  - References specific skills from job ad
  - Mentions user's relevant experience
  - Swedish by default
  - Professional but personal tone
       |
       v
User edits the text
       |
       v
Options:
  - "Regenerera" (try again with different angle)
  - "Spara" (save to application)
  - "Kopiera" (copy to clipboard)
```

### AI Prompt Strategy

```
System: Write a professional cover letter in Swedish for a job application.
The letter should be personal, specific to the job, and reference the
applicant's actual skills and experience. Do NOT be generic. Reference
specific requirements from the job ad and explain how the applicant meets them.
Keep it under 400 words.

User:
JOB: [job title, employer, description, required skills]
APPLICANT: [name, current role, relevant skills, relevant experience]
SKILL MATCH: [matched skills, missing skills]
```

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/cover-letter` | POST | Generate cover letter for job + user |

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CoverLetterEditor` | `src/components/applications/CoverLetterEditor.tsx` | Edit generated letter |
| `CoverLetterGenerator` | `src/components/applications/CoverLetterGenerator.tsx` | Generate button + loading |

---

## Feature 7: Application Tracker

### User Flow

```
User navigates to /applications
       |
       v
Kanban board with columns:
  [Sparade] --> [Ansokta] --> [Intervju] --> [Erbjudande]
                                              [Avslag]

Each card shows:
  - Job title + employer
  - Date applied (or date saved)
  - Fit score
  - Resume used
       |
       v
Drag card to change status
  OR click card --> /applications/[id]
       |
       v
Application detail page:
  - Job posting (linked)
  - Resume used (linked)
  - Cover letter (editable)
  - Status timeline
  - Notes (free text)
  - "Markera som [next status]" button
```

### Implementation

- Status changes update `applications.status` and `applications.updated_at`
- Drag-and-drop via a lightweight library (dnd-kit or similar)
- Stats computed from application data (response rate, avg time to response)

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/applications` | GET | List user's applications (filterable by status) |
| `/api/applications` | POST | Create application (save job) |
| `/api/applications/[id]` | PATCH | Update status, notes |
| `/api/applications/[id]` | DELETE | Remove application |

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ApplicationBoard` | `src/app/applications/page.tsx` | Kanban board |
| `ApplicationColumn` | `src/components/applications/ApplicationColumn.tsx` | Single status column |
| `ApplicationCard` | `src/components/applications/ApplicationCard.tsx` | Draggable card |
| `ApplicationDetail` | `src/app/applications/[id]/page.tsx` | Full detail view |
| `StatusTimeline` | `src/components/applications/StatusTimeline.tsx` | Visual status history |
| `ApplicationStats` | `src/components/applications/ApplicationStats.tsx` | Summary stats |

---

## Shared Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `Nav` | `src/components/layout/Nav.tsx` | Top navigation bar |
| `Sidebar` | `src/components/layout/Sidebar.tsx` | Side navigation (dashboard, jobs, resumes, applications) |
| `FitScoreBadge` | `src/components/shared/FitScoreBadge.tsx` | Colored fit score (0-100) |
| `LocationPicker` | `src/components/shared/LocationPicker.tsx` | Kommun/lan dropdown |
| `OccupationPicker` | `src/components/shared/OccupationPicker.tsx` | Search/select AF occupation |
| `SkillTag` | `src/components/shared/SkillTag.tsx` | Skill badge with optional remove |
| `LoadingState` | `src/components/shared/LoadingState.tsx` | AI loading spinner with message |
| `EmptyState` | `src/components/shared/EmptyState.tsx` | "No results" illustration + CTA |

---

## File Structure

```
talentflow/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (nav, auth provider)
│   │   ├── page.tsx                      # Landing page (unauthenticated)
│   │   ├── login/page.tsx                # Login page
│   │   ├── auth/callback/route.ts        # OAuth callback handler
│   │   ├── dashboard/page.tsx            # Main dashboard
│   │   ├── profile/
│   │   │   ├── page.tsx                  # View/edit profile
│   │   │   └── upload/page.tsx           # CV upload
│   │   ├── jobs/
│   │   │   ├── page.tsx                  # Job search + results
│   │   │   └── [id]/page.tsx             # Job detail
│   │   ├── resumes/
│   │   │   ├── page.tsx                  # Resume list
│   │   │   ├── new/page.tsx              # Create new resume
│   │   │   └── [id]/page.tsx             # Edit resume
│   │   ├── applications/
│   │   │   ├── page.tsx                  # Kanban board
│   │   │   └── [id]/page.tsx             # Application detail
│   │   ├── settings/page.tsx             # Account settings
│   │   └── api/
│   │       ├── parse-cv/route.ts
│   │       ├── jobs/route.ts
│   │       ├── jobs/[id]/route.ts
│   │       ├── jobs/[id]/fit/route.ts
│   │       ├── resumes/route.ts
│   │       ├── resumes/[id]/route.ts
│   │       ├── resumes/[id]/pdf/route.ts
│   │       ├── cover-letter/route.ts
│   │       ├── applications/route.ts
│   │       ├── applications/[id]/route.ts
│   │       ├── skills/search/route.ts
│   │       └── occupations/search/route.ts
│   ├── components/
│   │   ├── auth/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── jobs/
│   │   ├── resumes/
│   │   ├── applications/
│   │   └── shared/
│   ├── lib/
│   │   ├── supabase.ts                   # Client-side Supabase
│   │   ├── supabase-server.ts            # Server-side Supabase
│   │   ├── claude.ts                     # Anthropic Claude client
│   │   ├── af-api.ts                     # Arbetsformedlingen API wrapper
│   │   ├── fit-score.ts                  # Fit score calculation logic
│   │   ├── types.ts                      # TypeScript types
│   │   └── utils.ts                      # Shared utilities
│   └── middleware.ts                      # Auth middleware
├── public/
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql        # From docs/DATABASE_SCHEMA.sql
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── PRD.md
├── FEATURES.md
└── .env.local.example
```

---

## Implementation Order

Build in this order to always have something working:

1. **Auth + Layout** — Login, nav, protected routes. User can sign in.
2. **CV Upload + Profile** — Upload and parse CV. User has a skill profile.
3. **Job Search** — Browse jobs with fit scores. User finds relevant jobs.
4. **Resume Builder** — Create tailored resumes. User prepares to apply.
5. **Cover Letter** — Generate per job. User has a complete application.
6. **Application Tracker** — Track pipeline. User manages everything in one place.

Each step delivers value on its own. A user can benefit from just steps 1-3.
