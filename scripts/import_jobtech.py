"""
NordiqFlow — JobTech Dev → Supabase Import Script
==================================================
Imports ALL taxonomy data from AF's open APIs into Supabase.
Usage:
    pip install supabase httpx tqdm

    Set environment variables:
        SUPABASE_URL=https://your-project.supabase.co
        SUPABASE_SERVICE_KEY=your-service-role-key  (NOT the anon key)

    Then run:
        python import_jobtech.py

    Or run a single step:
        python import_jobtech.py --step occupations
        python import_jobtech.py --step skills
        python import_jobtech.py --step substitutability
        python import_jobtech.py --step occupation_skills
        python import_jobtech.py --step all   (default)
"""
import os
import json
import httpx
import argparse
from datetime import datetime
from tqdm import tqdm
from supabase import create_client, Client
# ── CONFIG ────────────────────────────────────────────────────────────────────
SUPABASE_URL         = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
# JobTech Dev API base
JOBTECHDEV_BASE = "https://taxonomy.api.jobtechdev.se/v1/taxonomy"
# JobTech Dev static file downloads (CC0 licence)
STATIC_FILES = {
    "substitutability": (
        "https://taxonomy.api.jobtechdev.se/v1/taxonomy/specific/relations"
        "/substitutability-relations-between-occupations"
    ),
    "occupation_skill_relations": (
        "https://taxonomy.api.jobtechdev.se/v1/taxonomy/specific/relations"
        "/occupation-skill-relations"
    ),
}
# Batch size for Supabase upserts (keep under 1000 to stay within limits)
BATCH_SIZE = 500
# ── HELPERS ───────────────────────────────────────────────────────────────────
def get_supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise EnvironmentError(
            "Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.\n"
            "Use the SERVICE ROLE key (not anon) — needed to bypass RLS for imports."
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
def batch_upsert(supabase: Client, table: str, rows: list, conflict_cols: str = None):
    """Upsert rows in batches, with progress bar."""
    if not rows:
        print(f"  ⚠  No rows to insert for {table}")
        return
    total = len(rows)
    inserted = 0
    errors = 0
    for i in tqdm(range(0, total, BATCH_SIZE), desc=f"  → {table}", unit="batch"):
        batch = rows[i : i + BATCH_SIZE]
        try:
            query = supabase.table(table).upsert(batch)
            if conflict_cols:
                query = query.on_conflict(conflict_cols)
            query.execute()
            inserted += len(batch)
        except Exception as e:
            errors += len(batch)
            print(f"\n  ✗ Batch {i//BATCH_SIZE + 1} failed: {e}")
    print(f"  ✓ {inserted:,} rows upserted into {table}"
          + (f" ({errors:,} errors)" if errors else ""))
    return inserted
def fetch_api(url: str, params: dict = None) -> dict:
    """Fetch from JobTech Dev API with error handling."""
    headers = {"Accept": "application/json"}
    try:
        r = httpx.get(url, params=params, headers=headers, timeout=30)
        r.raise_for_status()
        return r.json()
    except httpx.HTTPError as e:
        print(f"  ✗ HTTP error fetching {url}: {e}")
        raise
def log_sync(supabase: Client, source: str, status: str,
             records: int = 0, error: str = None):
    supabase.table("data_sync_log").insert({
        "source": source,
        "status": status,
        "records_updated": records,
        "finished_at": datetime.utcnow().isoformat(),
        "error_msg": error,
    }).execute()
# ── STEP 1: OCCUPATIONS ───────────────────────────────────────────────────────
def import_occupations(supabase: Client):
    print("\n[1/4] Importing occupations (SSYK-4)...")
    # Fetch all SSYK-4 occupations from taxonomy API
    url = f"{JOBTECHDEV_BASE}/concepts"
    params = {"type": "occupation-name", "offset": 0, "limit": 1000}
    all_concepts = []
    while True:
        data = fetch_api(url, params)
        concepts = data.get("concept_list", [])
        if not concepts:
            break
        all_concepts.extend(concepts)
        params["offset"] += len(concepts)
        if len(concepts) < params["limit"]:
            break
    print(f"  Fetched {len(all_concepts):,} occupation concepts from API")
    rows = []
    for c in all_concepts:
        # Extract SSYK code from preferred label or external standard
        ssyk = None
        for std in c.get("external_standard_code", []):
            if std.get("standard_name") == "SSYK 2012":
                ssyk = std.get("code")
                break
        rows.append({
            "id":       c["concept_id"],
            "name_sv":  c.get("preferred_label", ""),
            "name_en":  c.get("preferred_label_en"),
            "ssyk_code": ssyk,
            "ssyk_level_1": ssyk[0]   if ssyk and len(ssyk) >= 1 else None,
            "ssyk_level_2": ssyk[:2]  if ssyk and len(ssyk) >= 2 else None,
            "ssyk_level_3": ssyk[:3]  if ssyk and len(ssyk) >= 3 else None,
        })
    count = batch_upsert(supabase, "occupations", rows)
    log_sync(supabase, "taxonomy_api_occupations", "success", count)
# ── STEP 2: SKILLS ────────────────────────────────────────────────────────────
def import_skills(supabase: Client):
    print("\n[2/4] Importing skills...")
    url = f"{JOBTECHDEV_BASE}/concepts"
    skill_types = [
        ("skill", "competency"),
        ("skill", "knowledge"),
        ("skill", "skill"),
    ]
    # JobTech groups skills under "competency" type
    params = {"type": "competency", "offset": 0, "limit": 1000}
    all_skills = []
    while True:
        data = fetch_api(url, params)
        concepts = data.get("concept_list", [])
        if not concepts:
            break
        all_skills.extend(concepts)
        params["offset"] += len(concepts)
        if len(concepts) < params["limit"]:
            break
    print(f"  Fetched {len(all_skills):,} skill concepts from API")
    rows = []
    for s in all_skills:
        rows.append({
            "id":       s["concept_id"],
            "name_sv":  s.get("preferred_label", ""),
            "name_en":  s.get("preferred_label_en"),
            "type":     "skill",
            "esco_uri": s.get("esco_uri"),
        })
    count = batch_upsert(supabase, "skills", rows)
    log_sync(supabase, "taxonomy_api_skills", "success", count)
# ── STEP 3: SUBSTITUTABILITY RELATIONS ───────────────────────────────────────
def import_substitutability(supabase: Client):
    print("\n[3/4] Importing substitutability relations (51,000+)...")
    url = STATIC_FILES["substitutability"]
    print(f"  Fetching from: {url}")
    data = fetch_api(url)
    # Response is a list of relations
    relations = data if isinstance(data, list) else data.get("data", [])
    print(f"  Fetched {len(relations):,} relations")
    # Map AF level strings to integers
    level_map = {
        "substitutable":        75,
        "high":                 75,
        "medium":               50,
        "low":                  25,
        "partly_substitutable": 50,
        # numeric passthrough
        75: 75, 50: 50, 25: 25,
    }
    rows = []
    skipped = 0
    for rel in relations:
        # AF field names vary slightly — handle both formats
        from_id = rel.get("from_occupation_id") or rel.get("source_concept_id")
        to_id   = rel.get("to_occupation_id")   or rel.get("target_concept_id")
        level   = rel.get("substitutability_level") or rel.get("level") or rel.get("value")
        if not from_id or not to_id:
            skipped += 1
            continue
        level_int = level_map.get(level)
        if level_int is None:
            # Try numeric
            try:
                level_int = int(level)
                if level_int not in (25, 50, 75):
                    level_int = 50  # default to medium if unexpected value
            except (TypeError, ValueError):
                level_int = 50
        rows.append({
            "from_occupation_id": from_id,
            "to_occupation_id":   to_id,
            "level":              level_int,
        })
    if skipped:
        print(f"  ⚠  Skipped {skipped} relations with missing IDs")
    count = batch_upsert(supabase, "substitutability", rows)
    log_sync(supabase, "substitutability_relations", "success", count)
# ── STEP 4: OCCUPATION–SKILL RELATIONS ───────────────────────────────────────
def import_occupation_skill_relations(supabase: Client):
    print("\n[4/4] Importing occupation–skill relations...")
    url = STATIC_FILES["occupation_skill_relations"]
    print(f"  Fetching from: {url}")
    data = fetch_api(url)
    relations = data if isinstance(data, list) else data.get("data", [])
    print(f"  Fetched {len(relations):,} relations")
    importance_map = {
        "required":  "required",
        "preferred": "preferred",
        "optional":  "optional",
        True:        "required",
        False:       "preferred",
        1:           "required",
        0:           "optional",
    }
    rows = []
    skipped = 0
    for rel in relations:
        occ_id   = rel.get("occupation_concept_id") or rel.get("occupation_id")
        skill_id = rel.get("skill_concept_id")      or rel.get("skill_id")
        if not occ_id or not skill_id:
            skipped += 1
            continue
        importance_raw = rel.get("importance") or rel.get("required")
        importance = importance_map.get(importance_raw, "preferred")
        rows.append({
            "occupation_id": occ_id,
            "skill_id":      skill_id,
            "importance":    importance,
        })
    if skipped:
        print(f"  ⚠  Skipped {skipped} relations with missing IDs")
    count = batch_upsert(supabase, "occupation_skill_relations", rows)
    log_sync(supabase, "occupation_skill_relations", "success", count)
# ── BONUS: SEED PILOT MUNICIPALITIES ─────────────────────────────────────────
def seed_municipalities(supabase: Client):
    print("\n[Bonus] Seeding pilot municipalities...")
    municipalities = [
        # CityIQ pilot targets (investors.html)
        {"kod": "0684", "name": "Vetlanda",  "nuts3_code": "SE231", "population": 27000,  "size_tier": "small",  "is_pilot": True},
        {"kod": "0682", "name": "Nässjö",    "nuts3_code": "SE231", "population": 30000,  "size_tier": "medium", "is_pilot": True},
        {"kod": "0680", "name": "Eksjö",     "nuts3_code": "SE231", "population": 17000,  "size_tier": "small",  "is_pilot": True},
        # Extras for demo dashboards
        {"kod": "0380", "name": "Uppsala",   "nuts3_code": "SE121", "population": 240000, "size_tier": "large",  "is_pilot": False},
        {"kod": "0180", "name": "Stockholm", "nuts3_code": "SE110", "population": 975000, "size_tier": "large",  "is_pilot": False},
        {"kod": "1280", "name": "Malmö",     "nuts3_code": "SE224", "population": 350000, "size_tier": "large",  "is_pilot": False},
        {"kod": "1480", "name": "Göteborg",  "nuts3_code": "SE231", "population": 590000, "size_tier": "large",  "is_pilot": False},
    ]
    count = batch_upsert(supabase, "municipalities", municipalities)
    print(f"  ✓ {count} municipalities seeded")
# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="NordiqFlow — JobTech Dev → Supabase importer")
    parser.add_argument(
        "--step",
        default="all",
        choices=["all", "occupations", "skills", "substitutability", "occupation_skills", "municipalities"],
        help="Which import step to run (default: all)"
    )
    args = parser.parse_args()
    print("=" * 60)
    print("NordiqFlow — JobTech Dev → Supabase Import")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    supabase = get_supabase()
    step = args.step
    if step in ("all", "occupations"):
        import_occupations(supabase)
    if step in ("all", "skills"):
        import_skills(supabase)
    if step in ("all", "substitutability"):
        import_substitutability(supabase)
    if step in ("all", "occupation_skills"):
        import_occupation_skill_relations(supabase)
    if step in ("all", "municipalities"):
        seed_municipalities(supabase)
    print("\n" + "=" * 60)
    print(f"Done: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print("""
Next steps:
  1. Verify data in Supabase Table Editor
  2. Run a test query:
       SELECT o.name_sv, COUNT(s.to_occupation_id) AS transitions
       FROM occupations o
       JOIN substitutability s ON s.from_occupation_id = o.id
       GROUP BY o.name_sv
       ORDER BY transitions DESC
       LIMIT 10;
  3. Check data_sync_log table for import history
""")
if __name__ == "__main__":
    main()
