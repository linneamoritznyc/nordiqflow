# Supabase vs Neo4j — Varför NordiqFlow väljer Supabase

**Datum:** 20 februari 2026
**Författare:** Linnea Moritz
**Status:** Beslut fattat — Supabase (PostgreSQL) som primär databas

---

## Sammanfattning

NordiqFlow:s tekniska arkitektur har hittills planerats kring Neo4j som grafdatabas för karriärövergångsdata (51 000+ substitutability-relationer, 8 000+ kompetenser, 430 SSYK-koder). Efter utvärdering av projektets faktiska fas, datavolym, teamresurser och tidsplan är beslutet att **bygga hela MVP:n på Supabase (PostgreSQL)** och skjuta upp en eventuell Neo4j-migration till en framtida skalningsfas.

Detta dokument dokumenterar resonemanget, den tekniska analysen, och migreringsplanen.

---

## 1. Bakgrund — Vad som planerades

Projektets tekniska dokumentation (`tech.html`, `next-steps.html`, `algoritmen.html`) beskriver en arkitektur med:

| Komponent | Planerad teknologi |
|---|---|
| Grafdatabas | Neo4j (AuraDB) |
| Vektordatabas | Pinecone eller Weaviate |
| Tidsseriedata | ClickHouse eller TimescaleDB |
| Backend API | Python FastAPI |
| Frontend | Next.js 15 + TypeScript + Tailwind |
| Autentisering | Supabase Auth |
| Hosting | Vercel |

Karriärövergångsmodellen definieras i Cypher:

```cypher
(butikschef:Occupation {id: 'SSYK_5221'})
    -[:CAN_TRANSITION {strength: 85}]->
(verksamhetsledare:Occupation {id: 'SSYK_1312'})
```

Algoritmen specificerar BFS-traversering med komplexitet O(V + E) där V = ~10 000 yrken och E = ~51 000 relationer.

---

## 2. Varför Neo4j var det logiska valet — i teorin

Karriärövergångar *är* en grafproblem. Det kan inte förnekas. Datans struktur — yrken som noder, substituerbarhet som kanter med vikter, kompetenser som delade egenskaper — mappas naturligt till en property graph-modell.

**Neo4j:s styrkor för NordiqFlow:**

- **Native graftraversering**: BFS/DFS utan rekursiva CTEs
- **Cypher-queryspråk**: Intuitivt för att uttrycka mönster som "hitta alla yrken inom 2 hopp med substituerbarhet > 50"
- **Prestandaoptimering för traversering**: Index-free adjacency ger O(1) per hopp
- **Visualiseringsverktyg**: Neo4j Browser gör det enkelt att utforska grafstrukturer

**Den teoretiska frågan var aldrig om Neo4j kan göra det — utan om vi behöver det.**

---

## 3. Varför Supabase är rätt val — i praktiken

### 3.1 Datavolymen är liten

Det här är den viktigaste insikten. NordiqFlow:s grafdata är:

| Dataset | Storlek |
|---|---|
| Yrken (SSYK-4) | ~430 noder |
| Yrken (alla nivåer) | ~10 000 noder |
| Substitutability-relationer | ~51 000 kanter |
| Kompetenser | ~8 000 noder |
| Yrke-kompetens-kopplingar | ~50 000 kanter |

**Totalt: ~120 000 rader.** Det är ingenting för PostgreSQL. En modern Postgres-instans kan hantera JOIN-operationer på denna skala i <10 ms. Neo4j:s prestandafördel för graftraversering — index-free adjacency — blir märkbar först vid miljoner noder och kanter. Vid 120 000 rader märks ingen skillnad.

### 3.2 Rekursiva CTE:er löser multi-hop-problemet

Den vanligaste invändningen mot SQL för grafproblem: "men du kan inte göra multi-hop traversering effektivt." Det stämmer — i allmänhet. Men för NordiqFlow:s specifika fall:

