# Investor FAQ — NordiqFlow

**Senast uppdaterad**: 2026-02-22

---

## Affärsmodell & Prissättning

### Varför gratis för användare?

Vi använder en **third-party payer**-modell. Kommunen köper CityIQ-licensen, invånarna får TalentFlow gratis som del av kommunens arbetsmarknadsservice. Precis som 1177 är gratis för patienten men regionen betalar.

- **Renare modell**: En kund (kommunen), inte tusentals B2C-kunder att jaga
- **Högre adoption**: Ingen betalningsbarriär = fler användare = bättre data = bättre produkt
- **Kommunalt incitament**: Kommun betalar 75-250k SEK/år, sparar potentiellt miljoner i arbetsmarknadsåtgärder

### Vad är CAC (Customer Acquisition Cost)?

CAC = Hur mycket det kostar att skaffa en betalande kund. För B2G mot kommuner:
- Säljmöten, demos, resor, upphandlingsprocesser (6-18 månader)
- Uppskattad CAC per kommun: 30-80k SEK
- Vid snittintäkt 150k SEK/år och LTV på 5 år (750k SEK): LTV:CAC ratio 9-25x

### Ni söker seed-kapital — hur mycket?

Ännu ej fastställt. Ungefärlig ram:
- 3 personer i 18 månader: ca 5-7M SEK (löner + overhead)
- Produktutveckling, servrar, marknadsföring: ca 1-2M SEK
- **Totalt seedbehov**: Uppskattningsvis 7-10M SEK

### Budget — vilka antaganden är mest känsliga?

1. **Säljcykel-hastighet**: Om kommuner tar 18 mån istället för 12 skjuts intäkter framåt
2. **Konvertering från pilot till betalande**: Antar 60-70%
3. **Teamkostnad**: Varje ny anställning före intäkter ökar burn rate
4. **Vinnova-bidrag**: Ej inkluderat i basfallet

### Vinnova — räknar ni på det?

**Nej.** Planerad ansökan Q2 2026, men inte i baseline-budgeten. Om beviljat förbättrar det runway med 2-4M SEK.

### Burn rate?

**Idag: ~0 kr/mån.** Grundaren arbetar utan lön. Free-tier hosting. Med team: se TEAM_PLAN.md.

---

## Juridik & Regulatorik

### Har ni signerat LOI med Vetlanda?

**Nej.** LOI-dokument förberett (12 sidor), aktiva diskussioner pågår, men inget signerat.

### Kan ni patentera lösningen?

Se LEGAL_REQUIREMENTS.md för fullständig patentplan. Kort:
- Idén att använda öppna data: **ej patenterbar**
- Specifik algoritm/metod: **potentiellt patenterbar** om ny och icke-uppenbar
- Composite scoring-formeln: behöver utredas av IP-jurist
- Kostnad: 50-150k SEK (Sverige), 300-500k SEK (EU)

### EU AI Act?

Planerat men ej genomfört. Se LEGAL_REQUIREMENTS.md.

### GDPR — var lagras personuppgifter?

- Supabase EU-region (Frankfurt), SOC 2 Type II
- Behöver: DPA med Supabase, integritetspolicy, rättslig grund
- AB nödvändigt — bolaget blir personuppgiftsansvarig

---

## Konkurrens & Marknad

### Varför har inte LinkedIn/Jobtech gjort detta?

**Incitamentsstrukturer**, inte lathet:
- **LinkedIn**: Tjänar på rekryterare, inte kandidater. Branschbyte minskar rekryterarberoendet.
- **Jobtech/Randstad/Monster**: Jobboards som tjänar på annonsvolymer, inte matchningskvalitet.
- **AF**: Myndighet med 10 000 anställda och byråkratiska incitament att inte störa sin verksamhet.

Ingen har haft incitament att faktiskt bry sig om den som söker jobb. Vi har det — det är hela poängen.

### Kan kommuner bygga samma sak själva?

**Osannolikt:**
1. Kommuner saknar teknisk kapacitet för AI-plattformar
2. Kostar >5M SEK att bygga internt vs 75-250k/år licens
3. Vi har first-mover advantage och nätverkseffekter

### Kommunpenetration år 3?

- **År 1**: 3-5 pilotkommuner
- **År 2**: 15-25 betalande
- **År 3**: 30-50 betalande (25-30% av relevanta)

---

## Data & Teknik

### Vad händer om AF stänger API:erna?

Lokal kopia av alla 60+ datasets, uppdateras regelbundet. Kärnfunktionen (karriärövergångar) kör offline.

### Substitutability-data — uppdateringsfrekvens?

AF uppdaterar taxonomin ca en gång per år. Vi bestämmer vikterna i vår scoring (w1-w5) — det är vår IP.

### Tech stack?

Supabase (PostgreSQL + pgvector), Next.js 15, Anthropic Claude, Vercel. Se `docs/SUPABASE_VS_NEO4J.md`.

---

## Team

### En grundare — hur skalar ni?

Anställ 3 först: CTO/Tech, kommunsäljare, grundare. Se TEAM_PLAN.md.

### Linneas erfarenhet av offentlig sektor?

Begränsad i Sverige. Government contracts i USA (Keeping Tabs). Kompletteras med rådgivare.

### Rådgivare?

Sökes. Profiler: fd upphandlingschef kommun, SKR-konsult, kontakt via Adda.

---

## Exit

### Exit-strategi?

**Förvärv** av HR-tech (Visma, Simployer, Quinyx) eller konsultbolag (CGI, Sopra Steria).

### Könsbias?

Kön är inte en input-variabel i algoritmen. Matchning sker på concept_ids. Icke-binära skyddas automatiskt.
