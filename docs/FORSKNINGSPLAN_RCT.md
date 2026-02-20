# Forskningsplan: Randomiserad kontrollerad utvärdering av AI-baserad kompetensmatching för arbetssökande

**Projektnamn:** TalentFlow RCT — Effektutvärdering av AI-driven karriärvägledning byggd på Arbetsförmedlingens öppna data

**Sökande organisation:** NordiqFlow AB, Vetlanda

**Kontaktperson:** Linnea Moritz, grundare och utvecklare
**E-post:** linnea@nordiqflow.com
**ORCID:** 0009-0004-9742-8608

**Sökt finansiär:** Forte (Forskningsrådet för hälsa, arbetsliv och välfärd) / IFAU (Institutet för arbetsmarknads- och utbildningspolitisk utvärdering)

**Sökt belopp:** 3 200 000 SEK över 24 månader

**Projektperiod:** September 2026 — Augusti 2028

---

## 1. Sammanfattning

Sverige spenderar årligen cirka 80 miljarder kronor på arbetsmarknadspolitik (Utgiftsområde 14, Prop. 2024/25:1), men strukturell arbetslöshet kvarstår på nivåer som ligger bland de högsta i EU. I tredje kvartalet 2024 registrerade SCB en total brist på 70 000 arbetare samtidigt som arbetslösheten låg på 8,3 procent. IFAU:s randomiserade utvärdering av Rusta och Matcha (Rapport 2024:17) visade att privatiserad arbetsförmedling kostade 46–70 procent mer per deltagare utan mätbar förbättring av arbetsmarknadsutfall.

En central orsak till matchningsproblematiken är att Arbetsförmedlingens (AF) användarriktade digitala verktyg — främst Platsbanken — bygger på nyckelords- och yrkestitelsmatchning, trots att AF:s egna öppna data (via JobTech Dev) innehåller 51 000+ förberäknade substituerbarhetsvärden mellan yrkeskategorier, 8 000+ kartlagda kompetenser och NLP-baserade anrikningsverktyg.

NordiqFlow har utvecklat TalentFlow, en AI-baserad plattform som bygger på AF:s öppna data och exponerar dolda karriärvägar genom kompetensöverlappsanalys. Denna forskningsplan beskriver en randomiserad kontrollerad studie (RCT) för att mäta om tillgång till TalentFlow leder till kortare arbetslöshetstid, bättre matchningskvalitet och högre lön vid anställning, jämfört med standardstöd.

Studien syftar till att producera den typ av rigorös kausal evidens som hittills saknats för AI-baserade matchningsverktyg i en svensk arbetsmarknadskontext, och bidra till den internationella kunskapsbasen om digitala interventioner inom aktiv arbetsmarknadspolitik.

---

## 2. Bakgrund och problemformulering

### 2.1 Det svenska matchningsproblemet

Sveriges arbetsmarknad uppvisar sedan 2008 en utåtgående förskjutning av Beveridgekurvan — den makroekonomiska diagnostiken för matchningseffektivitet. Riksbankens analys (Economic Commentary, januari 2025) identifierar två distinkta strukturella skiften: ett efter finanskrisen 2008–2009 och ytterligare ett under pandemin 2020. Förskjutningen innebär att fler vakanser samexisterar med högre arbetslöshet, vilket indikerar att problemet inte är brist på jobb eller arbetskraft, utan bristande förmåga att koppla samman dem.

SCB:s undersökning av lediga jobb och rekryteringsbehov (Q3 2024) kvantifierar detta: 70 000 arbetare saknas i ekonomin — inom teknik, vård och grön omställning — medan strukturell arbetslöshet består. TechSverige projicerar ett underskott på 18 000 teknikkompetenser per år mellan 2024 och 2028. Samtidigt har Malmö en arbetslöshet som konsekvent ligger 5–7 procentenheter över rikssnittet, och perifera stadsdelar i Göteborg uppvisar nivåer över 20 procent.

### 2.2 Nuvarande matchningsinfrastruktur och dess begränsningar

