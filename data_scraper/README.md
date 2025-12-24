# Data Scraper - Arbetsförmedlingen Open Data

Denna mapp innehåller verktyg för att ladda ner och processa ALLA datasets från Arbetsförmedlingens öppna data.

---

## 📁 Struktur

```
data_scraper/
├── download_all_datasets.py    # Main scraper (laddar ner alla datasets)
├── parse_and_normalize.py      # (coming soon) Normaliserar data
├── build_neo4j_graph.py         # (coming soon) Bygger graph database
└── requirements.txt             # Python dependencies
```

---

## 🚀 Quick Start

### 1. Installera dependencies

```bash
cd data_scraper
pip3 install -r requirements.txt
```

### 2. Ladda ner alla datasets

```bash
python3 download_all_datasets.py
```

Detta kommer:
- ✅ Ladda ner 60+ datasets från AF:s API:er
- ✅ Spara dem i `/data/raw/` organiserat per kategori
- ✅ Generera metadata om nedladdningen

**Tid**: ~5-10 minuter (beroende på internet)  
**Storlek**: ~500 MB

---

## 📊 Vad laddas ner?

### **Kategorier**:

1. **SSYK** - Yrkesklassificering (430 yrken)
2. **SNI** - Branschklassificering (800 branscher)
3. **SUN** - Utbildningsklassificering (400 inriktningar)
4. **Skills** - Kompetenser (8,000 skills)
5. **⭐ Relationships** - KRITISKA datasets:
   - Släktskap mellan yrken (career transitions!)
   - Närliggande yrken (AI-computed similarities)
   - Relevanta skills per yrke
6. **⭐ Forecasts** - Yrkesbarometer (5-års prognoser!)
7. **Education** - SUN-struktur (alla nivåer)
8. **Geographic** - EU-regioner, länder
9. **Requirements** - Körkort, språk, etc.

---

## 📂 Output Struktur

Efter nedladdning:

```
data/
├── raw/                          # Original JSON/CSV data
│   ├── ssyk/
│   │   ├── ssyk-level-1.json
│   │   ├── ssyk-level-2.json
│   │   ├── ssyk-level-3.json
│   │   └── ssyk-level-4.json
│   ├── sni/
│   ├── skills/
│   ├── relationships/           # ⭐ GULD!
│   │   ├── occupation-substitutability.json
│   │   ├── related-occupations.json
│   │   └── relevant-skills-for-occupations.json
│   ├── forecasts/               # ⭐ GULD!
│   │   └── yrkesbarometer.json
│   └── ...
├── processed/                    # (coming soon) Normalized data
└── download_metadata.json        # Nedladdnings-info
```

---

## 🔍 Exempel: Inspektera Data

### SSYK Level 4 (alla yrken):

```bash
cat data/raw/ssyk/ssyk-level-4.json | jq '.[0]'
```

Output:
```json
{
  "concept_id": "apaJ_2ja_LuF",
  "preferred_term": "Mjukvaruutvecklare",
  "ssyk_code_2012": "2513",
  "definition": "Utvecklar och underhåller mjukvara..."
}
```

### ⭐ Släktskap mellan yrken:

```bash
cat data/raw/relationships/occupation-substitutability.json | jq '.[0]'
```

Output:
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
  "substitutability_level": 75
}
```

**Detta är EXAKT vad vi behöver för TalentFlow!**

---

## ⚠️ Important Notes

### API Limits

Arbetsförmedlingens APIs har vissa rate limits:
- Taxonomy API: 1000 requests/hour
- JobSearch API: 100 requests/minute

**Vår scraper är "snäll"**:
- 0.5 sekunders delay mellan requests
- Totalt ~60 requests för alla datasets
- Tar ~30 sekunder

### Data Freshness

Olika datasets uppdateras olika ofta:
- **SSYK/SNI/SUN**: Årligen eller kvartalsvis
- **Släktskap/Närliggande yrken**: Kvartalsvis
- **Yrkesbarometer**: 2 gånger/år (vår + höst)
- **Skills**: Kontinuerligt

**Rekommendation**: Kör scraper 1 gång/månad för fresh data.

---

## 🔧 Troubleshooting

### "Connection timeout"

```bash
# Försök igen, ibland är API:et långsamt
python3 download_all_datasets.py
```

### "Permission denied"

```bash
# Skapa data-mappen manuellt
mkdir -p ../data/raw
python3 download_all_datasets.py
```

### Vissa datasets failar

Detta är OK! Inte alla datasets kanske finns tillgängliga via API:et än.  
Scrapers är byggd för att fortsätta även om några misslyckas.

---

## 📝 Next Steps

Efter nedladdning:

### 1. Analysera schemat

```bash
python3 analyze_schema.py  # (coming soon)
```

### 2. Normalisera datan

```bash
python3 parse_and_normalize.py  # (coming soon)
```

### 3. Bygg graph database

```bash
python3 build_neo4j_graph.py  # (coming soon)
```

---

## 🤝 Contributing

Om du hittar datasets vi missat eller bättre API endpoints:

1. Uppdatera `DATASETS` dictionary i `download_all_datasets.py`
2. Kör `python3 download_all_datasets.py`
3. Verifiera att datan ser rätt ut

---

## 📚 Documentation

För komplett info om datastrukturen, se:
- `/docs/data_structure/COMPLETE_GUIDE.md`
- `/docs/API_RESEARCH.md`

---

**Happy scraping!** 🕷️
