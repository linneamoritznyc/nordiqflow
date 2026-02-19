import { NextResponse } from "next/server";
import { searchJobs } from "@/lib/af-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const result = await searchJobs({
      q: searchParams.get("q") || undefined,
      municipality: searchParams.get("municipality") || undefined,
      region: searchParams.get("region") || undefined,
      occupation_id: searchParams.get("occupation_id") || undefined,
      limit: Number(searchParams.get("limit")) || 20,
      offset: Number(searchParams.get("offset")) || 0,
    });

    // Transform AF response to our job format
    const jobs = result.hits.map((hit) => ({
      af_job_id: hit.id,
      title: hit.headline,
      employer: hit.employer?.name || "Unknown",
      municipality: hit.workplace_address?.municipality || null,
      region: hit.workplace_address?.region || null,
      description: hit.description?.text || "",
      salary: hit.salary_description || null,
      employment_type: hit.employment_type?.label || null,
      application_url: hit.application_details?.url || null,
      deadline: hit.last_publication_date || null,
      posted: hit.publication_date || null,
      occupation_id: hit.occupation?.concept_id || null,
      occupation_label: hit.occupation?.label || null,
    }));

    return NextResponse.json({ jobs, total: result.total });
  } catch (error) {
    console.error("Job search error:", error);
    return NextResponse.json(
      { error: "Failed to search jobs" },
      { status: 500 }
    );
  }
}