AF:s Platsbanken — det primära digitala matchningsverktyget för 400 000+ registrerade arbetssökande — matchar yrkesrubriker mot yrkesrubriker. En arbetssökande registrerad som "butikschef" får förslag på butikschefsroller. Systemet ställer inte frågan: vilka kompetenser har denna person, och vilka andra yrkeskategorier kräver samma kompetenser?

Paradoxen är att AF:s egen datainfrastruktur (JobTech Dev) innehåller exakt den information som behövs för kompetensbaserad matchning: förberäknade substituerbarhetsvärden mellan alla 430 SSYK-4-koder, detaljerade kompetensprofilerer, NLP-anriknings-API:er och femåriga prognoser (Yrkesbarometern). Denna data har gjorts tillgänglig som öppen infrastruktur men har aldrig integrerats i de verktyg som arbetssökande faktiskt använder.

### 2.3 Evidensläget för digitala matchningsinterventioner

IFAU:s Rapport 2024:17 (Egebark, Laun, Liljeberg, Rödin, Söderström, Videnord & Vikström) utgör den mest rigorösa kausala utvärderingen av privatiserad arbetsförmedling i Sverige. Studiens randomiserade design visade att Rusta och Matcha-deltagare inte fick jobb snabbare, inte påbörjade utbildning oftare och inte uppvisade någon statistiskt signifikant förbättring jämfört med kontrollgruppen — trots 46–70 procent högre kostnader.

Internationell forskning visar liknande resultat för utlokaliserade matchningstjänster (Tyskland, Belgien, Australien). Dock saknas rigorösa utvärderingar av AI-baserade, kompetensöverlappsbaserade matchningsverktyg i en nordisk kontext. Den forskning som finns om digitala karriärinformationsverktyg (bl.a. OECD:s genomgångar av det nederländska UWV-systemet och Danmarks Jobnet) indikerar att bättre matchningsinformation — när den faktiskt når arbetssökande — konsekvent minskar både arbetslöshetstid och sannolikheten för tidigt jobbavhopp.

### 2.4 Kunskapslucka

Det saknas kausal evidens för huruvida AI-baserade verktyg som bygger på offentlig kompetensdata kan förbättra arbetsmarknadsutfall i en svensk kontext. Denna studie adresserar den luckan direkt.

---

## 3. Syfte och frågeställningar

### 3.1 Övergripande syfte

Att genom en randomiserad kontrollerad studie mäta den kausala effekten av tillgång till NordiqFlow TalentFlow — en AI-baserad kompetensmatching-plattform byggd på AF:s öppna data — på arbetssökandes arbetsmarknadsutfall.

### 3.2 Primära frågeställningar

1. **Arbetslöshetstid:** Leder tillgång till TalentFlow till kortare tid i arbetslöshet jämfört med standardstöd (Platsbanken + AF:s ordinarie insatser)?

2. **Matchningskvalitet:** Uppvisar behandlingsgruppen högre lön vid första anställning, lägre sannolikhet för tidigt jobbavhopp (inom 6 månader) och högre subjektiv arbetsnöjdhet?

3. **Karriärmobilitet:** Leder TalentFlow till att arbetssökande i högre utsträckning söker och får anställning i yrkeskategorier utanför sin tidigare yrkestitel — dvs. gör plattformen "dolda" karriärvägar synliga och handlingsbara?

### 3.3 Sekundära frågeställningar

4. **Heterogena effekter:** Varierar effekterna beroende på utbildningsnivå, ålder, kön, födelseland, arbetsmarknadsavstånd (baserat på AF:s statistiska bedömningsstöd) eller bostadsregion?

5. **Beteendeförändringar:** Förändrar tillgång till kompetensöverlappsdata de typer av jobb som arbetssökande söker, och i vilken utsträckning?

6. **Kostnadseffektivitet:** Vad är kostnaden per framgångsrik matchning via TalentFlow jämfört med publicerade kostnader för Rusta och Matcha (IFAU 2024:17)?

