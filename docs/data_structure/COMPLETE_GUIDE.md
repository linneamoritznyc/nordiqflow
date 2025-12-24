# Arbetsförmedlingen Data Structure - Complete Guide

**Datum**: 2024-12-24  
**Författare**: Linnea Moritz  
**Syfte**: Dokumentera EXAKT hur alla 60+ datasets är strukturerade och hur de kopplar ihop

---

## 🎯 Executive Summary

Arbetsförmedlingens öppna data består av:
- **10 APIs** (dynamic, real-time queries)
- **60+ Datamängder** (static JSON/CSV downloads)

**Kritisk insikt**: De har REDAN beräknat:
- ✅ Släktskap mellan yrken (career transitions!)
- ✅ Närliggande yrken (skill similarities!)
- ✅ 5-års prognoser (demand forecasting!)
- ✅ Kompetens → Utbildning mappings (education pathways!)

**Detta betyder vi kan bygga TalentFlow MYCKET snabbare än planerat.**

---

## 📊 Data Architecture Overview

```
ARBETSFÖRMEDLINGEN OPEN DATA ECOSYSTEM
│
├── 📡 APIs (Dynamic, Real-Time)
│   ├── Taxonomy API (ordbok + graf)
│   ├── JobSearch API (live jobb)
│   ├── JobAd Enrichments API (NLP)
│   ├── JobEd Connect API (utbildning ↔ jobb)
│   ├── Historical Ads API (historik)
│   ├── JobStream API (webhooks)
│   ├── JobAd Links API (aggregerad sökning)
│   ├── Direct Transfer API (publicera jobb)
│   ├── JobSearch Trends API (trenddata)
│   └── Personal Data Gateway (GDPR-compliant data)
│
└── 💾 Datamängder (Static Bulk Downloads)
    ├── JSON format
    ├── CSV format
    └── 60+ olika datasets
```

---

## 🔑 Core Data Structures

### **1. SSYK - Svensk Standard för Yrkesklassificering**

**Vad det är**: Hierarkisk klassificering av ALLA yrken i Sverige

**Struktur**:
```
Nivå 1 (1 siffra)  → 10 huvudgrupper
Nivå 2 (2 siffror) → ~40 yrkesområden
Nivå 3 (3 siffror) → ~120 yrkesgrupper
Nivå 4 (4 siffror) → ~430 yrkesgrupper
```

**Exempel**:
```
2     → "Akademiker och andra specialister"
25    → "IKT-specialister"
251   → "Mjukvaru- och systemutvecklare m.fl."
2513  → "Mjukvaruutvecklare"
```

**Datasets**:
- `ssyk-level-1` (10 grupper)
- `ssyk-level-2` (40 grupper)
- `ssyk-level-3` (120 grupper)
- `ssyk-level-4` (430 grupper)
- `ssyk-hierarchy-with-occupations` (HELA strukturen + alla yrkesbenämningar)

**Kritiskt för oss**:
- Alla jobb i JobSearch är taggade med SSYK-kod
- Vi kan aggregera demand per SSYK-nivå
- Career transitions mappas mellan SSYK-koder

---

### **2. SNI - Svensk Näringsgrensindelning**

**Vad det är**: Klassificering av FÖRETAG/BRANSCHER

**Struktur**:
```
Nivå 1 (1 bokstav)  → 21 sektioner (A-U)
Nivå 2 (2 siffror)  → 88 avdelningar
Nivå 3 (3 siffror)  → 272 grupper
Nivå 4 (4 siffror)  → 616 undergrupper
Nivå 5 (5 siffror)  → 821 klasser
```

**Exempel**:
```
C     → "Tillverkning"
26    → "Tillverkning av datorer, elektronikvaror och optik"
26.2  → "Tillverkning av datorer och kringutrustning"
26.20 → "Tillverkning av datorer och kringutrustning"
26.20A → Specifik produktkategori
```

**Datasets**:
- `sni-level-1` till `sni-level-5`
- `sni-hierarchy` (HELA strukturen)

**Kritiskt för oss**:
- Identifiera växande/krympande industrier
- "Butikschef inom Retail (SNI 47)" → "Verksamhetschef inom Vård (SNI 86)"
- Sector-specific skill demand

---

### **3. SUN - Svensk Utbildningsnomenklatur**

**Vad det är**: Klassificering av UTBILDNINGAR

**Två dimensioner**:

#### A) Utbildningsnivå:
```
Nivå 1 → Grundnivå
Nivå 2 → Gymnasium
Nivå 3 → Högskola/universitet
```

