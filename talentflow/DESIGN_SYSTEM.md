# TalentFlow — Design System

The visual identity, component library, and interaction patterns for TalentFlow.

---

## 1. Brand Personality

TalentFlow is **competent, calm, and encouraging**. The user is stressed about finding work. The app should feel like a capable friend who has their back — not a flashy startup, not a government form.

**Voice**: Direct, warm, non-bureaucratic Swedish. No corporate jargon. Say "du" not "ni".
**Tone**: Confident but never pushy. Celebrate small wins (CV uploaded! First application!). Never guilt-trip inactivity.

---

## 2. Color Palette

### Primary

| Name | Hex | Usage |
|------|-----|-------|
| Ink | `#1a1a2e` | Primary text, headings |
| Slate | `#64748b` | Secondary text, labels, placeholders |
| Cloud | `#f8fafc` | Page backgrounds |
| White | `#ffffff` | Card backgrounds, inputs |

### Accent

| Name | Hex | Usage |
|------|-----|-------|
| Ocean | `#2563eb` | Primary buttons, links, active nav items |
| Ocean Light | `#dbeafe` | Hover backgrounds, selected chips, active filters |
| Ocean Dark | `#1d4ed8` | Button hover states |

### Semantic

| Name | Hex | Usage |
|------|-----|-------|
| Mint / Success | `#059669` | High fit scores (80+), success messages, matched skills |
| Mint Light | `#d1fae5` | Success backgrounds |
| Amber / Warning | `#d97706` | Medium fit scores (50-79), pending states, missing optional skills |
| Amber Light | `#fef3c7` | Warning backgrounds |
| Rose / Danger | `#dc2626` | Low fit scores (<50), errors, missing required skills, destructive actions |
| Rose Light | `#fee2e2` | Error backgrounds |

### Status Colors (Application Pipeline)

| Status | Color | Hex |
|--------|-------|-----|
| Sparad (Saved) | Gray | `#e2e8f0` |
| Ansökt (Applied) | Blue | `#dbeafe` |
| Intervju (Interview) | Amber | `#fef3c7` |
| Erbjudande (Offer) | Mint | `#d1fae5` |
| Avslag (Rejected) | Rose | `#fee2e2` |
| Dragen (Withdrawn) | Slate | `#f1f5f9` |

---

## 3. Typography

Using the system font stack — no custom fonts. Fast loading, familiar to Swedish users.

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Scale

| Name | Size | Weight | Usage |
|------|------|--------|-------|
| Display | 36px / 2.25rem | 700 | Landing page hero headline |
| H1 | 24px / 1.5rem | 700 | Page titles ("Hitta jobb", "Dina CV:n") |
| H2 | 20px / 1.25rem | 600 | Card titles, section headers |
| H3 | 16px / 1rem | 600 | Sub-section headers |
| Body | 14px / 0.875rem | 400 | Default text, descriptions |
| Small | 13px / 0.8125rem | 400 | Labels, secondary info, dates |
| Tiny | 12px / 0.75rem | 500 | Badges, chips, status labels |

All text is `#1a1a2e` (Ink) by default. Secondary text is `#64748b` (Slate).

---

## 4. Spacing & Layout

### Grid

- Max content width: **1152px** (`max-w-6xl`)
- Side padding: **16px** mobile, **24px** tablet+
- Page top padding: **32px**
- Section gap: **24px**
- Card internal padding: **24px**
- Between cards in a grid: **16px**

### App Shell

```
┌──────────────────────────────────────────────────┐
│  [Logo]  Översikt  Jobb  CV:n  Ansökningar  [User]  │  <- Top nav (56px height)
├──────────────────────────────────────────────────┤
│                                                      │
│                 Page Content                         │  <- Cloud background
│                 (max-w-6xl mx-auto)                  │
│                                                      │
└──────────────────────────────────────────────────┘
```

No sidebar. Top navigation only. Keeps it simple and gives full width to content. On mobile, nav items go into a hamburger menu.

---

## 5. Component Catalog

### 5.1 Buttons

**Primary** — For the main action on a page. One per visible section max.
```
bg-ocean text-white rounded-lg px-5 py-2.5 font-medium
Hover: bg-ocean-dark
Disabled: opacity-50 cursor-not-allowed
```

**Secondary** — For supporting actions.
```
border border-gray-300 text-ink rounded-lg px-5 py-2.5 font-medium
Hover: bg-gray-50
```

