# NordiqFlow — Juridiska Krav & Plan

**Senast uppdaterad**: 2026-02-22

---

## 1. Aktiebolag (AB)

### Varför AB?

- Bolaget blir personuppgiftsansvarig (GDPR), inte grundaren privat
- Begränsat personligt ansvar
- Nödvändigt för investeringar, avtal med kommuner, anställningar
- Skattemässiga fördelar vid tillväxt

### Status

**Ej startat.** Krav: 25 000 SEK i aktiekapital.

### Att göra

1. Samla 25 000 SEK aktiekapital
2. Registrera AB hos Bolagsverket (verksamt.se)
3. Öppna företagskonto
4. Registrera för F-skatt och moms
5. Teckna företagsförsäkring

**Uppskattad kostnad**: 25 000 SEK (aktiekapital) + 2 000 SEK (registrering) + 1 000 SEK (övrigt)
**Uppskattad tid**: 2-3 veckor

---

## 2. GDPR Compliance

### Personuppgifter vi behandlar

| Data | Känslighetsnivå | Rättslig grund |
|------|-----------------|----------------|
| CV-text (namn, erfarenhet, utbildning) | Hög | Samtycke |
| E-post (inloggning) | Medium | Avtal (kontohantering) |
| Yrkesval och sökningar | Låg | Berättigat intresse |
| Anonymiserad aggregerad data | N/A | Ej personuppgifter |

### Krav att uppfylla

1. **Integritetspolicy**: Publicera på webbplatsen, förklara vilka data som samlas in och varför
2. **DPA (Data Processing Agreement)**: Teckna med Supabase (de erbjuder standardavtal)
3. **Rättslig grund**: Samtycke för CV-data, berättigat intresse för anonymiserad statistik
4. **Rätt till radering**: Användare ska kunna ta bort sitt konto och all data
5. **Rätt till export**: Användare ska kunna ladda ner sina data
6. **Dataskyddsombud**: Ej obligatoriskt för SME, men bör utses vid tillväxt
7. **Personuppgiftsansvarig**: NordiqFlow AB (efter registrering)

### Datalagring

- **Plats**: Supabase EU-region (Frankfurt, Tyskland)
- **Kryptering**: At rest (AES-256) och in transit (TLS 1.3)
- **Supabase certifieringar**: SOC 2 Type II, GDPR-kompatibel
- **Backup**: Supabase hanterar automatiskt

### Att göra

- [ ] Starta AB (personuppgiftsansvarig)
- [ ] Skriv integritetspolicy (svenska)
- [ ] Teckna DPA med Supabase
- [ ] Implementera "radera mitt konto"-funktion
- [ ] Implementera dataexport-funktion
- [ ] Consent-hantering i appen (cookie-banner behövs ej med Plausible)

---

## 3. EU AI Act

### Riskklassificering

EU AI Act delar in AI-system i riskkategorier:

| Kategori | Beskrivning | NordiqFlow? |
|----------|-------------|-------------|
| Oacceptabel risk | Social scoring, manipulation | Nej |
| Hög risk | Rekrytering, kreditbedömning | **Möjligen** |
| Begränsad risk | Chatbots, rekommendationer | **Troligen** |
| Minimal risk | Spamfilter, spel | Nej |

### Bedömning

TalentFlow ger **karriärrekommendationer**, inte rekryteringsbeslut. Det är troligen **begränsad risk**, men behöver formell bedömning. Om det klassas som "hög risk" (AI i arbetsmarknadskontexten) krävs:

- Riskhanteringssystem
- Teknisk dokumentation
- Loggning och spårbarhet
- Mänsklig tillsyn
- Robusthets- och cybersäkerhetstester
- Bias-dokumentation

### Oavsett klassificering — krav

1. **Transparens**: Informera användare att AI används ("Denna rekommendation genereras av AI")
2. **Förklarbarhet**: Visa varför en rekommendation ges (vi gör redan detta med matchprocent)
3. **Bias-audit**: Dokumentera att algoritmen inte diskriminerar

### Att göra

- [ ] Genomför formell riskklassificering (intern eller med juristhjälp)
- [ ] Dokumentera AI-systemets syfte, data och begränsningar
- [ ] Implementera transparensmeddelanden i appen
- [ ] Genomför bias-audit av AF:s substitutability-data
- [ ] Utvärdera behov av extern granskning

---

## 4. Patentplan

### Patenterbara element

| Element | Patenterbart? | Prioritet |
|---------|--------------|-----------|
| Idén att använda AF:s öppna data | **Nej** — för generellt | - |
| Composite scoring-formel (S = w1·sub + w2·M + w3·D...) | **Möjligen** — om ny och icke-uppenbar | Hög |
| Metod för multi-hop karriärvägar via rekursiva CTEs | **Möjligen** — teknisk lösning | Hög |
| UI/UX-design för karriärvisualisering | **Design patent** möjligt | Medium |
| Metod för bias-detektion i arbetsmarknadsdata | **Möjligen** — om unik metod | Medium |
| Kombination av substitutability + AI CV-parsing + scoring | **Möjligen** — systempatent | Hög |