#### B) Utbildningsinriktning:
```
Nivå 1 (1 siffra)       → 10 områden
Nivå 2 (2 siffror)      → ~25 fält
Nivå 3 (3 siffror)      → ~80 undergrupper
Nivå 4 (3 siffror + bokstav) → ~400 specifika inriktningar
```

**Exempel**:
```
5       → "Teknik och tillverkning"
54      → "Informations- och kommunikationsteknik (IKT)"
542     → "Databas och nätverk"
542A    → "Databaser och administration"
```

**Datasets**:
- `sun-level-hierarchy-level-1/2/3`
- `sun-field-hierarchy-level-1/2/3/4`
- `sun-field-hierarchy` (HELA inriktningsstrukturen)
- `sun-level-hierarchy` (HELA nivåstrukturen)

**Kritiskt för oss**:
- TalentFlow: "För att bli X behöver du utbildning Y (SUN-kod Z)"
- CityIQ: "Kommunen har för lite studenter i SUN 542 men många jobb i SSYK 2513"
- JobEd Connect använder SUN för att mappa utbildning → yrke

---

### **4. Kompetensbegrepp (Skills)**

**Vad det är**: ~8,000 strukturerade kompetenser

**Typer**:
- Hårdkompetenser (Python, Scrum, CAD)
- Mjuka kompetenser (Ledarskap, Kommunikation)
- Certifieringar (ISO, PMP)
- Körkort (A, B, C, CE, etc.)
- Språk (Svenska, Engelska, etc.)

**Datasets**:
- `skills` (alla kompetenser, standalone)
- `skills-with-related-skill-headlines-and-ssyk-level-4` (skills + vilka yrken som kräver dem)
- `ssyk-level-4-with-related-skills` (yrken + vilka skills de kräver)
- `relevant-skills-for-occupations` (AI-beräknade relevanta skills per yrke)

**Relationer**:
```json
{
  "skill": {
    "concept_id": "abc123",
    "preferred_term": "Python",
    "type": "skill"
  },
  "related_ssyk_groups": [
    {"ssyk_code": "2513", "term": "Mjukvaruutvecklare"},
    {"ssyk_code": "2512", "term": "Databasdesigner"}
  ]
}
```

**Kritiskt för oss**:
- Career pathfinding: "Dina skills mappar till dessa yrken"
- Skill gap analysis: "Du saknar dessa 3 skills för att bli X"
- SkillHedge index: "Demand för 'Kubernetes' har ökat 40% på 6 mån"

---

### **5. 🌟 SLÄKTSKAP MELLAN YRKESBENÄMNINGAR**

**Detta är GULD! De har REDAN beräknat career transitions!**

**Datamängd**: `substitutability-relations-between-occupations`

**Struktur**:
```json
{
  "from_occupation": {
    "concept_id": "xyz",
    "preferred_term": "Butikschef"
  },
  "to_occupation": {
    "concept_id": "abc",
    "preferred_term": "Verksamhetschef"
  },
  "substitutability_level": 75,  // 75 = Hög, 25 = Låg
  "substitutability_description": "Högt släktskap (75) innebär stor likhet i arbetsuppgifter. Lågt släktskap (25) innebär att utbildning krävs."
}
```

**Hur vi använder det**:
```python
# TalentFlow user input: "Jag är Butikschef"
butikschef_id = "concept_xyz"

# Hämta alla släktskap med hög likhet (75)
high_similarity = släktskap_data.filter(
    from_occupation_id=butikschef_id,
    substitutability_level=75
)

# → ["Verksamhetschef inom vård", "Projektledare", "Avdelningschef"]
```

**Detta betyder**:
- ✅ Vi behöver INTE bygga ML-modeller för career similarity
- ✅ AF har redan gjort jobbet
- ✅ Vi kan fokusera på UX och education pathways

---

### **6. 🌟 NÄRLIGGANDE YRKEN**

**Datamängd**: `related-occupations`

**Vad det är**: AI-beräknad yrkeslikhet baserad på:
- Kompetensöverlapp
- Arbetsuppgifter
- Utbildningskrav

**Struktur**:
```json
{
  "occupation_id": "abc123",
  "occupation_term": "Mjukvaruutvecklare",
  "related_occupations": [
    {
      "occupation_id": "def456",
      "occupation_term": "Systemutvecklare",
      "similarity_score": 0.92
    },
    {
      "occupation_id": "ghi789",
      "occupation_term": "Webbutvecklare",
      "similarity_score": 0.87
    }
  ]
}
```