**Karriärvägar kräver max 2–3 hopp.** En butikschef → verksamhetsledare (1 hopp) eller butikschef → logistikchef → supply chain manager (2 hopp) täcker 95%+ av relevanta karriärvägar. Ingen användare behöver en karriärväg med 5 hopp.

PostgreSQL:s `WITH RECURSIVE` hanterar detta:

```sql
-- Hitta alla karriärvägar inom 2 hopp från ett yrke
WITH RECURSIVE career_paths AS (
    -- Steg 1: Direkta övergångar (1 hopp)
    SELECT
        from_occupation_id,
        to_occupation_id,
        score,
        1 AS hops,
        ARRAY[from_occupation_id, to_occupation_id] AS path
    FROM af_substitutability
    WHERE from_occupation_id = 'SSYK_5221'  -- butikschef
      AND score >= 50

    UNION ALL

    -- Steg 2: Indirekta övergångar (2 hopp)
    SELECT
        cp.from_occupation_id,
        s.to_occupation_id,
        LEAST(cp.score, s.score) AS score,  -- flaskhalsprincipen
        cp.hops + 1,
        cp.path || s.to_occupation_id
    FROM career_paths cp
    JOIN af_substitutability s ON s.from_occupation_id = cp.to_occupation_id
    WHERE cp.hops < 2
      AND s.score >= 50
      AND s.to_occupation_id != ALL(cp.path)  -- undvik cykler
)
SELECT DISTINCT ON (to_occupation_id)
    to_occupation_id,
    o.name,
    score,
    hops,
    path
FROM career_paths
JOIN af_occupations o ON o.id = to_occupation_id
ORDER BY to_occupation_id, score DESC;
```

Denna query returnerar alla nåbara karriärvägar inom 2 hopp, med flaskhalsbaserad scoring, cykeldetektering, och sorterade resultat — på <50 ms för 51 000 kanter.

**Samma query i Cypher:**

```cypher
MATCH path = (start:Occupation {id: 'SSYK_5221'})-[:CAN_TRANSITION*1..2]->(target:Occupation)
WHERE ALL(r IN relationships(path) WHERE r.strength >= 50)
RETURN target.name,
       reduce(s = 100, r IN relationships(path) | CASE WHEN r.strength < s THEN r.strength ELSE s END) AS score,
       length(path) AS hops
ORDER BY score DESC
```

Cypher-versionen är kortare och mer läsbar — men prestandan är identisk vid denna dataskala.

### 3.3 En teknikstack istället för fyra

Den planerade arkitekturen kräver:

| Planerad stack | Antal system att drifta |
|---|---|
| Neo4j (grafdatabas) | 1 separat server/tjänst |
| PostgreSQL via Supabase (users, jobs, applications) | 1 |
| FastAPI (Python backend) | 1 separat backend-server |
| Pinecone/Weaviate (vektorsök) | 1 separat tjänst |
| **Totalt** | **4 separata system** |

Med Supabase som ensam databas:

| Supabase-stack | Antal system att drifta |
|---|---|
| Supabase (PostgreSQL + Auth + REST API + pgvector) | 1 |
| **Totalt** | **1 system** |

Förklaring:

- **Grafdata** → PostgreSQL-tabeller med rekursiva CTE:er (se ovan)
- **Autentisering** → Supabase Auth (redan planerat)
- **REST API** → Supabase auto-genererar REST API från tabeller — ingen FastAPI-backend behövs för CRUD
- **Vektorsök** → PostgreSQL:s `pgvector`-extension (inbyggt i Supabase) ersätter Pinecone/Weaviate för semantic search av kompetenser
- **RLS (Row Level Security)** → GDPR-compliance inbyggt — användare kan bara se sin egen data

### 3.4 Teamet kan SQL, inte Cypher

NordiqFlow:s team (och framtida rekryteringar) kan SQL. Cypher kräver:

- Lära sig ett nytt query-språk
- Förstå Neo4j:s transaktionsmodell (annorlunda än ACID i PostgreSQL)
- Debugga med Neo4j Browser istället för verktygen teamet redan kan (pgAdmin, Supabase Dashboard, DataGrip)
- Hantera Neo4j-specifika problem (minneshantering, index-konfiguration, heap-inställningar)