### EPO-krav (Europeiska patentverket)

I EU/Sverige krävs att patentet utgör en **"teknisk lösning på ett tekniskt problem"**. Ren programvara och affärsmetoder är svårare att patentera, men:

- En specifik algoritm som löser ett tekniskt matchningsproblem KAN vara patenterbar
- Kombinationen av datakällor + AI + scoring kan ses som en teknisk innovation
- Presentation som "computer-implemented invention" ökar chanserna

### Kostnad

| Typ | Kostnad | Skyddstid |
|-----|---------|-----------|
| Svenskt patent (PRV) | 50-150k SEK | 20 år |
| EU-patent (EPO) | 300-500k SEK | 20 år |
| PCT (internationellt) | 500k-1M SEK | 20 år, per land |
| Designskydd (UI) | 5-20k SEK | 25 år |

### Strategi

1. **Fas 1 (nu)**: Dokumentera alla unika metoder noggrant (intern "invention disclosure")
2. **Fas 2 (Q2 2026)**: Konsultera IP-jurist — rekommenderas: AWA Patent eller Brann AB
3. **Fas 3 (Q3 2026)**: Ansök om svenskt patent på scoring-algoritm + kombinationsmetod
4. **Fas 4 (inom 12 mån)**: Utvärdera EU-patent baserat på marknadsexpansion

### Viktigt

- **Publicera inte algoritmen i detalj** innan patentansökan — nyhetskrav gäller
- Hemsidan visar formeln (S = 0.30×S + 0.30×M + 0.20×D + 0.10×K + 0.10×L) — detta kan påverka patenterbarhet
- **Agera snabbt**: Ju längre du väntar, desto större risk att någon annan ansöker
- IP-jurist MÅSTE involveras — fel formulering och patentet skyddar ingenting

### Att göra

- [ ] Skriv intern "invention disclosure" för alla unika metoder
- [ ] Boka möte med IP-jurist (AWA Patent, Brann, eller via Science Park)
- [ ] Utvärdera om scoring-formeln redan publicerats för detaljerat
- [ ] Budgetera 50-150k SEK för första patentansökan
- [ ] Överväg att ta bort den exakta formeln från publika sidor

---

## 5. Liability / Ansvarsfrågor

### Risken

Om TalentFlow styr en person mot ett yrke och det visar sig vara fel (t.ex. personen investerar i utbildning men får inte jobb):

### Skydd

1. **TalentFlow ger information, inte rådgivning**: Vi rekommenderar, beslut är användarens
2. **Data-baserat**: Baserat på AF:s officiella data, inte våra gissningar
3. **Disclaimers**: "TalentFlow ger indikationer baserade på statistisk data. Individuella resultat varierar."
4. **AB-form**: Bolaget, inte grundaren, bär ansvaret
5. **Företagsförsäkring**: Teckna ansvarsförsäkring (ca 3-10k SEK/år)

### Att göra

- [ ] Skriv tydliga användarvillkor med ansvarsfriskrivning
- [ ] Lägg till disclaimer i appen: "Rekommendationer baseras på statistisk data"
- [ ] Teckna ansvarsförsäkring via t.ex. Trygg-Hansa Företag
- [ ] Konsultera jurist om svensk produktansvar

---

## 6. Könsbias & Diskriminering

### Nuläge

- Algoritmen matchar på **concept_ids** — kön är inte en input-variabel
- AF:s data kan innehålla historisk bias (t.ex. könsfördelning i yrkesövergångar)

### Skydd för icke-binära

- Systemet frågar aldrig om kön
- Kön används aldrig som variabel i någon beräkning
- Starkt svar: "Kön är inte en input-variabel i vår algoritm överhuvudtaget"

### Att göra

- [ ] Genomför bias-audit av AF:s substitutability-data
- [ ] Dokumentera att kön inte ingår i algoritmen
- [ ] Överväg att publicera bias-rapport (ökar trovärdighet hos investerare och kommuner)
- [ ] Testa algoritmen med olika demografiska profiler

---

## Sammanfattning — Prioritetsordning

| Prioritet | Uppgift | Kostnad | Tidsram |
|-----------|---------|---------|---------|
| 1 | Starta AB | 28 000 SEK | 2-3 veckor |
| 2 | GDPR: integritetspolicy + DPA | 0-5 000 SEK | 1 vecka |
| 3 | Konsultera IP-jurist om patent | 5-15 000 SEK | 2 veckor |
| 4 | EU AI Act riskklassificering | 0-20 000 SEK | 1 månad |
| 5 | Användarvillkor + liability | 5-15 000 SEK | 2 veckor |
| 6 | Patentansökan | 50-150 000 SEK | 3-6 månader |
