# NordiqFlow — Konkurrensanalys

**Senast uppdaterad**: 2026-02-22

---

## Kärninsikt: Ingen har incitament att hjälpa den som söker jobb

Alla befintliga aktörer tjänar pengar på **andra** sidan av marknaden:
- LinkedIn: Rekryterare betalar
- Jobboards: Annonsörer betalar
- AF: Myndighet med egna byråkratiska incitament

NordiqFlow är den enda aktören vars affärsmodell direkt belönar bättre matchning för individen.

---

## Konkurrenter

### 1. Platsbanken (Arbetsförmedlingen)

| Aspekt | Platsbanken | NordiqFlow |
|--------|------------|-----------|
| Matchning | Nyckelord/jobbtitel | Kompetens-baserad (concept_ids) |
| Karriärbyte-stöd | Nej | Ja — 51 000+ övergångar |
| Skill gap-analys | Nej | Ja |
| Utbildningsrekommendationer | Nej | Ja (JobEd Connect) |
| Löneprognos | Nej | Ja |
| Pris | Gratis | Gratis |
| Data | Har all data | Bygger ovanpå samma data |

**Varför de inte bygger detta**: Myndighet med 10 000 anställda. Byråkratiska incitament att inte ändra sin verksamhet. Politisk styrning, inte produktinnovation.

### 2. LinkedIn Jobs

| Aspekt | LinkedIn | NordiqFlow |
|--------|---------|-----------|
| Matchning | Egen taxonomi + ML | AF:s officiella taxonomi |
| Karriärbyte-stöd | Begränsat ("Career Explorer") | Kärnfunktion |
| Substitutability-data | Nej (gissar) | Ja (AF:s officiella data) |
| Fokus | Rekryterare (betalar) | Arbetssökande (användare) |
| Kommunal integration | Nej | Ja (CityIQ) |
| Svensk arbetsmarknad | Generell, global | Specialiserad, svensk |

**Varför de inte gör detta**: LinkedIn tjänar pengar på rekryterare som betalar för Premium Recruiter. Att visa att kandidater kan byta bransch minskar rekryterarens beroende av LinkedIn. Det är en **intressekonflikt**.

### 3. Jobtech (Randstad/Monster)

| Aspekt | Jobtech/Monster | NordiqFlow |
|--------|----------------|-----------|
| Affärsmodell | Annonsintäkter | Kommunala licenser |
| Matchning | Nyckelord | Kompetens-baserad |
| Karriärbyte | Nej | Ja |
| Värde för kommun | Inget | CityIQ dashboard |

**Varför de inte gör detta**: Jobboards tjänar på annonsvolymer. Bättre matchning = färre sökningar = lägre annonsintäkter. Samma intressekonflikt som LinkedIn.

### 4. Karriärstart.se

| Aspekt | Karriärstart | NordiqFlow |
|--------|-------------|-----------|
| Data | Egen, begränsad | AF:s 60+ datasets |
| Karriärbyte | Generella tips | Specifika matchprocent |
| AI | Nej | Ja (Claude CV-parsing) |
| B2G | Nej | Ja (CityIQ) |

### 5. Rusta och Matcha (RoM) — Privata aktörer

IFAU Rapport 2024:17 visar att RoM-leverantörer:
- Kostar **46-70% mer** än AF:s basservice
- Ger **0% mätbar förbättring** i jobbchans
- Provider-kvalitet varierar från 2% till 56% i resultat

NordiqFlow kan potentiellt ersätta eller komplettera RoM med:
- Datadrivet (inte manuell handledning)
- Skalbart (inte per-handledare)
- Mätbart (spåra faktiska resultat)

---

## Moat-analys

### 1. Datamoat

Ingen annan har byggt en enhetlig plattform ovanpå AF:s alla 60+ datasets. Vi har:
- 51 000+ substitutability-relationer
- 8 000+ kompetenser mappade till SSYK-4
- 10+ års historisk jobbdata
- Lokal kopia som uppdateras nattligt

### 2. Nätverkseffekter

Fler TalentFlow-användare → bättre beteendedata → bättre rekommendationer → fler användare.
Fler kommuner → mer aggregerad data → bättre CityIQ-rapporter → fler kommuner.

### 3. First-mover advantage

Vi är först med att bygga en produktifierad lösning ovanpå AF:s substitutability-data. Konkurrenter som vill kopiera måste:
1. Ladda ner och förstå alla datasets
2. Bygga graf-queries
3. Träna AI-modeller
4. Bygga produkter (TalentFlow + CityIQ)
5. Landa pilotkommuner

Det tar 12-18 månader — vid den tidpunkten har vi marknadspenetration och nätverkseffekter.

### 4. Regulatory positioning

Genom att bygga på statlig infrastruktur (AF:s data) positionerar vi oss som "infrastruktur" snarare än "leverantör". Det gör oss svårare att ersätta politiskt.

---

## Potentiella hot

| Hot | Sannolikhet | Allvar | Hantering |
|-----|-----------|--------|-----------|
| AF bygger samma sak internt | Låg (byråkrati) | Hög | Vi är snabbare; om de bygger, samarbeta |
| LinkedIn lanserar karriärbyte-verktyg | Medium | Medium | De saknar AF:s data, vi är redan lokal |
| Stor konsultfirma (Accenture etc) | Låg | Medium | De bygger på uppdrag, vi har produkt |
| Annan startup med samma idé | Medium | Hög | Hastighet + patent + kommunrelationer |

---

## Sammanfattning

NordiqFlow är ensam om att kombinera:
1. AF:s officiella substitutability-data
2. AI-driven CV-parsing
3. Kommunal dashboard (CityIQ)
4. Gratis karriärverktyg för individer

Ingen befintlig aktör har incitament att bygga detta. Vi har det.