RCT-forskarna (IFAU, universitetspartners) förstår SQL och kan köra analyser direkt mot databasen. Cypher är en barriär.

### 3.5 Kostnadsanalys

| | Neo4j AuraDB | Supabase |
|---|---|---|
| Free tier | 200 000 noder, 400 000 kanter | 500 MB databas, 50 000 monthly active users |
| Produktion (NordiqFlow skala) | ~$65/mån (AuraDB Professional) | ~$25/mån (Supabase Pro) |
| Skalningskostnad vid 10 000 användare | ~$200/mån + separat Supabase-kostnad | ~$75/mån (allt inkluderat) |
| Backup, monitoring | Extra konfiguration | Inbyggt |
| Auth | Saknas — kräver separat lösning | Inbyggt (Supabase Auth) |
| REST API | Saknas — kräver FastAPI/Express | Auto-genererat |

**Total infrastrukturkostnad per månad:**

- Planerad stack (Neo4j + Supabase + FastAPI-hosting + Pinecone): **~$250–400/mån**
- Supabase-only stack: **~$25–75/mån**

Skillnad: **~$175–325/mån** eller **~$2 100–3 900/år** — inte enormt, men signifikant för en startup i seed-fas.

### 3.6 Schemat finns redan

`docs/DATABASE_SCHEMA.sql` definierar redan hela NordiqFlow:s datamodell i PostgreSQL. Tabellen `af_substitutability` med kolumnerna `from_occupation_id`, `to_occupation_id`, `score`, och `direction` modellerar exakt samma grafrelationer som Neo4j:s `CAN_TRANSITION`-edge — bara som en junction table istället för en explicit kant.

Allt yrke-, kompetens-, och användardata är redan strukturerat för Supabase. Neo4j skulle kräva en parallell datamodell och synkronisering mellan två databaser.

---

## 4. Vad vi förlorar

Ärlighet kräver att vi dokumenterar nackdelarna:

### 4.1 Query-ergonomi för komplexa grafmönster

Cypher är objektivt mer läsbart för frågor som:

> "Hitta alla yrken som delar minst 3 kompetenser med mitt nuvarande yrke, och som har en substituerbarhetsscore > 50, och där minst ett av dessa yrken har hög efterfrågan i min region"

I Cypher: 5 rader. I SQL: 15–20 rader med subqueries och JOINs.

**Mitigation:** Vi kan abstrahera dessa queries i PostgreSQL-funktioner (`CREATE FUNCTION find_career_paths(...)`) och anropa dem via Supabase RPC. Slutanvändaren och frontend-koden ser aldrig den underliggande SQL-komplexiteten.

### 4.2 Traverseringsdjup > 3 hopp

Om vi i framtiden vill göra djupa grafanalyser (5+ hopp, community detection, PageRank-baserad ranking) blir rekursiva CTE:er i PostgreSQL opraktiska.

**Mitigation:** Det är ett framtida problem. Om vi når 100 000+ yrken eller behöver 5+-hopp-traversering kan vi lägga till Neo4j som en *analytisk* komponent vid sidan av Supabase — inte som ersättning.

### 4.3 Visuell grafutforskning

Neo4j Browser ger en fantastisk visuell upplevelse för att utforska grafdata interaktivt. Supabase Dashboard visar tabeller.

**Mitigation:** Vi kan bygga en egen grafvisualisering i frontend med D3.js eller vis-network (redan ett potentiellt feature i TalentFlow). Alternativt kan vi använda Apache AGE — en PostgreSQL-extension som lägger till Cypher-stöd ovanpå Postgres.

---

## 5. PostgreSQL-specifika optimeringar

### 5.1 Materialized Views för förberäknade karriärvägar

Eftersom substitutability-data uppdateras sällan (AF uppdaterar taxonomin kvartalsvis), kan vi förberäkna vanliga karriärvägar:

```sql
CREATE MATERIALIZED VIEW career_transitions_2hop AS
WITH RECURSIVE paths AS (
    SELECT
        s1.from_occupation_id AS origin,
        s1.to_occupation_id AS destination,
        s1.score AS min_score,
        1 AS hops
    FROM af_substitutability s1
    WHERE s1.score >= 25

    UNION ALL

    SELECT
        p.origin,
        s2.to_occupation_id,
        LEAST(p.min_score, s2.score),
        p.hops + 1
    FROM paths p
    JOIN af_substitutability s2 ON s2.from_occupation_id = p.destination
    WHERE p.hops < 2
      AND s2.score >= 25
      AND s2.to_occupation_id != p.origin
)
SELECT DISTINCT ON (origin, destination)
    origin,
    destination,
    min_score,
    hops
FROM paths
ORDER BY origin, destination, min_score DESC;

-- Refresha kvartalsvis när AF uppdaterar taxonomin
-- REFRESH MATERIALIZED VIEW CONCURRENTLY career_transitions_2hop;
```

Denna materialized view förberäknar alla karriärvägar inom 2 hopp. Frågor mot den är O(1) — snabbare än Neo4j.

### 5.2 pgvector för semantisk kompetensmatching

Istället för Pinecone/Weaviate:

```sql
-- Aktivera pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Lägg till embedding-kolumn på kompetenser
ALTER TABLE af_skills ADD COLUMN embedding vector(1536);

-- Semantisk sökning: hitta kompetenser som liknar en fritext-input
SELECT name, 1 - (embedding <=> $1::vector) AS similarity
FROM af_skills
WHERE 1 - (embedding <=> $1::vector) > 0.7
ORDER BY embedding <=> $1::vector
LIMIT 20;
```

Embeddings genereras via Anthropic Claude eller OpenAI Embeddings API och lagras direkt i Supabase. Ingen separat vektordatabas behövs.

### 5.3 PostgreSQL-funktioner som API

Istället för FastAPI-endpoints:

```sql
-- Supabase RPC-funktion: hitta karriärvägar för en användare
CREATE OR REPLACE FUNCTION get_career_paths(
    p_occupation_id TEXT,
    p_min_score INTEGER DEFAULT 50,
    p_max_hops INTEGER DEFAULT 2,
    p_region_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    occupation_id TEXT,
    occupation_name TEXT,
    score INTEGER,
    hops INTEGER,
    demand_level INTEGER,
    skills_overlap NUMERIC
)
LANGUAGE sql STABLE
AS $$
    SELECT
        ct.destination AS occupation_id,
        o.name AS occupation_name,
        ct.min_score AS score,
        ct.hops,
        df.demand_level,
        (
            SELECT COUNT(*)::NUMERIC / NULLIF(total.cnt, 0)
            FROM af_occupation_skills os1
            JOIN af_occupation_skills os2 ON os1.skill_id = os2.skill_id
            CROSS JOIN (
                SELECT COUNT(*) AS cnt
                FROM af_occupation_skills
                WHERE occupation_id = ct.destination
            ) total
            WHERE os1.occupation_id = p_occupation_id
              AND os2.occupation_id = ct.destination
        ) AS skills_overlap
    FROM career_transitions_2hop ct
    JOIN af_occupations o ON o.id = ct.destination
    LEFT JOIN af_demand_forecast df
        ON df.occupation_id = ct.destination
        AND df.region_id = COALESCE(p_region_id, df.region_id)
        AND df.year = EXTRACT(YEAR FROM now())
    WHERE ct.origin = p_occupation_id
      AND ct.min_score >= p_min_score
      AND ct.hops <= p_max_hops
    ORDER BY ct.min_score DESC, df.demand_level DESC NULLS LAST;
$$;
```

Anropas från Next.js frontend:

```typescript
const { data: careerPaths } = await supabase
  .rpc('get_career_paths', {
    p_occupation_id: 'SSYK_5221',
    p_min_score: 50,
    p_max_hops: 2,
    p_region_id: user.regionId
  });
```