**Kombinera med Släktskap**:
```python
# För bästa career recommendations:
recommendations = []

# 1. Hög släktskap (75) = direkt byte
high_similarity = get_substitutability(occupation_id, level=75)

# 2. Närliggande yrken = kompetensöverlapp
related = get_related_occupations(occupation_id, min_score=0.80)

# 3. Merge och rankas efter skill gap + salary delta
recommendations = merge_and_rank(high_similarity, related)
```

---

### **7. 🌟 YRKESBAROMETER (5-års prognoser!)**

**Datamängd**: `yrkesbarometer`

**Vad det är**: Officiella prognoser från Arbetsförmedlingen

**Innehåller**:
- Nulägesbedömning (brist/balans/överskott)
- 5-års prognos (ökad/oförändrad/minskad efterfrågan)
- Per län OCH nationellt
- Uppdateras 2 gånger/år (vår + höst)

**Struktur**:
```json
{
  "ssyk_code": "2513",
  "occupation_name": "Mjukvaruutvecklare",
  "region": "Stockholm",
  "current_situation": "Brist",
  "forecast_5_years": "Ökad efterfrågan",
  "last_updated": "2024-06-01"
}
```

**Kritiskt för SkillHedge**:
- ✅ Gratis demand forecasting!
- ✅ Validera våra ML-modeller mot AF:s officiella prognoser
- ✅ Index-byggnad: "Cloud Engineer Index korrelerar med AF:s prognos på 0.94"

---

### **8. ISCO - International Standard Classification of Occupations**

**Vad det är**: Global yrkesklassificering (EU-standard)

**Relation till SSYK**:
```
SSYK-2012 baseras på ISCO-08
Många SSYK-koder mappar 1:1 till ISCO
```

**Datamängd**: `isco-level-4`, `ssyk-level-4-with-related-isco-level-4`

**Kritiskt för nordisk expansion**:
- Norge använder ISCO/STYRK
- Danmark använder ISCO/DISCO
- Finland använder ISCO
- → Vi kan mappa svenska yrken till nordiska

---

### **9. JobEd Connect Mappings**

**Datamängd/API**: `jobed-connect`

**Vad det är**: AI-genererade kopplingar mellan:
- SUN-kod (utbildning) ↔ SSYK-kod (yrke)
- Baserat på:
  - Lärandemål i utbildningsbeskrivningar
  - Kompetenskrav i jobbannonser

**Struktur**:
```json
{
  "education": {
    "sun_code": "542A",
    "name": "Databaser och administration"
  },
  "related_occupations": [
    {
      "ssyk_code": "2512",
      "occupation_name": "Databasdesigner",
      "match_score": 0.89
    }
  ],
  "common_skills": [
    "SQL", "Databasadministration", "NoSQL"
  ]
}
```

**Kritiskt för TalentFlow**:
- "För att bli X behöver du utbildning Y"
- "Din utbildning (SUN-kod Z) kvalificerar dig för dessa yrken"

---

### **10. Datamängd: Kartläggning av Arbetsmarknadsutbildningar**

**Datamängd**: `dataset-mapping-of-labour-market-training`

**Vad det är**: AF:s egna arbetsmarknadsutbildningar (AMU) mappade till kompetenser

**Struktur**:
```json
{
  "module_name": "Agila metoder i praktiken",
  "module_id": "AMU-123",
  "learning_objectives": [
    "Tillämpa Scrum",
    "Facilitera retrospektiv",
    "Skapa user stories"
  ],
  "mapped_skills": [
    {"concept_id": "scrum_id", "term": "Scrum"},
    {"concept_id": "agile_id", "term": "Agila metoder"}
  ],
  "duration_hours": 40
}
```

**Kritiskt för CityIQ**:
- "Finansiera AMU-kurs X för att fylla kompetens Y"
- ROI-kalkyl per utbildningsmodul

---

## 🔗 How Everything Connects

### **The Knowledge Graph**:

```
┌─────────────┐
│   PERSON    │
└──────┬──────┘
       │
       │ has completed
       ▼
┌─────────────┐      mapped via JobEd Connect      ┌──────────────┐
│ UTBILDNING  │◄──────────────────────────────────►│    YRKE      │
│  (SUN-kod)  │                                     │  (SSYK-kod)  │
└─────────────┘                                     └──────┬───────┘
       │                                                   │
       │ teaches                                           │ requires
       ▼                                                   ▼
┌─────────────┐                                     ┌──────────────┐
│KOMPETENSER  │◄────────────────────────────────────│  KOMPETENS   │
│  (Skills)   │      extracted from job ads         │  REQUIREMENT │
└─────────────┘                                     └──────────────┘
                                                            │
                                                            │ in sector
                                                            ▼
                                                     ┌──────────────┐
                                                     │   BRANSCH    │
                                                     │  (SNI-kod)   │
                                                     └──────────────┘
```

