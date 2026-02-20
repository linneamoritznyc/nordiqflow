/**
 * Calculate fit score between a user's skills and a job's required skills.
 * Pure data comparison — no AI needed.
 */
export function calculateFitScore(
  userSkillIds: Set<string>,
  jobSkillIds: Set<string>
): {
  score: number;
  matchedIds: string[];
  missingIds: string[];
} {
  if (jobSkillIds.size === 0) {
    return { score: 50, matchedIds: [], missingIds: [] }; // No data = neutral
  }

  const matched: string[] = [];
  const missing: string[] = [];

  for (const skillId of jobSkillIds) {
    if (userSkillIds.has(skillId)) {
      matched.push(skillId);
    } else {
      missing.push(skillId);
    }
  }

  const score = Math.round((matched.length / jobSkillIds.size) * 100);

  return {
    score,
    matchedIds: matched,
    missingIds: missing,
  };
}

/**
 * Color for fit score badge
 */
export function fitScoreColor(score: number): string {
  if (score >= 80) return "text-green-700 bg-green-100";
  if (score >= 50) return "text-yellow-700 bg-yellow-100";
  return "text-red-700 bg-red-100";
}