**Ghost** — For low-emphasis actions (cancel, back).
```
text-slate rounded-lg px-5 py-2.5 font-medium
Hover: bg-gray-100
```

**Danger** — For destructive actions (delete resume, withdraw application).
```
bg-rose-50 text-rose-700 rounded-lg px-5 py-2.5 font-medium
Hover: bg-rose-100
```

### 5.2 Cards

Every major content block is a card:

```
bg-white border border-gray-200 rounded-xl p-6
Shadow: none by default, shadow-sm on hover (for clickable cards)
```

**Clickable cards** (job results, resume list items) add:
```
cursor-pointer transition hover:shadow-sm hover:border-gray-300
```

### 5.3 Fit Score Badge

The most distinctive UI element. A rounded pill showing 0-100 match percentage.

```
Sizes:
  - Large: 48x48 circle with number inside (job detail page)
  - Medium: inline pill "78%" (job cards, dashboard)
  - Small: compact pill (application cards)

Colors:
  80-100: bg-mint-light text-mint border-mint/20
  50-79:  bg-amber-light text-amber border-amber/20
  0-49:   bg-rose-light text-rose border-rose/20
```

### 5.4 Skill Tag

A pill-shaped chip representing a single skill:

```
Default:   bg-gray-100 text-ink text-tiny rounded-full px-3 py-1
Matched:   bg-mint-light text-mint-700 (when showing skills you have)
Missing:   bg-rose-light text-rose-700 (when showing skills you lack)
Removable: + X button on hover (for profile editing)
Addable:   + icon, dashed border (for "add skill" button)
```

### 5.5 Status Badge

For application statuses in the pipeline:

```
rounded-full px-2.5 py-0.5 text-tiny font-medium
Color: matches Status Colors table above
```

### 5.6 Form Inputs

```
Input:    w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
          Focus: ring-2 ring-ocean/20 border-ocean
          Error: border-rose ring-2 ring-rose/20

Select:   Same as input + dropdown chevron

Textarea: Same as input, min-height 120px, resize-y

Checkbox: w-4 h-4 rounded border-gray-300 text-ocean focus:ring-ocean
```

### 5.7 Loading States

**AI Loading** (for operations that take 5-15 seconds):
```
Full-width card with centered:
  - Animated dots or pulse animation
  - Message in slate text: "Analyserar ditt CV..." / "Skapar personligt brev..."
  - Subtle progress indicator (not a real progress bar — AI timing is unpredictable)
```

**Page Loading** (for data fetching, < 2 seconds):
```
Skeleton placeholders matching the shape of the content that will appear.
Cards show gray animated rectangles where text/badges will be.
```

**Button Loading**:
```
Button text replaced with spinner + "Laddar..." (or action-specific: "Sparar...")
Button stays same size to prevent layout shift.
```

### 5.8 Empty States

Every list/grid page has an empty state with:
1. A short, friendly heading ("Inga jobb hittade")
2. A brief explanation ("Prova att bredda din sökning eller ändra filter")
3. A CTA button if there's a logical next step

No illustrations for MVP. Just clean typography.

### 5.9 Error States

**Inline errors** (form validation):
```
text-rose text-small mt-1 under the field
```

**Toast notifications** (API errors, success confirmations):
```
Fixed bottom-right, auto-dismiss after 5 seconds.
Success: mint-light border-l-4 border-mint
Error: rose-light border-l-4 border-rose
Info: ocean-light border-l-4 border-ocean
```

**Full-page error** (only for catastrophic failures):
```
Centered card: "Något gick fel. Försök igen eller kontakta support."
+ "Försök igen" button
```

---

## 6. Page-by-Page Visual Spec

### 6.1 Landing Page (`/`)

```
┌─────────────────────────────────────────┐
│                                         │
│           [NordiqFlow logo]             │
│                                         │
│         TalentFlow                      │  <- Display, bold
│   Din AI-drivna jobbassistent           │  <- H2, slate
│                                         │
│   [ Kom igång — det är gratis ]         │  <- Primary button, large
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Upload  │ │ Match   │ │ Apply   │  │  <- 3 value prop cards
│  │ your CV │ │ to jobs │ │ smarter │  │
│  │         │ │         │ │         │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│                                         │
│  "Byggt på Arbetsförmedlingens          │  <- Trust signal
│   öppna data med 8 000+ kompetenser"   │
│                                         │
└─────────────────────────────────────────┘
```