---

## 4. Metod och genomförande

### 4.1 Studiedesign

Studien använder en tvåarmad, individuellt randomiserad kontrollerad design:

- **Behandlingsgrupp (T):** Får full tillgång till TalentFlow-plattformen (kompetensöverlappsanalys, AI-genererade karriärvägar, gap-analys, riktade utbildningsförslag, jobbmatchning bortom yrkestitel) utöver AF:s standardstöd.

- **Kontrollgrupp (C):** Får AF:s standardstöd (Platsbanken, aktivitetsrapporter, eventuell hänvisning till Rusta och Matcha eller annan insats) utan tillgång till TalentFlow.

Randomiseringen sker vid registrering. Deltagare som registrerar sig för TalentFlow under rekryteringsperioden slumpmässigt tilldelas T eller C med 1:1-allokering, stratifierat efter AF:s bedömda arbetsmarknadsavstånd (nära/mellan/långt) och bostadslän.

### 4.2 Urval och rekrytering

**Målpopulation:** Arbetssökande registrerade hos Arbetsförmedlingen i åldern 18–64 år.

**Rekryteringsstrategi:**
- Digital marknadsföring riktad mot arbetssökande (sociala medier, arbetsmarknadsgrupper, samarbete med fackförbund och a-kassor)
- Samarbete med 3–5 kommuner (pilot: Vetlanda, Eksjö, Nässjö samt storstadskommun) för lokal rekrytering
- Information via AF:s Mina Sidor (förutsatt avtal med AF) eller via oberoende kanaler

**Urvalsstorlek (powerberäkning):**

Baserat på IFAU:s data om genomsnittlig arbetslöshetstid (ca 9 månader för medelavståndsgruppen) och en förväntad effekt om 2 månaders reduktion (22 % relativ minskning) med 80 procent power och 5 procent signifikansnivå:

