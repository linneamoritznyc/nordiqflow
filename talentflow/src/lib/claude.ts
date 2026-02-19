import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function parseCV(cvText: string) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: cvText,
      },
    ],
    system: `You are a Swedish CV parser. Extract structured data from the CV text.

Return ONLY valid JSON with this exact structure:
{
  "skills": [{"name": "skill name", "confidence": 0.0-1.0}],
  "experiences": [{"title": "", "employer": "", "start_date": "YYYY-MM", "end_date": "YYYY-MM or null", "description": ""}],
  "education": [{"institution": "", "degree": "", "field": "", "start_date": "YYYY", "end_date": "YYYY or null"}],
  "detected_occupation": {"name": "most likely current occupation"} or null
}

Rules:
- Extract ONLY skills explicitly mentioned (do not infer)
- Keep all text in its original language
- Use ISO date formats
- end_date is null if current/ongoing
- confidence is how certain you are this is a real skill (not filler text)`,
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  return JSON.parse(jsonMatch[1]!.trim());
}

export async function generateCoverLetter(
  job: { title: string; employer: string; description: string },
  applicant: {
    name: string;
    current_role: string;
    skills: string[];
    experience_summary: string;
  },
  matchedSkills: string[],
  missingSkills: string[]
) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `JOB: ${job.title} at ${job.employer}
DESCRIPTION: ${job.description}

APPLICANT: ${applicant.name}, currently ${applicant.current_role}
RELEVANT SKILLS: ${matchedSkills.join(", ")}
MISSING SKILLS: ${missingSkills.join(", ")}
EXPERIENCE: ${applicant.experience_summary}`,
      },
    ],
    system: `Write a professional cover letter in Swedish for a job application.
The letter should be personal, specific to the job, and reference the applicant's actual skills and experience.
Do NOT be generic. Reference specific requirements from the job ad and explain how the applicant meets them.
If there are missing skills, briefly acknowledge willingness to learn (do not dwell on gaps).
Keep it under 400 words. Output only the letter text, no JSON or markup.`,
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

export async function tailorResume(
  profile: {
    experiences: { title: string; employer: string; bullets: string[] }[];
    skills: string[];
    education: { degree: string; field: string; institution: string }[];
  },
  targetJob: { title: string; description: string; required_skills: string[] }
) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `PROFILE: ${JSON.stringify(profile)}
TARGET JOB: ${targetJob.title}
JOB DESCRIPTION: ${targetJob.description}
REQUIRED SKILLS: ${targetJob.required_skills.join(", ")}`,
      },
    ],
    system: `You are a professional Swedish resume writer. Given a user's full profile and a target job,
create a tailored resume that emphasizes relevant skills and experience.

Return ONLY valid JSON:
{
  "summary": "2-3 sentence professional summary tailored to the target job",
  "experience": [{"title": "", "employer": "", "period": "", "bullets": ["rewritten to match job language"]}],
  "skills": ["ordered by relevance to target job"],
  "education": [{"institution": "", "degree": "", "field": "", "period": ""}]
}

Rules:
- Reorder experience by relevance to the target job
- Rewrite bullet points to use language that matches the job ad
- Only include real experience — do not fabricate
- Put most relevant skills first
- Keep text in Swedish unless the original was in English`,
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  return JSON.parse(jsonMatch[1]!.trim());
}