Minimal. No animated gradients. No stock photos. Just confidence.

If logged in, redirect straight to `/dashboard`.

### 6.2 Login Page (`/login`)

```
┌─────────────────────────────────────────┐
│                                         │
│            TalentFlow                   │
│      Logga in för att börja             │
│                                         │
│   [ G  Logga in med Google ]            │  <- White card button with Google logo
│                                         │
│   Genom att logga in godkänner du       │
│   våra användarvillkor.                 │
│                                         │
└─────────────────────────────────────────┘
```

### 6.3 Onboarding (`/welcome`) — NEW PAGE

First-time users don't go straight to a blank dashboard. They see a 3-step wizard.

```
Step 1 of 3: Berätta om dig

┌─────────────────────────────────────────┐
│                                         │
│   Vad jobbar du med idag?               │
│   [ Sök yrke...     ▼ ]                │  <- Occupation autocomplete (AF taxonomy)
│                                         │
│   Var bor du?                           │
│   [ Välj kommun...  ▼ ]                │  <- Municipality selector
│                                         │
│   Hur många års erfarenhet har du?      │
│   [ 0-2 ] [ 3-5 ] [ 6-10 ] [ 10+ ]   │  <- Radio pills
│                                         │
│                          [ Nästa → ]    │
└─────────────────────────────────────────┘

Step 2 of 3: Ladda upp ditt CV

┌─────────────────────────────────────────┐
│                                         │
│   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐      │
│   │                               │      │
│   │   Dra din PDF hit             │      │  <- Drag-and-drop zone
│   │   eller klicka för att välja  │      │
│   │                               │      │
│   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘      │
│                                         │
│           ── eller ──                   │
│                                         │
│   ┌─────────────────────────────┐      │
│   │ Klistra in text här...      │      │  <- Textarea
│   │                             │      │
│   └─────────────────────────────┘      │
│                                         │
│   [ ← Tillbaka ]       [ Analysera → ] │
│                                         │
│   Hoppa över detta steg               │  <- Ghost link
│                                         │
└─────────────────────────────────────────┘

Step 3 of 3: Granska din profil

┌─────────────────────────────────────────┐
│                                         │
│   ✓ Vi hittade 12 kompetenser           │  <- Success banner
│                                         │
│   Kompetenser                           │
│   [Python] [SQL] [Git] [Docker] [+]    │  <- Editable skill chips
│                                         │
│   Erfarenhet                            │
│   ┌─────────────────────────────┐      │
│   │ Senior Developer — Spotify  │ [✎] │
│   │ 2020 – nu                   │      │
│   ├─────────────────────────────┤      │
│   │ Developer — Klarna          │ [✎] │
│   │ 2017 – 2020                 │      │
│   └─────────────────────────────┘      │
│                                         │
│   Utbildning                            │
│   ┌─────────────────────────────┐      │
│   │ KTH — Datateknik, Civilingenjör │  │
│   │ 2012 – 2017                 │      │
│   └─────────────────────────────┘      │
│                                         │
│   [ ← Tillbaka ]    [ Klar — visa jobb → ] │
│                                         │
└─────────────────────────────────────────┘
```

### 6.4 Dashboard (`/dashboard`)

```
┌──────────────────────────────────────────────────┐
│  [Logo]  Översikt  Jobb  CV:n  Ansökningar  [LP]│
├──────────────────────────────────────────────────┤
│                                                    │
│  Hej, Linnea                                      │  <- H1
│  Du matchar 47 jobb just nu                       │  <- Subtitle, slate
│                                                    │
│  ┌───────────────────────── ┐  ┌────────────────┐│
│  │ Kompetenser (18)     [→] │  │ Snabbstatistik ││
│  │                          │  │                ││
│  │ [Python] [SQL] [Docker]  │  │ 47 matchade    ││
│  │ [Git] [React] [Node.js] │  │ 12 ansökningar ││
│  │ [Ledarskap] [Scrum] ... │  │  3 intervjuer  ││
│  │                          │  │  1 erbjudande  ││
│  │ Se alla →                │  │                ││
│  └──────────────────────────┘  └────────────────┘│
│                                                    │
│  Bästa jobben för dig                    Se alla →│  <- H2
│  ┌──────────────┐ ┌──────────────┐ ┌────────────┐│
│  │ 92%          │ │ 87%          │ │ 81%        ││
│  │ Fullstack    │ │ Backend Dev  │ │ Tech Lead  ││
│  │ Spotify      │ │ Klarna       │ │ Volvo      ││
│  │ Stockholm    │ │ Stockholm    │ │ Göteborg   ││
│  │ Sista dag: 3 mar              │ │ 10 mar     ││
│  └──────────────┘ └──────────────┘ └────────────┘│
│                                                    │
│  Senaste ansökningar                     Se alla →│
│  ┌────────────────────────────────────────────────┐│
│  │ Fullstack Dev — Spotify  │ Ansökt │ 14 feb    ││
│  │ Backend Dev — Klarna     │ Sparad │ 12 feb    ││
│  └────────────────────────────────────────────────┘│
│                                                    │
└──────────────────────────────────────────────────┘
```

