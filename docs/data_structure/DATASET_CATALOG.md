# Arbetsförmedlingen - Complete Dataset & API Catalog

**Uppdaterad**: 2024-12-24  
**Källa**: https://data.arbetsformedlingen.se/  
**Syfte**: Master-lista över ALLA tillgängliga data-resurser

---

## 📡 APIs (9 st)

### **1. Arbetsmarknadstaxonomi**
**Beskrivning**: API för ord och begrepp som används på arbetsmarknaden  
**Base URL**: `https://taxonomy.api.jobtechdev.se/v1/`  
**Swagger**: https://taxonomy.api.jobtechdev.se/v1/taxonomy/swagger-ui/  
**Format**: JSON  
**Innehåll**: Yrken, skills, SSYK/SNI/SUN, relationer  
**Kritiskt för**: TalentFlow, SkillHedge, CityIQ (ALLT)

---

### **2. Direct Transferred Job Posting**
**Beskrivning**: Partner-API för att publicera platsannonser  
**Användning**: Kräver arbetsgivarkonto  
**Kritiskt för**: N/A (vi läser bara data, publicerar inte)

---

### **3. Historiska platsannonser**
**Beskrivning**: Alla platsannonser från 2016+, måste vara avpublicerade  
**Base URL**: `https://historical-ads.api.jobtechdev.se/`  
**Swagger**: https://data.arbetsformedlingen.se/data/dataset/historical-ads/  
**Innehåll**: 
- Berikade med kompetenser
- Distansarbete-data
- Avpublicerade annonser från Platsbanken
**Kritiskt för**: SkillHedge (trend analysis), TalentFlow (salary data)

---

### **4. JobAd Enrichments**
**Beskrivning**: AI/NLP för att extrahera skills från fritext  
**Base URL**: `https://jobad-enrichments.api.jobtechdev.se/`  
**Swagger**: https://jobad-enrichments.api.jobtechdev.se/swagger-ui/  
**Input**: Ostrukturerad text (CV, jobbannons)  
**Output**: Strukturerade concept_ids (yrken, skills, språk, traits)  
**Kritiskt för**: TalentFlow (CV-analys)

---

### **5. JobAd Links**
**Beskrivning**: Sök-API för praktiskt taget alla platsannonser på marknaden  
**Base URL**: `https://jobad-links.api.jobtechdev.se/`  
**Swagger**: https://data.arbetsformedlingen.se/data/dataset/jobadlinks-job-api/  
**Kritiskt för**: Aggregerad sökning över flera källor

---

### **6. JobEd Connect**
**Beskrivning**: Kopplar utbildningar till yrken automatiskt  
**Base URL**: `https://jobed-connect.api.jobtechdev.se/`  
**Swagger**: https://data.arbetsformedlingen.se/data/dataset/jobed-connect-api/  
**Metod**: 
- Utbildningens kunskapsmål → Yrkens kompetenskrav
- Baserat på berikade historiska annonser + SUSA-data
**Kritiskt för**: TalentFlow (education pathways), CityIQ (ROI-kalkyl)

---

### **7. JobSearch**
**Beskrivning**: Sök bland Arbetsförmedlingens aktuella platsannonser  
**Base URL**: `https://jobsearch.api.jobtechdev.se/`  
**Swagger**: https://jobsearch.api.jobtechdev.se/api/v1/docs/  
**Sökning**: Fritext + strukturerade filter (yrken, geografi, skills)  
**Kritiskt för**: TalentFlow (live jobb), SkillHedge (real-time demand)

---

### **8. JobStream**
**Beskrivning**: Real-time webhook för alla förändringar i platsannonser  
**Base URL**: `https://jobstream.api.jobtechdev.se/`  
**Events**: Nya annonser, uppdateringar, avpubliceringar  
**Kritiskt för**: SkillHedge (real-time index updates)

---

### **9. Personal Data Gateway**
**Beskrivning**: GDPR-compliant access till personuppgifter med individens godkännande  
**Användning**: För att bygga tjänster där användare delar sin AF-data  
**Kritiskt för**: TalentFlow (om vi vill hämta användarens inskrivningsstatus)

---

## 💾 Datamängder (60+ st)

### **KATEGORI: SSYK - Yrkesklassificering**

