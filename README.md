# NordiqFlow - Sveriges Arbetsmarknads-OS

> **En unified intelligence platform** som kombinerar Sveriges kompletta arbetsmarknadsdata (Arbetsförmedlingens Open Data) till tre produkter: TalentFlow (B2C), SkillHedge (FinTech), och CityIQ (GovTech).

---

## 🎯 Vision

Dagens rekryteringssajter är enkla sökmotorer. NordiqFlow är en **semantisk graf över hela den svenska arbetsmarknaden** som möjliggör:

- **För individer**: AI-drivna karriärövergångar baserade på faktiska skill-överlappar
- **För investerare**: Handelbara index på kompetensutbud/-efterfrågan  
- **För kommuner**: Exakt talangbristanalys kopplad till utbildningspipeline

---

## 🏗️ Arkitektur

```
┌─────────────────────────────────────────────────────┐
│          ARBETSFÖRMEDLINGENS DATAKATALOG            │
│                                                      │
│  • Taxonomy (60+ datasets, SSYK/SNI/SUN)           │
│  • JobSearch (real-time job ads)                    │
│  • Enrichments (NLP skill extraction)               │
│  • Historical Data (10+ years trends)               │
└──────────────────┬──────────────────────────────────┘
                   │
            ┌──────▼─────┐
            │  GRAPH DB  │  Neo4j + Vector Store
            │   ENGINE   │  (Unified Intelligence Layer)
            └──────┬─────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
    ┌───▼───┐  ┌──▼───┐  ┌──▼────┐
    │Talent │  │Skill │  │ City  │
    │ Flow  │  │Hedge │  │  IQ   │
    │       │  │      │  │       │
    │ B2C   │  │ B2B  │  │ B2G   │
    └───────┘  └──────┘  └───────┘
```

---

## 📦 Produkter

### 1️⃣ TalentFlow (B2C SaaS)
**Problem**: Personer vet inte hur deras skills överförs till andra yrken.

**Lösning**: AI-driven karriärplanering
- Input: "Jag är Butikschef inom Retail"
- Output: "Du kan bli Verksamhetschef inom Vård med 85% skill-match. Saknade skills: Vårdadministration (400 YH-timmar). Löneökning: +7k SEK/månad"

**Pris**: 299 SEK/månad (freemium model)

---

### 2️⃣ SkillHedge (FinTech Platform)
**Problem**: Företag och investerare kan inte hedga mot talangbrist.

**Lösning**: Handelbara arbetsmarknadsindex
- "Nordic Cloud Engineer Index" (demand/supply ratio för SSYK 2512 + Kubernetes/AWS/Azure)
- Företag kan köpa derivat: Om brist fördjupas → utbetalning för att täcka högre löner

**Pris**: 
- Index data feed: 50k SEK/år
- Derivative trading: 500k SEK/år + 0.3% transaction fee

---

### 3️⃣ CityIQ (GovTech Dashboard)
**Problem**: Kommuner vet inte vilka kompetenser som saknas eller vilka utbildningar som ger ROI.

**Lösning**: Real-time talangbristanalys
- "Uppsala har 200 öppna Dev-jobs men bara 50 utexaminerade/år"
- "Finansiera en Cybersecurity YH (5M SEK/år) → Fyll 80 jobb → 3.2M SEK i kommunalskatt → ROI på 18 månader"

**Pris**: 50-200k SEK/år beroende på kommunstorlek

---

## 🔑 Konkurrensfördel

1. **Datamoat**: Ingen annan har byggt en unified graph över AF:s 60+ datasets
2. **Nätverkseffekter**: Fler TalentFlow-användare → bättre SkillHedge-index → mer värde för CityIQ
3. **Regulatory capture**: Position oss som "infrastruktur" för statlig arbetsmarknadspolitik
4. **First-mover**: 10+ års historisk data → AI-modeller som konkurrenter inte kan replikera

---

## 📊 Business Model

| Product | Target | ARR Potential (Year 2) |
|---------|--------|------------------------|
| TalentFlow | 1,000 users @ 299 SEK/mo | 3.6M SEK |
| SkillHedge | 5 institutions @ 1M SEK/yr | 5M SEK |
| CityIQ | 30 municipalities @ 100k/yr | 3M SEK |
| **TOTAL** | | **11.6M SEK** |

Exit multiples: 15-20x ARR för platform plays med network effects = **150-230M SEK valuation**.

---

## 🚀 Roadmap

### Phase 1: Foundation (Månader 1-4)
- [ ] Ingest full Taxonomy graph till Neo4j
- [ ] Real-time JobSearch stream integration
- [ ] Build core API: `/transitions`, `/skill-index`, `/talent-gaps`
- [ ] Train ML models (salary prediction, demand forecasting)

### Phase 2: MVP Launch (Månader 5-8)
- [ ] TalentFlow web app (React)
- [ ] CityIQ pilot med 3 kommuner
- [ ] SkillHedge index data feed (Excel export)
- [ ] **Goal**: 400k SEK ARR

### Phase 3: Scale (Månader 9-18)
- [ ] TalentFlow mobile app + LinkedIn integration
- [ ] SkillHedge trading platform
- [ ] CityIQ expansion till 50 kommuner
- [ ] **Goal**: 11M SEK ARR

### Phase 4: Nordisk expansion (År 2-3)
- [ ] Norge (NAV APIs)
- [ ] Danmark (Jobindex)
- [ ] Finland (TE-palvelut)
- [ ] **Goal**: 40M SEK ARR

---

## 🛠️ Tech Stack

**Backend**:
- Neo4j (graph database)
- Pinecone/Weaviate (vector store för semantic search)
- ClickHouse/TimescaleDB (time-series data)
- Python/FastAPI

**Frontend**:
- React/Next.js (TalentFlow, CityIQ dashboards)
- Vercel (hosting)

**Data Sources**:
- Arbetsförmedlingens Open Data APIs (se `/docs/API_RESEARCH.md`)

---

## 📁 Repository Structure

```
nordiqflow/
├── README.md                    # This file
├── docs/
│   ├── API_RESEARCH.md         # AF API documentation deep dive
│   └── data_structure/
│       └── COMPLETE_GUIDE.md   # Complete data structure guide
├── scripts/
│   ├── test_apis.py            # API connectivity testing
│   └── requirements.txt        # Python dependencies
├── data_scraper/
│   ├── download_all_datasets.py # Download all AF datasets
│   ├── README.md               # Scraper documentation
│   └── requirements.txt        # Scraper dependencies
├── index.html                  # Landing page
└── vercel.json                 # Deployment config
```

---

## 🚦 Getting Started

### 1. Test AF APIs
```bash
cd scripts
pip install -r requirements.txt
python test_apis.py
```

### 2. Download All Datasets (NEW!)
```bash
cd data_scraper
pip install -r requirements.txt
python download_all_datasets.py
```

This will download 60+ datasets including:
- ⭐ **Släktskap mellan yrken** (pre-computed career transitions!)
- ⭐ **Yrkesbarometer** (5-year demand forecasts!)
- Complete SSYK, SNI, SUN taxonomies
- 8,000+ skill concepts

**See `/data_scraper/README.md` for full documentation.**

### 3. View Landing Page Locally
```bash
open index.html  # Mac
# or just double-click index.html
```

### 4. Deploy to Vercel
```bash
vercel
```

---

## 📞 Contact

**Linnea Moritz**  
- Portfolio: [linneamoritz.com](https://linneamoritz.com)
- GitHub: [@linneamoritznyc](https://github.com/linneamoritznyc)

---

## 📄 License

MIT