- Minimum effektstorlek (Cohen's d): 0.25
- Beräknad urvalsstorlek: **n = 500 per arm (1 000 totalt)**
- Med 20 procent bortfallsmarginal: **rekryteringsmål 1 200 deltagare**

Powerberäkningen baseras på standardantaganden för arbetsmarknadsstudier med binärt utfall (anställning ja/nej vid 6 och 12 månader) samt kontinuerligt utfall (dagar till anställning).

### 4.3 Datainsamling

**Primära utfallsvariabler:**
- Tid till första anställning (dagar från randomisering till anställningsstart)
- Anställningsstatus vid 6, 12 och 18 månader efter randomisering
- Månadslön vid första anställning

**Sekundära utfallsvariabler:**
- Yrkeskategori (SSYK-4-kod) vid anställning jämfört med senaste yrkestitel
- Jobbvaraktighet (kvarstående i anställning vid 6 månader)
- Subjektiv arbetsnöjdhet och upplevd matchningskvalitet (enkät)
- Antal och typ av jobbansökningar (beteendedata)

**Datakällor:**
1. **Registerdata** (via SCB och AF, med personuppgiftsbiträdesavtal): LISA-registret för inkomst och sysselsättning, AF:s ärendesystem för inskrivningstid och programdeltagande
2. **Plattformsdata** (TalentFlow-loggar): Användningsmönster, sökta karriärvägar, genomförda gap-analyser
3. **Enkätdata:** Baslinje-enkät vid registrering, uppföljningsenkäter vid 6, 12 och 18 månader

### 4.4 Analysplan

**Intention-to-treat (ITT)-analys:** Primär analysmetod. Alla randomiserade deltagare analyseras i den grupp de tilldelades, oavsett faktisk användning av TalentFlow.

**Treatment-on-the-treated (ToT)-analys:** Sekundär analys med randomisering som instrumentvariabel för att uppskatta effekten bland faktiska användare.

**Statistiska metoder:**
- Cox proportional hazards-modell för tid till anställning
- Logistisk regression för binära utfall (anställd ja/nej vid mätpunkter)
- OLS-regression för kontinuerliga utfall (lön, arbetstimmar)
- Heterogenitetsanalyser med förspecificerade interaktionstermer (kön, ålder, utbildningsnivå, arbetsmarknadsavstånd, region)
- Multipel jämförelsekorrigering (Bonferroni/Holm) för sekundära utfall

**Förregistrering:** Studieprotokollet förregistreras på AsPredicted.org eller AEA RCT Registry innan rekrytering påbörjas.

---

## 5. Tidsplan

| Period | Aktivitet |
|---|---|
| **Sep–Nov 2026** | Etikprövning (Etikprövningsmyndigheten). Avtal med SCB och AF om dataåtkomst. Studieprotokoll förregistreras. Teknisk förberedelse av randomiseringsmodul i TalentFlow. |
| **Dec 2026 – Feb 2027** | Pilottest med 50 deltagare (ej inkluderade i huvudstudien). Validering av randomiseringsmodul, enkätinstrument och datainsamlingsflöden. Justering av studieprotokoll vid behov. |
| **Mar – Sep 2027** | Huvudrekrytering: 1 200 deltagare rekryteras och randomiseras. Löpande datainsamling och kvalitetskontroll. 6-månaders-enkät skickas löpande till tidiga deltagare. |
| **Okt 2027 – Mar 2028** | Rekryteringen stängs. 6-månaders uppföljning slutförs för alla deltagare. 12-månaders uppföljning påbörjas för tidiga deltagare. Preliminär dataanalys. |
| **Apr – Jun 2028** | Registerdata inhämtas från SCB (LISA) och AF. Slutlig dataanalys. |
| **Jul – Aug 2028** | Slutrapport och working paper. Inlämning till vetenskaplig tidskrift. Presentation av resultat. |

---

## 6. Etiska överväganden och datahantering

### 6.1 Etikprövning

Studien kräver godkännande av Etikprövningsmyndigheten (EPM) enligt Lag (2003:460) om etikprövning av forskning som avser människor. Ansökan förbereds under september–november 2026.

**Centrala etiska aspekter:**

- **Informerat samtycke:** Alla deltagare informeras om studiens syfte, randomiseringsförfarandet och att de kan avbryta sitt deltagande när som helst utan konsekvenser för deras AF-registrering eller bidrag. Samtycke inhämtas digitalt med BankID-verifiering.

- **Rättvisa:** Kontrollgruppen nekas inte befintligt stöd — de behåller full tillgång till AF:s standardtjänster. Behandlingsgruppen erhåller ett tillägg, inte en ersättning. Efter studiens slut erbjuds kontrollgruppen tillgång till TalentFlow.

- **Algoritmbias:** TalentFlow bygger på AF:s öppna data, som kan innehålla historiska mönster som speglar diskriminering (kön, etnicitet, ålder) på arbetsmarknaden. Före studiestart genomförs en systematisk granskning av karriärrekommendationerna för att identifiera och mitigera algoritmisk bias. Resultaten av denna granskning dokumenteras i ett separat tekniskt appendix och granskas av oberoende expertis. Studien bedömer även huruvida plattformens rekommendationer skiljer sig systematiskt mellan demografiska grupper.

- **EU AI Act-compliance:** TalentFlow klassificeras preliminärt som ett AI-system med "begränsad risk" under EU:s AI-förordning, men med tanke på att det riktar sig mot arbetssökande — en potentiellt sårbar grupp — genomförs en konsekvensanalys (DPIA) och transparenskraven under Artikel 52 tillämpas (användare informeras om att de interagerar med AI-genererade rekommendationer).

### 6.2 Datahantering och GDPR

- Personuppgifter behandlas enligt GDPR (EU 2016/679) och Lag (2018:218) med kompletterande bestämmelser
- Pseudonymisering: alla analysdata avidentifieras; kopplingsnyckel förvaras separat hos huvudforskaren
- Registerdata från SCB levereras via SCB:s MONA-system eller via mikrodata under sekretess
- Plattformsdata lagras på EU-baserade servrar (Supabase EU-region)
- Datahanteringsplan (DMP) upprättas enligt Fortes krav och deponeras hos SND (Svensk Nationell Datatjänst)
- Forskningsdata tillgängliggörs i avidentifierad form efter publicering, i enlighet med FAIR-principerna

---

## 7. Samarbetsstruktur och kompetens

### 7.1 Föreslagna samarbetspartners

Studien kräver kompetens som sträcker sig bortom NordiqFlow:s kärnteam. Följande samarbeten eftersöks:

**Akademisk partner (önskas):**
- IFAU, Uppsala — expertis inom randomiserade utvärderingar av arbetsmarknadspolitik, direkt relevans genom deras RoM-utvärdering (2024:17)
- Alternativt: SOFI (Stockholms universitets institutet för social forskning) eller Nationalekonomiska institutionen, Uppsala universitet

**Akademisk forskare:**
- Doktorand eller postdoktor inom nationalekonomi/arbetsmarknadsekonomi med erfarenhet av RCT-design och registerdata. Denna person leder den statistiska analysen och ansvarar för vetenskaplig publikation.

**NordiqFlow:s ansvar:**
- Utveckling och drift av TalentFlow-plattformen
- Implementering av randomiseringsmodul
- Rekrytering av deltagare
- Insamling av plattformsdata och enkätdata
- Teknisk dokumentation av AI-systemet

### 7.2 Organisationsstruktur

| Roll | Ansvarig | Uppgift |
|---|---|---|
| Projektledare | Linnea Moritz, NordiqFlow | Övergripande projektledning, kommunrekrytering, plattformsutveckling |
| Huvudforskare (PI) | Akademisk partner (sökes) | Studiedesign, analysplan, etikansökan, vetenskaplig publicering |
| Dataansvarig | NordiqFlow + akademisk partner | Registerdata-avtal, pseudonymisering, GDPR-compliance |
| Statistiker | Akademisk partner | Powerberäkningar, statistisk analys, robusthetskontroller |
| Algoritm-granskare | Oberoende expert (sökes) | Bias-granskning av TalentFlow:s rekommendationer |

---

## 8. Budget

| Post | År 1 (SEK) | År 2 (SEK) | Totalt (SEK) |
|---|---|---|---|
| Akademisk forskare (50 % tjänst) | 400 000 | 400 000 | 800 000 |
| Statistikerkonsultation | 100 000 | 150 000 | 250 000 |
| Etikprövningsansökan | 20 000 | — | 20 000 |
| SCB registerdata (LISA + AF-data) | 150 000 | 50 000 | 200 000 |
| Enkätplattform och datainsamling | 80 000 | 80 000 | 160 000 |
| Deltagarersättning (enkäter, 3 × 200 SEK × 1 200) | 240 000 | 480 000 | 720 000 |
| Bias-granskning och AI-audit | 150 000 | — | 150 000 |
| Resor och konferenser | 50 000 | 100 000 | 150 000 |
| Publicering (open access-avgift) | — | 50 000 | 50 000 |
| Plattformsdrift (TalentFlow, servrar, API-kostnader) | 350 000 | 350 000 | 700 000 |
| **Totalt** | **1 540 000** | **1 660 000** | **3 200 000** |

**Not:** NordiqFlow:s egeninsats (plattformsutveckling, teamlöner, marknadsföring) finansieras separat och ingår inte i detta sökt belopp. Denna budget avser enbart forskningskostnaderna.

---

## 9. Förväntade resultat och samhällsnytta

### 9.1 Vetenskapligt bidrag

Studien producerar den första randomiserade kausala utvärderingen av en AI-baserad, kompetensöverlappsdriven matchningsplattform i en svensk arbetsmarknadskontext. Den bidrar till:

- Den internationella litteraturen om digitala interventioner inom aktiv arbetsmarknadspolitik (ALMP)
- Evidensbasen kring huruvida kompetensbaserad matchning (skills-first) ger bättre utfall än yrkestitelsmatchning (title-based)
- Förståelsen av heterogena effekter — vilka grupper gynnas mest av förbättrad matchningsinformation?
- Metodologisk kunskap om hur man utvärderar AI-verktyg i offentlig sektor

### 9.2 Policyrelevans

Resultaten har direkt policyrelevans för:

- **Regeringens AI-strategi:** AI-kommissionen har identifierat arbetsmarknaden som ett prioriterat tillämpningsområde. Studien levererar empirisk evidens om huruvida AI-matchning fungerar i praktiken.
- **AF:s reformarbete:** Om studien visar positiva resultat, utgör den underlag för att integrera kompetensbaserad matchning i AF:s digitala infrastruktur.
- **Finansdepartementet:** ROI-beräkningar baserade på kausala effektskattningar möjliggör kostnads-nyttoanalyser som är direkt jämförbara med IFAU:s RoM-utvärdering.
- **EU-nivå:** Resultaten är relevanta för andra EU-länder som implementerar digitala ALMP-verktyg under EU:s jobbgarantiprogram.

### 9.3 Fiskal ROI-projektion

Baserat på artikelns konservativa antaganden (IFAU-data, dokumenterade bidragskostnader):

- Kostnad per arbetslös per månad i direkta bidrag: ~17 500 SEK (medelvärde a-kassa)
- Om TalentFlow accelererar anställning med 2 månader per användare: besparing ~35 000 SEK per person
- För 1 000 användare: ~35 MSEK i fiscal besparing
- Forskningskostnad: 3,2 MSEK → potentiell ROI: ~11:1

Dessa siffror är projicerade och utgör en del av vad studien avser att verifiera eller falsifiera.

### 9.4 Publiceringsplan

| Tidpunkt | Publikation |
|---|---|
| Mar 2027 | Studieprotokoll — publicering i öppen access-tidskrift (t.ex. BMC Public Health eller Trials) |
| Sep 2028 | Huvudresultat — inlämning till Labour Economics, Journal of Human Resources eller IFAU Working Paper-serien |
| Nov 2028 | Policy brief — riktad till Finansdepartementet, AF och AI-kommissionen |
| Dec 2028 | Populärvetenskaplig sammanfattning — riktad till media och allmänhet |

---

## 10. Referenser

Egebark, J., Laun, L., Liljeberg, L., Rödin, M., Söderström, M., Videnord, J. & Vikström, J. (2024). *En effektutvärdering av arbetsförmedling med fristående leverantörer*. IFAU Rapport 2024:17.

Lundin, M., Sibbmark, K. & Söderström, M. (2024). *Rusta och matcha: Vad händer hos privata leverantörer*. IFAU Rapport 2024:9.

IFAU (2025). *Samverkan mellan kommuner och Arbetsförmedlingen*. IFAU Rapport 2025:5.

Sveriges Riksbank (2025). *Labour Market Matching in Sweden*. Economic Commentary, januari 2025.

OECD (2023). *Reforming the Swedish Public Employment Service — Note on the Design of the Compensation Model for Contracted Service Providers*.

Statistiska centralbyrån (2024). *Lediga jobb och rekryteringsbehov, Q3 2024*. Statistiska meddelanden.

TechSverige (2024). *Tech Talent Shortage Report 2024–2028*.

Riksdagen (2024). *Budgetpropositionen för 2025, Utgiftsområde 14 Arbetsmarknad och arbetsliv*. Prop. 2024/25:1.

Januariavtalet (2019). *Sakpolitisk överenskommelse mellan Socialdemokraterna, Centerpartiet, Liberalerna och Miljöpartiet*. 11 januari 2019.

Bonthuis, B., Jarvis, V. & Vanhala, J. (2016). *Shifting the Beveridge Curve: What Affects Labor Market Matching?* IMF Working Paper WP/16/93.

SOU 2019:3. *Effektivare insatser för arbetsmarknadsintegration*.

Arbetsförmedlingen / JobTech Dev. *Öppna data och API-dokumentation*. jobtechdev.se.