| Dataset | URL Slug | Format | Beskrivning |
|---------|----------|--------|-------------|
| Nivå ett i SSYK-strukturen | `ssyk-level-1-groups` | JSON | 10 huvudgrupper |
| Nivå två i SSYK-strukturen | `ssyk-level-2-groups` | JSON | ~40 yrkesområden |
| Nivå tre i SSYK-strukturen | `ssyk-level-3-groups` | JSON | ~120 yrkesgrupper |
| Nivå fyra i SSYK-strukturen | `ssyk-level-4-groups` | JSON | ~430 yrkesgrupper (mest detaljerat) |
| Hela SSYK-strukturen med yrkesbenämningar | `the-ssyk-hierarchy-with-occupations` | JSON | KOMPLETT hierarki + alla 10,000 yrken |
| SSYK nivå fyra med relationer till ISCO nivå fyra | `ssyk-level-4-with-related-isco-level-4-groups` | JSON | Internationell mappning |
| SSYK nivå fyra med relationer till kompetensbegrepp | `ssyk-level-4-groups-with-related-skills` | JSON | ⭐ Vilka skills krävs per yrke |
| SSYK nivå fyra med relationer till kompetensbegrepp och yrkesbenämningar | `ssyk-level-4-with-related-skills-and-occupations` | JSON | Komplett mappning |
| SSYK nivå fyra med relationer till yrkesbenämningar | `ssyk-level-4-groups-with-related-occupations` | JSON | Yrken per SSYK-kod |

---

### **KATEGORI: SNI - Branschklassificering**

| Dataset | URL Slug | Format | Beskrivning |
|---------|----------|--------|-------------|
| Nivå ett i SNI-strukturen | `sni-level-1` | JSON | 21 sektioner (A-U) |
| Nivå två i SNI-strukturen | `sni-level-2` | JSON | 88 avdelningar |
| Nivå tre i SNI-strukturen | `sni-level-3` | JSON | 272 grupper |
| Nivå fyra i SNI-strukturen | `sni-level-4` | JSON | 616 undergrupper |
| Nivå fem i SNI-strukturen | `sni-level-5` | JSON | 821 klasser |
| Hela SNI-strukturen | `sni-hierarchy` | JSON | KOMPLETT hierarki |

---

### **KATEGORI: SUN - Utbildningsklassificering**

| Dataset | URL Slug | Format | Beskrivning |
|---------|----------|--------|-------------|
| SUN nivå (nivå ett) | `sun-level-hierarchy-level-1` | JSON | Grundnivå |
| SUN nivå (nivå två) | `sun-level-hierarchy-level-2` | JSON | Gymnasial |
| SUN nivå (nivå tre) | `sun-level-hierarchy-level-3` | JSON | Högskola |
| SUN inriktning nivå ett | `sun-field-hierarchy-level-1` | JSON | 10 områden |
| SUN inriktning nivå två | `sun-field-hierarchy-level-2` | JSON | ~25 fält |
| SUN inriktning nivå tre | `sun-field-hierarchy-level-3` | JSON | ~80 undergrupper |
| SUN inriktning nivå fyra | `sun-field-hierarchy-level-4` | JSON | ~400 specifika inriktningar |
| Hela SUN-inriktningsstrukturen | `sun-field-hierarchy` | JSON | KOMPLETT inriktningshierarki |
| Hela SUN-nivåstrukturen | `sun-level-hierarchy` | JSON | KOMPLETT nivåhierarki |

---

### **KATEGORI: ⭐ CAREER TRANSITIONS (GULD!)**

| Dataset | URL Slug | Format | Beskrivning | Kritiskt för |
|---------|----------|--------|-------------|--------------|
| **Släktskap mellan yrkesbenämningar** | `substitutability-relations-between-occupations` | JSON | ⭐ PRE-COMPUTED career transitions! Nivå 75 (hög likhet) och 25 (låg likhet) | TalentFlow |
| **Närliggande yrken** | `related-occupations` | JSON | ⭐ AI-beräknad yrkeslikhet baserat på skills, tasks, education | TalentFlow |
| Relevanta kompetenser för yrken | `relevant-skills-for-occupations` | JSON | ESCO-baserade skill-recommendations | TalentFlow |

---

