// ============================================================
// Database types (mirrors DATABASE_SCHEMA.sql)
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
  current_occupation_id: string | null;
  municipality_id: string | null;
  years_experience: number | null;
  education_level: string | null;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  proficiency: number; // 1-5
  source: "cv_parsed" | "manual" | "inferred";
  created_at: string;
  // Joined fields
  skill_name?: string;
}

export interface UserExperience {
  id: string;
  user_id: string;
  title: string;
  employer: string | null;
  occupation_id: string | null;
  start_date: string | null;
  end_date: string | null; // null = current
  description: string | null;
}

export interface UserEducation {
  id: string;
  user_id: string;
  institution: string | null;
  degree: string | null;
  field: string | null;
  sun_code: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface Resume {
  id: string;
  user_id: string;
  name: string;
  target_occupation_id: string | null;
  is_base: boolean;
  content_json: ResumeContent;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResumeContent {
  summary: string;
  experience: {
    title: string;
    employer: string;
    period: string;
    bullets: string[];
  }[];
  skills: string[];
  education: {
    institution: string;
    degree: string;
    field: string;
    period: string;
  }[];
}

export interface Job {
  id: string;
  af_job_id: string | null;
  title: string;
  employer: string | null;
  occupation_id: string | null;
  municipality_id: string | null;
  region_id: string | null;
  description_raw: string | null;
  salary_range: string | null;
  employment_type: string | null;
  application_url: string | null;
  application_deadline: string | null;
  source: string;
  scraped_at: string;
  is_active: boolean;
}

export interface JobWithFit extends Job {
  fit_score: number; // 0-100
  matched_skills: string[];
  missing_skills: string[];
  municipality_name?: string;
  region_name?: string;
}

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  resume_id: string | null;
  status: ApplicationStatus;
  fit_score: number | null;
  cover_letter: string | null;
  applied_at: string | null;
  response_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  job?: Job;
  resume?: Resume;
}

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

// ============================================================
// AF Taxonomy types
// ============================================================

export interface AFOccupation {
  id: string;
  name: string;
  ssyk_code: string;
  ssyk_label: string | null;
  definition: string | null;
}

export interface AFSkill {
  id: string;
  name: string;
  skill_type: string | null;
  parent_id: string | null;
}

export interface AFRegion {
  id: string;
  name: string;
  nuts_code: string | null;
}

export interface AFMunicipality {
  id: string;
  name: string;
  municipality_code: string | null;
  region_id: string | null;
}

// ============================================================
// API response types
// ============================================================

export interface CVParseResult {
  skills: { name: string; af_skill_id: string | null; confidence: number }[];
  experiences: {
    title: string;
    employer: string;
    start_date: string;
    end_date: string | null;
    description: string;
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    start_date: string;
    end_date: string | null;
  }[];
  detected_occupation: {
    name: string;
    af_occupation_id: string | null;
  } | null;
}

export interface FitBreakdown {
  overall_score: number;
  matched_skills: { id: string; name: string }[];
  missing_skills: { id: string; name: string; importance: string }[];
  substitutability_score: number | null;
  substitutability_note: string | null;
}