### 6.5 Job Search (`/jobs`)

```
┌──────────────────────────────────────────────────┐
│  Nav                                              │
├──────────────────────────────────────────────────┤
│                                                    │
│  Hitta jobb                                       │  <- H1
│                                                    │
│  ┌────────────────────────────────────────────────┐│
│  │ [🔍 Sök jobb, företag eller kompetens...    ] ││  <- Search bar
│  │                                                ││
│  │ Kommun: [Alla ▼]  Yrke: [Alla ▼]             ││  <- Filters row
│  │ Matchning: [50+% ▼]  Sortera: [Matchning ▼]  ││
│  └────────────────────────────────────────────────┘│
│                                                    │
│  234 jobb hittade                                 │  <- Result count
│                                                    │
│  ┌────────────────────────────────────────────────┐│
│  │ [92%] Fullstack-utvecklare                     ││  <- Job card
│  │       Spotify · Stockholm                       ││
│  │       "Vi söker en erfaren utvecklare..."       ││
│  │       Sista ansökningsdag: 3 mars 2026          ││
│  │                                      [Spara ♡] ││
│  ├────────────────────────────────────────────────┤│
│  │ [87%] Backend-utvecklare                       ││
│  │       Klarna · Stockholm                        ││
│  │       ...                                       ││
│  ├────────────────────────────────────────────────┤│
│  │ [65%] DevOps Engineer                          ││
│  │       Ericsson · Kista                          ││
│  │       ...                                       ││
│  └────────────────────────────────────────────────┘│
│                                                    │
│           [ ← Föregående ]  1 2 3  [ Nästa → ]   │  <- Pagination
│                                                    │
└──────────────────────────────────────────────────┘
```

### 6.6 Job Detail (`/jobs/[id]`)

```
┌──────────────────────────────────────────────────┐
│  Nav                                              │
├──────────────────────────────────────────────────┤
│  ← Tillbaka till sökresultat                      │
│                                                    │
│  ┌──────────────────────────┐  ┌────────────────┐│
│  │                          │  │                ││
│  │  Fullstack-utvecklare    │  │  Din matchning ││
│  │  Spotify                 │  │                ││
│  │  Stockholm               │  │    [ 92% ]    ││  <- Large circle
│  │  Heltid, tillsvidare     │  │                ││
│  │                          │  │  Du har 11/12  ││
│  │  Sista dag: 3 mars       │  │  kompetenser   ││
│  │                          │  │                ││
│  │  [ Skapa CV ]            │  │ ✓ Python      ││
│  │  [ Skriv brev ]          │  │ ✓ React       ││
│  │  [ Spara ♡ ]             │  │ ✓ PostgreSQL  ││
│  │                          │  │ ✓ Docker      ││
│  │                          │  │ ✓ Git         ││
│  │                          │  │ ...           ││
│  │                          │  │ ✗ Kubernetes  ││  <- Red, missing
│  │                          │  │               ││
│  │                          │  │ Karriärväg:   ││
│  │                          │  │ Din roll som   ││
│  │                          │  │ Backend-utv.   ││
│  │                          │  │ är 75% lik    ││
│  └──────────────────────────┘  └────────────────┘│
│                                                    │
│  Om tjänsten                                      │  <- H2
│  ┌────────────────────────────────────────────────┐│
│  │ Full job description text from AF...            ││
│  │ (rendered markdown, preserving formatting)      ││
│  └────────────────────────────────────────────────┘│
│                                                    │
└──────────────────────────────────────────────────┘
```