### **Career Transition Example**:

```
USER: "Jag är Butikschef (SSYK 1420) inom Retail (SNI 47)"

STEP 1: Hämta skills för SSYK 1420
→ [Ledarskap, Budgetering, Personalansvar, Kundservice]

STEP 2: Hämta släktskap med hög likhet (75)
→ ["Verksamhetschef vård" (SSYK 1342), "Projektledare" (SSYK 2432)]

STEP 3: För varje match, beräkna skill gap
SSYK 1342 skills: [Ledarskap, Budgetering, Personalansvar, Vårdadministration]
→ Missing: [Vårdadministration]

STEP 4: Hitta utbildning som täcker missing skills
JobEd Connect: SUN-kod "853B" (Vårdadministration YH) 
→ Teaches: [Vårdadministration, Medicinskt begrepp]

STEP 5: Hämta löndata från JobSearch
SSYK 1420 median: 35,000 SEK/mån
SSYK 1342 median: 42,000 SEK/mån
→ Delta: +7,000 SEK/mån

STEP 6: Check Yrkesbarometer
SSYK 1342 prognos: "Ökad efterfrågan", Region: "Stockholm", Status: "Brist"

OUTPUT:
"Verksamhetschef inom vård: 85% skill-match, +7,000 SEK/mån, 
400 YH-timmar krävs, STARK efterfrågan i Stockholm"
```

---

## 📦 Complete Dataset Catalog

| Dataset | Format | Size Estimate | Update Frequency | Critical for |
|---------|--------|---------------|------------------|--------------|
| **SSYK hela hierarkin** | JSON/CSV | ~10k yrken | Kvartalsvis | TalentFlow, SkillHedge, CityIQ |
| **SNI hela hierarkin** | JSON/CSV | ~800 branscher | Årligen | Sector analysis |
| **SUN hela strukturen** | JSON/CSV | ~400 inriktningar | Årligen | Education pathways |
| **Kompetensbegrepp** | JSON/CSV | ~8k skills | Kvartalsvis | ALL produkter |
| **Släktskap mellan yrken** | JSON/CSV | ~50k relationer | Kvartalsvis | ⭐ TalentFlow |
| **Närliggande yrken** | JSON/CSV | ~100k relationer | Kvartalsvis | ⭐ TalentFlow |
| **Yrkesbarometer** | JSON/CSV | ~430 prognoser | 2x/år | ⭐ SkillHedge |
| **Relevanta kompetenser** | JSON/CSV | ~100k mappings | Kvartalsvis | TalentFlow |
| **ISCO mappings** | JSON/CSV | ~430 mappings | Årligen | Nordic expansion |
| **JobEd Connect** | API | Dynamic | Real-time | TalentFlow, CityIQ |
| **AMU-kartläggning** | JSON/CSV | ~500 moduler | Månatligen | CityIQ |
| **Chefsyrken** | JSON/CSV | ~200 yrken | Kvartalsvis | Filtering |
| **Körkort** | JSON/CSV | ~20 typer | Sällan | Requirements |
| **Språk** | JSON/CSV | ~150 språk | Sällan | Requirements |
| **Länder** | JSON/CSV | ~200 länder | Sällan | Geographic |
| **EU-regioner** | JSON/CSV | ~3000 regioner | Sällan | CityIQ |

---

## 🚀 Implementation Strategy

### **Phase 1: Bulk Download (This Week)**
```bash
python data_scraper/download_all_datasets.py
# → Downloads all 60+ datasets to /data/raw/
```

### **Phase 2: Parse & Structure (Week 2)**
```bash
python data_scraper/parse_and_normalize.py
# → Converts to unified schema in /data/processed/
```

### **Phase 3: Build Graph (Week 3)**
```bash
python data_scraper/build_neo4j_graph.py
# → Imports into Neo4j with all relationships
```

---

## 💾 Storage Requirements

| Data Type | Size | Location |
|-----------|------|----------|
| Raw datasets (JSON/CSV) | ~500 MB | `/data/raw/` |
| Processed/normalized | ~300 MB | `/data/processed/` |
| Neo4j graph database | ~2 GB | Neo4j instance |
| Vector embeddings | ~1 GB | Pinecone |

**Total**: ~4 GB

---

## ✅ Next Steps

1. **Run scraper** to download all datasets
2. **Analyze schema** of each dataset
3. **Design unified data model**
4. **Build ETL pipeline** to Neo4j
5. **Create API layer** on top of graph

---

**Detta dokument uppdateras kontinuerligt när vi lär oss mer om datastrukturen.**