### **KATEGORI: ⭐ FORECASTING & TRENDS (GULD!)**

| Dataset | URL Slug | Format | Beskrivning | Kritiskt för |
|---------|----------|--------|-------------|--------------|
| **Yrkesbarometer** | `yrkesbarometer` | JSON | ⭐ 5-års prognoser per yrke och län! Uppdateras 2x/år | SkillHedge |
| JobSearch Trends | `jobsearch-trends` | JSON | Dagliga uppdateringar av populäraste sökorden på Platsbanken | SkillHedge |

---

### **KATEGORI: KOMPETENSER**

| Dataset | URL Slug | Format | Beskrivning |
|---------|----------|--------|-------------|
| Kompetensbegrepp | `skills` | JSON | ~8,000 kompetenser standalone |
| Kompetensbegrepp och relationer till kompetensrubrik och nivå fyra i SSYK-strukturen | `skills-with-related-skill-headlines-and-ssyk-level-4-groups` | JSON | Skills + vilka yrken som kräver dem |

---

### **KATEGORI: YRKEN**

| Dataset | URL Slug | Format | Beskrivning |
|---------|----------|--------|-------------|
| Yrkesbenämningar | `occupations` | JSON | ~10,000 yrkesbenämningar standalone |
| Chefsyrken | `management-occupations` | JSON | ~200 chefsyrken (budget/personal/verksamhetsansvar) |
| Yrken utan krav på utbildning | `occupations-with-no-educational-requirements` | JSON | Yrken för personer utan formell utbildning |
| Yrkesbenämningar till Direktöverförda annonser tjänsten | `occupation-names-for-direct-transferred-job-postings` | JSON | För API-integration |
| Yrkesområden med relationer till SSYK nivå fyra och yrkesbenämningar | `occupation-fields-with-related-ssyk-level-4-groups-and-occupations` | JSON | Yrkesområden (AF:s egen gruppering) |
| Sorteringsdata för yrkesbegrepp | `sorting-data-for-occupational-concepts` | JSON | Viktning baserat på sökfrekvens |

---

### **KATEGORI: SUPPORTING DATA**

| Dataset | URL Slug | Format | Beskrivning |
|---------|----------|--------|-------------|
| Alla koncept | `all-concepts` | JSON | ALLA koncept i taxonomin |
| Begrepp och vanliga relationer | `concepts-and-common-relations` | JSON | Alla begrepp + deras relationer |
| Begreppstyper | `concept-types` | JSON | Metadata om koncept-typer |
| Sökbegrepp | `keyword-concepts` | JSON | Keywords för sökning |
| Sökbegrepp med relation till andra concept | `keyword-concepts-with-relations` | JSON | Keywords + vad de refererar till |
| ISCO nivå fyra | `isco-level-4-groups` | JSON | Internationell standard (för nordisk expansion) |

---

### **KATEGORI: REQUIREMENTS & ATTRIBUTES**

| Dataset | URL Slug | Format | Beskrivning |
|---------|----------|--------|-------------|
| Körkort | `driving-licences` | JSON | ~20 körkortskategorier |
| Språk | `languages` | JSON | ~150 språk med ISO-koder |
| Länder | `countries` | JSON | ~200 länder med ISO-koder |
| EU-regioner | `eu-regions` | JSON | ~3,000 regioner med NUTS-koder |

---

### **KATEGORI: EMPLOYMENT TYPES**

| Dataset | URL Slug | Format | Beskrivning |
|---------|----------|--------|-------------|
| Anställningsform | `employment-type-concepts` | JSON | Tillsvidare, visstid, etc. (LAS-terminologi) |
| Anställningsvaraktighet | `employment-length-concepts` | JSON | Längd på anställning |
| Arbetstid | `concepts-describing-working-hours` | JSON | Heltid, deltid, etc. |
| Sysselsättningsformer | `employment-variety-concepts` | JSON | Anställning + egenföretagande |
| Egenföretagandetyp | `self-employment-type-concepts` | JSON | Typer av egenföretagande |
| Löneform | `wage-type-concepts` | JSON | Månadslön, timlön, etc. |
| Tid i yrke | `concepts-describing-occupation-experience-in-years` | JSON | Erfarenhetskrav (1-3 år, 5+ år, etc.) |