### 6.7 CV / Resume Management (`/resumes`)

```
┌──────────────────────────────────────────────────┐
│  Nav                                              │
├──────────────────────────────────────────────────┤
│                                                    │
│  Dina CV:n                  [ + Skapa nytt CV ]   │
│                                                    │
│  ┌────────────────────────────────────────────────┐│
│  │ ☆ Mitt huvud-CV                       Bas-CV  ││  <- Base resume, star icon
│  │    Senast ändrat: 14 feb 2026                  ││
│  │    18 kompetenser · 3 erfarenheter             ││
│  │                         [Redigera] [Ladda ner] ││
│  ├────────────────────────────────────────────────┤│
│  │    Backend-utvecklare CV                       ││  <- Tailored resume
│  │    Anpassat för: Backend-utvecklare (SSYK 2512)││
│  │    Senast ändrat: 14 feb 2026                  ││
│  │    Använt i 3 ansökningar                      ││
│  │                         [Redigera] [Ladda ner] ││
│  ├────────────────────────────────────────────────┤│
│  │    Projektledare CV                            ││
│  │    Anpassat för: IT-projektledare (SSYK 1236)  ││
│  │    Senast ändrat: 10 feb 2026                  ││
│  │    Använt i 1 ansökning                        ││
│  │                         [Redigera] [Ladda ner] ││
│  └────────────────────────────────────────────────┘│
│                                                    │
│  Uppladdade original-CV:n                         │  <- H2
│  ┌────────────────────────────────────────────────┐│
│  │ 📄 Linnea_Moritz_CV_2026.pdf   14 feb  [Visa] ││
│  │ 📄 CV_english_version.pdf      3 jan   [Visa] ││
│  │                                                ││
│  │          [ + Ladda upp nytt CV ]               ││
│  └────────────────────────────────────────────────┘│
│                                                    │
└──────────────────────────────────────────────────┘
```

Key insight: **Uploaded CVs and generated resumes are separate things.**

- **Uploaded CVs** = the original PDFs the user brings. Stored in Supabase Storage. Used as source material.
- **Generated Resumes** = structured documents TalentFlow creates from parsed data. Stored as JSON. Tailored per job type.

Users can upload multiple CVs (e.g., one in Swedish, one in English, one from 2024 and one updated in 2026). Each upload triggers a new parse. The user picks which parsed data feeds their profile.

### 6.8 Resume Editor (`/resumes/[id]`)

```
┌──────────────────────────────────────────────────┐
│  Nav                                              │
├──────────────────────────────────────────────────┤
│  ← Tillbaka till CV:n                             │
│                                                    │
│  Backend-utvecklare CV         [Ladda ner PDF]    │
│  Anpassat för: Backend-utvecklare                 │
│                                                    │
│  ┌─────────────────────── ┐ ┌────────────────────┐│
│  │ REDIGERA               │ │ FÖRHANDSGRANSKA    ││
│  │                        │ │                    ││
│  │ Sammanfattning     [✎]│ │ ┌────────────────┐ ││
│  │ "Erfaren backend-  "  │ │ │ LINNEA MORITZ  │ ││
│  │ "utvecklare med 7  "  │ │ │                │ ││
│  │ "års erfarenhet..."   │ │ │ Erfaren backend│ ││
│  │                        │ │ │ utvecklare med │ ││
│  │ Erfarenhet         [✎]│ │ │ 7 års erfaren- │ ││
│  │ ┌──────────────────┐  │ │ │ het...         │ ││
│  │ │ Senior Developer │  │ │ │                │ ││
│  │ │ Spotify, 2020–nu │  │ │ │ ERFARENHET     │ ││
│  │ │ • Led migration  │  │ │ │ ────────────── │ ││
│  │ │ • Built API...   │  │ │ │ Senior Dev     │ ││
│  │ └──────────────────┘  │ │ │ Spotify        │ ││
│  │                        │ │ │ 2020 – nu      │ ││
│  │ Kompetenser        [✎]│ │ │ • Led migration│ ││
│  │ [Python] [PostgreSQL] │ │ │ • Built API    │ ││
│  │ [Docker] [Git]        │ │ │                │ ││
│  │                        │ │ └────────────────┘ ││
│  │ Utbildning         [✎]│ │                    ││
│  │ KTH, Datateknik      │ │                    ││
│  │ 2012–2017             │ │                    ││
│  │                        │ │                    ││
│  │ [Spara ändringar]     │ │                    ││
│  └────────────────────────┘ └────────────────────┘│
│                                                    │
└──────────────────────────────────────────────────┘
```

