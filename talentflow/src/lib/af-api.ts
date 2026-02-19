const JOBSEARCH_BASE = "https://jobsearch.api.jobtechdev.se/search";
const TAXONOMY_BASE =
  "https://taxonomy.api.jobtechdev.se/v1/taxonomy/specific/concepts";
const ENRICHMENTS_BASE = "https://jobad-enrichments.api.jobtechdev.se";

// ============================================================
// Job Search (Platsbanken)
// ============================================================

export interface AFJobSearchParams {
  q?: string;
  municipality?: string; // kommun code
  region?: string; // lan code
  occupation_id?: string; // SSYK concept ID
  limit?: number;
  offset?: number;
}

export interface AFJobHit {
  id: string;
  headline: string;
  employer: { name: string };
  workplace_address: {
    municipality: string;
    region: string;
    municipality_code: string;
    region_code: string;
  };
  description: { text: string };
  salary_description: string;
  employment_type: { label: string };
  application_details: { url: string; email: string };
  last_publication_date: string;
  publication_date: string;
  occupation: { concept_id: string; label: string };
  occupation_group: { concept_id: string; label: string };
}

export async function searchJobs(
  params: AFJobSearchParams
): Promise<{ hits: AFJobHit[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.municipality) searchParams.set("municipality", params.municipality);
  if (params.region) searchParams.set("region", params.region);
  if (params.occupation_id)
    searchParams.set("occupation-name", params.occupation_id);
  searchParams.set("limit", String(params.limit || 20));
  searchParams.set("offset", String(params.offset || 0));

  const res = await fetch(`${JOBSEARCH_BASE}?${searchParams}`, {
    headers: { accept: "application/json" },
    next: { revalidate: 3600 }, // Cache 1 hour
  });

  if (!res.ok) throw new Error(`AF JobSearch API error: ${res.status}`);

  const data = await res.json();
  return {
    hits: data.hits || [],
    total: data.total?.value || 0,
  };
}

// ============================================================
// Taxonomy lookups
// ============================================================

export async function fetchRegions() {
  const res = await fetch(`${TAXONOMY_BASE}/region`, {
    headers: { accept: "application/json" },
    next: { revalidate: 86400 }, // Cache 24 hours
  });
  const data = await res.json();
  return data.data?.concepts || [];
}

export async function fetchMunicipalities() {
  const res = await fetch(`${TAXONOMY_BASE}/municipality`, {
    headers: { accept: "application/json" },
    next: { revalidate: 86400 },
  });
  const data = await res.json();
  return data.data?.concepts || [];
}

// ============================================================
// Job Ad Enrichment (NLP skill extraction)
// ============================================================

export async function enrichText(
  text: string
): Promise<{
  occupations: { concept_id: string; term: string; confidence: number }[];
  skills: { concept_id: string; term: string; confidence: number }[];
}> {
  const res = await fetch(`${ENRICHMENTS_BASE}/enrich`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) throw new Error(`AF Enrichments API error: ${res.status}`);
  return res.json();
}
