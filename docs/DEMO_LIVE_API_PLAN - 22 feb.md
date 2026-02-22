# Plan: Demo med Live AF API

**Senast uppdaterad**: 2026-02-22

---

## Problem

Nuvarande demo (`demo.html`) kör på hårdkodad/simulerad data. Det signalerar till investerare och kommuner att produkten inte är riktig. **Demo måste byggas på live data från Arbetsförmedlingens API:er.**

---

## Mål

En demo som:
1. Låter användaren skriva in sitt yrke (eller ladda upp CV)
2. Slår upp yrket i AF:s Taxonomy API (live)
3. Hämtar substitutability-data (karriärövergångar) från lokal data/API
4. Visar matchade karriärvägar med riktiga procent
5. Hämtar aktuella jobbannonser från AF:s JobSearch API (live)
6. Beräknar composite score med riktiga vikter

---

## Teknisk plan

### Steg 1: Lokal data-endoint (redan tillgänglig)

Vi har redan nedladdad data i `/data/processed/`:
- `occupations.json` — 430+ yrken med SSYK-koder
- `substitutability.json` — 51 000+ karriärövergångar
- `skills.json` — 8 000+ kompetenser
- `search-index.json` — Sökindex

**Dessa kan serveras direkt som statiska JSON-filer** — inget backend behövs för grundfunktionen.

### Steg 2: Yrkes-sök (autocomplete)

```javascript
// Läs in search-index.json
// Användaren börjar skriva "butiks..."
// Filtrera och visa matchande yrken med SSYK-koder
```

### Steg 3: Karriärövergångar (substitutability)

```javascript
// Användaren väljer "Butikschef" (SSYK 5221)
// Slå upp i substitutability.json
// Filtrera relationer med source = SSYK_5221
// Ranka efter substitutability_level
// Visa top 10 karriärvägar med matchprocent
```

### Steg 4: Live jobbdata (AF JobSearch API)

```javascript
// För varje matchat yrke, hämta antal lediga jobb
const response = await fetch(
  `https://jobsearch.api.jobtechdev.se/search?occupation-name=${occupation}&limit=10`
);
// Visa: "Verksamhetsledare — 85% match — 47 lediga jobb just nu"
```

**Obs**: AF:s JobSearch API kräver ingen API-nyckel för grundläggande sökning.

### Steg 5: Scoring med riktiga vikter

```javascript
function calculateScore(substitutability, skillMatch, demand, marketSituation, salaryDelta) {
  return (
    0.30 * substitutability +
    0.30 * skillMatch +
    0.20 * demand +
    0.10 * marketSituation +
    0.10 * normalize(salaryDelta)
  );
}
```

### Steg 6 (framtida): CV-parsing med Claude

- Användaren laddar upp CV
- Skickas till Claude API för skill-extraktion
- Skills mappas till AF:s concept_ids
- Personaliserad karriäranalys

**Kräver backend** (API-nyckel kan inte exponeras i frontend). Implementeras i TalentFlow-appen (Next.js), inte i demo.html.

---

## Implementation — Fas 1 (snabb fix)

### Ändra `demo.html` till att använda riktiga data

1. Ladda `occupations.json` och `substitutability.json` som statiska filer
2. Bygg autocomplete-sök mot riktiga yrken
3. Visa riktiga substitutability-matchningar (inte hårdkodade)
4. Lägg till "Data: Arbetsförmedlingens öppna API:er" som badge

### Uppskattad arbetsinsats: 1-2 dagar

---

## Implementation — Fas 2 (live API)

### Integrera AF:s JobSearch API

1. Hämta lediga jobb i realtid för matchade yrken
2. Visa antal lediga jobb per yrke och region
3. Lägg till regionfilter (län/kommun)

### Uppskattad arbetsinsats: 1-2 dagar

---

## Implementation — Fas 3 (TalentFlow MVP)

### Full integration i TalentFlow-appen

1. CV-uppladdning + Claude-parsing (kräver backend)
2. Personaliserad skill gap-analys
3. Utbildningsrekommendationer (JobEd Connect)
4. Spara profil och jämför över tid

### Uppskattad arbetsinsats: 2-4 veckor

---

## Prioritet

| Fas | Vad | Tid | Värde |
|-----|-----|-----|-------|
| **Fas 1** | Statisk data i demo.html | 1-2 dagar | **Kritiskt** — ta bort "simulerad data"-intrycket |
| **Fas 2** | Live JobSearch API | 1-2 dagar | Visar att vi faktiskt kopplar mot AF |
| **Fas 3** | Full TalentFlow MVP | 2-4 veckor | Produktlansering |