Ingen separat backend-server krävs.

---

## 6. Migreringsplan — Om vi behöver Neo4j i framtiden

**Trigger:** Om NordiqFlow når en punkt där:
- Datavolymen överstiger 1 miljon noder/kanter (t.ex. vid nordisk expansion med norsk, dansk, finsk data)
- Karriärvägsanalyser kräver 4+ hopp regelbundet
- Community detection eller PageRank-baserad ranking behövs
- Query-latency på rekursiva CTE:er överstiger 500 ms

**Migreringsväg:**

1. Exportera `af_occupations`, `af_skills`, `af_substitutability`, `af_occupation_skills` till Neo4j
2. Neo4j blir en **read-only analysdatabas** — inte primär databas
3. Supabase förblir primär för users, jobs, applications, auth, RLS
4. Synkronisering via Supabase Database Webhooks → Neo4j vid taxonomi-uppdateringar
5. Next.js API routes anropar Neo4j för grafspecifika queries, Supabase för allt annat

**Uppskattad migreringsinsats:** 2–3 utvecklarveckor. Inte ett akut behov.

---

## 7. Beslut och konsekvenser

### Beslut

**NordiqFlow bygger hela MVP:n och v1.0 på Supabase (PostgreSQL).** Neo4j läggs som en framtida skalningspost, inte en lanserings-dependency.

### Konsekvenser för existerande dokumentation

Följande dokument behöver uppdateras för att reflektera beslutet:

| Dokument | Ändring |
|---|---|
| `tech.html` | Ersätt Neo4j-referenser med Supabase/PostgreSQL. Uppdatera arkitekturdiagram. |
| `next-steps.html` | Ta bort steg 3 (Install Neo4j) och steg 4 (Import to Neo4j). Ersätt med Supabase-setup. |
| `algoritmen.html` | Behåll algoritmspecifikationen men lägg till SQL-implementation vid sidan av Cypher. |
| `docs/MATCHING_ALGORITHM.md` | Uppdatera med PostgreSQL-funktioner istället för Cypher-queries. |
| `docs/DATABASE_SCHEMA.sql` | Redan korrekt — schemat är redan PostgreSQL. Lägg till materialized views och RPC-funktioner. |
| `README.md` | Uppdatera tech stack-sektionen. |

### Tidsvinst

| Utan Neo4j | Med Neo4j |
|---|---|
| Supabase-setup: 1 dag | Neo4j-setup: 1 dag |
| Dataimpact: 1 dag (SQL INSERT) | Dataimport: 3–4 dagar (Python-script + Cypher) |
| API: 0 dagar (Supabase auto-API) | FastAPI-backend: 5–7 dagar |
| Vektorsök: pgvector, 1 dag | Pinecone-setup: 2–3 dagar |
| **Total: ~3 dagar** | **Total: ~12–15 dagar** |

**Tidsbesparing: ~10–12 utvecklardagar** — mer än en hel sprint.

---

## 8. Slutsats

Neo4j är en utmärkt grafdatabas. För ett projekt med miljontals noder och djupa traverseringar (sociala nätverk, kunskapsgrafer, fraud detection) är det rätt val. Men NordiqFlow har:

- **120 000 rader** — inte 120 miljoner
- **Max 2–3 hopp** — inte 10+
- **En utvecklare i early stage** — inte ett dedikerat infrastrukturteam
- **En befintlig Supabase-stack** — att lägga till en annan databas skapar komplexitet utan proportionellt värde

PostgreSQL med rekursiva CTE:er, materialized views, pgvector och Supabase:s inbyggda Auth/API täcker 100 % av NordiqFlow:s behov för MVP, v1.0, och troligtvis långt bortom det.

Bygg produkten. Bevisa matchningseffekten. Optimera infrastrukturen när du har det lyxproblemet att data inte får plats i Postgres.

---

*Dokumentet upprättat 20 februari 2026 av Linnea Moritz, NordiqFlow.*