Split-pane: editor on left, live PDF-like preview on right.

### 6.9 Application Tracker (`/applications`)

```
┌──────────────────────────────────────────────────┐
│  Nav                                              │
├──────────────────────────────────────────────────┤
│                                                    │
│  Ansökningar                                      │
│  12 totalt · 4 aktiva · 25% svarsfrekvens        │  <- Stats bar
│                                                    │
│  [Visa som: Lista | Kanban]                       │  <- View toggle
│                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐│
│  │ SPARADE  │ │ ANSÖKTA  │ │ INTERVJU │ │ KLARA││
│  │ (3)      │ │ (5)      │ │ (3)      │ │ (1)  ││
│  │          │ │          │ │          │ │      ││
│  │┌────────┐│ │┌────────┐│ │┌────────┐│ │┌────┐││
│  ││ 92%    ││ ││ 87%    ││ ││ 78%    ││ ││ 95%│││
│  ││Fullst. ││ ││Backend ││ ││DevOps  ││ ││Lead│││
│  ││Spotify ││ ││Klarna  ││ ││Ericsson││ ││IKEA│││
│  ││15 feb  ││ ││12 feb  ││ ││8 feb   ││ ││1feb│││
│  │└────────┘│ │└────────┘│ │└────────┘│ │└────┘││
│  │┌────────┐│ │┌────────┐│ │┌────────┐│ │      ││
│  ││ 65%    ││ ││ 72%    ││ ││ 81%    ││ │      ││
│  ││DevOps  ││ ││PM      ││ ││Full    ││ │      ││
│  ││Volvo   ││ ││SEB     ││ ││H&M    ││ │      ││
│  │└────────┘│ │└────────┘│ │└────────┘│ │      ││
│  │          │ │          │ │          │ │      ││
│  └──────────┘ └──────────┘ └──────────┘ └──────┘│
│                                                    │
│  Avslag (2)                              [Visa ▼]│  <- Collapsed section
│                                                    │
└──────────────────────────────────────────────────┘
```

The "Klara" (Done) column merges Offer + Withdrawn (both are terminal states). Rejected gets its own collapsed section at the bottom — don't rub it in.

List view is also available as an alternative to Kanban (table with columns: Job, Company, Status, Fit, Date, Resume).

---

## 7. Responsive Behavior

### Breakpoints

| Name | Width | Layout |
|------|-------|--------|
| Mobile | < 640px | Single column, hamburger nav |
| Tablet | 640px – 1024px | Two-column grids become single, filters collapse |
| Desktop | > 1024px | Full layout as designed above |

### Mobile-Specific Adjustments

- Nav collapses to: [Logo] ... [☰ Menu]
- Job cards stack vertically, full width
- Resume editor shows tabs (Edit / Preview) instead of side-by-side
- Kanban board scrolls horizontally OR switches to list view by default
- Fit score badge stays visible (key feature, never hide it)

---

## 8. Animations & Transitions

Keep it minimal. No gratuitous motion.

| What | Animation | Duration |
|------|-----------|----------|
| Page transitions | None (instant) | 0ms |
| Card hover | Border color + shadow | 150ms ease |
| Button hover | Background color | 150ms ease |
| Toast appear | Slide in from right | 200ms ease-out |
| Toast dismiss | Fade out | 150ms ease-in |
| Skeleton loading | Pulse (opacity 0.5 → 1) | 1.5s infinite |
| Kanban drag | Card lifts (shadow + scale 1.02) | 150ms |
| Dropdown open | Fade + slide down 4px | 150ms ease-out |
| Modal open | Fade in + scale from 0.95 | 200ms ease-out |

No page transition animations. No parallax. No particle effects.

---

## 9. Accessibility

- All interactive elements keyboard-navigable
- Focus rings visible (ring-2 ring-ocean/50)
- Color is never the only indicator (fit scores also show numbers, not just color)
- Contrast ratios meet WCAG AA (4.5:1 for text, 3:1 for large text)
- Form labels always associated with inputs
- Loading states announced to screen readers (aria-live="polite")
- Swedish language set on html tag (lang="sv")