---

### **KATEGORI: EDUCATION & TRAINING**

| Dataset | URL Slug | Format | Beskrivning |
|---------|----------|--------|-------------|
| Datamängd kartläggning av arbetsmarknadsutbildningar | `dataset-mapping-of-labour-market-training` | JSON/CSV | AF:s AMU-kurser mappade till kompetenser |
| Handelsrådets kompetenser med relation till yrke | `swedish-retail-and-wholesale-council-skills` | JSON | Bransch-specifika kompetenser (Handeln) |

---

### **KATEGORI: OTHER**

| Dataset | URL Slug | Format | Beskrivning |
|---------|----------|--------|-------------|
| Platsannonser | `job-ads` | JSON | Aktuella + historiska annonser |
| Min Inskrivningsstatus | `min-inskrivningsstatus` | JSON | Personal Data Gateway dataset |
| Arbetsmarknadstaxonomi | `employment-market-taxonomy` | JSON | Komplett taxonomy export |

---

## 🔗 URL Structure

### **Dataset Download Pattern:**

```
https://data.arbetsformedlingen.se/data/dataset/{url-slug}/
```

På varje dataset-sida finns:
- **"Ladda ner JSON fil"** länk
- **"Datatjänst Arbetsmarknadstaxonomi"** knapp (länkar till API)

### **Exempel:**

```
SUN nivå tre:
https://data.arbetsformedlingen.se/data/dataset/sun-level-hierarchy-level-3/

Släktskap mellan yrken:
https://data.arbetsformedlingen.se/data/dataset/substitutability-relations-between-occupations/

Yrkesbarometer:
https://data.arbetsformedlingen.se/data/dataset/yrkesbarometer/
```

---

## 📥 Download Strategy

### **Prioritet 1 - KRITISKA datasets (ladda ner FÖRST):**
1. ✅ Släktskap mellan yrkesbenämningar
2. ✅ Närliggande yrken
3. ✅ Yrkesbarometer
4. ✅ Relevanta kompetenser för yrken
5. ✅ SSYK nivå fyra med relationer till kompetensbegrepp
6. ✅ Hela SSYK-strukturen med yrkesbenämningar
7. ✅ Hela SUN-inriktningsstrukturen
8. ✅ Kompetensbegrepp

### **Prioritet 2 - SUPPORTING data:**
- SNI hierarki (alla nivåer)
- SUN hierarki (alla nivåer)
- JobSearch Trends
- Körkort, Språk, Länder

### **Prioritet 3 - METADATA:**
- Sorteringsdata
- Sökbegrepp
- Begreppstyper

---

## 🎯 Use Cases per Dataset

### **För TalentFlow:**
- Släktskap mellan yrkesbenämningar → Career transitions
- Närliggande yrken → Alternative careers
- Relevanta kompetenser → Skill gaps
- SSYK + Skills mappings → Requirements per yrke
- SUN strukturer → Education pathways
- Yrkesbarometer → Future-proof careers

### **För SkillHedge:**
- Yrkesbarometer → 5-year forecasts
- JobSearch Trends → Real-time demand signals
- SSYK + SNI mappings → Industry analysis
- Historiska platsannonser API → Backtesting data

### **För CityIQ:**
- Yrkesbarometer → Regional demand analysis
- SUN + SSYK mappings → Education ROI
- AMU-kartläggning → Training program recommendations
- EU-regioner → Geographic comparisons

---

## 📊 Data Freshness

| Dataset Category | Update Frequency |
|-----------------|------------------|
| SSYK/SNI/SUN taxonomies | Årligen eller kvartalsvis |
| Släktskap/Närliggande yrken | Kvartalsvis |
| Yrkesbarometer | 2x/år (vår + höst) |
| JobSearch Trends | Dagligen |
| Kompetensbegrepp | Kontinuerligt |
| Platsannonser (API) | Real-time |

---

## ✅ Next Steps

1. **Scrapa alla dataset-sidor** för att hitta exakta download-URLs
2. **Ladda ner Prioritet 1 datasets**
3. **Analysera schema** för varje dataset
4. **Bygga unified data model**
5. **Import till Neo4j graph database**

---

**Detta dokument uppdateras kontinuerligt när vi lär oss mer.**
