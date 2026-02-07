// Get ISO week number for a date
export function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Parse "February 7" style dates from the spreadsheet
export function parseSheetDate(dateStr: string, year: number = 2026): Date | null {
  if (!dateStr) return null;
  const parsed = Date.parse(`${dateStr.trim()}, ${year}`);
  if (isNaN(parsed)) return null;
  return new Date(parsed);
}

// Check if a date is today
export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

// Days until a date from today
export function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - now.getTime()) / 86400000);
}

// Alternating week colors (soft pastels matching the spreadsheet feel)
const WEEK_COLORS = [
  { bg: "#e8f0fe", border: "#c5d9f7" }, // light blue
  { bg: "#fce4ec", border: "#f5b7c5" }, // light pink
  { bg: "#fff8e1", border: "#ffe082" }, // light yellow
  { bg: "#e8f5e9", border: "#a5d6a7" }, // light green
  { bg: "#f3e5f5", border: "#ce93d8" }, // light purple
  { bg: "#e0f7fa", border: "#80deea" }, // light cyan
  { bg: "#fff3e0", border: "#ffcc80" }, // light orange
  { bg: "#fce4ec", border: "#f48fb1" }, // pink
];

export function getWeekColor(weekNumber: number): {
  bg: string;
  border: string;
} {
  return WEEK_COLORS[weekNumber % WEEK_COLORS.length];
}

// Format a deadline urgency
export function getUrgencyLevel(daysLeft: number): {
  label: string;
  color: string;
} {
  if (daysLeft < 0) return { label: "PAST", color: "#9e9e9e" };
  if (daysLeft === 0) return { label: "TODAY", color: "#d32f2f" };
  if (daysLeft <= 3) return { label: `${daysLeft}d`, color: "#d32f2f" };
  if (daysLeft <= 7) return { label: `${daysLeft}d`, color: "#f57c00" };
  if (daysLeft <= 14) return { label: `${daysLeft}d`, color: "#fbc02d" };
  return { label: `${daysLeft}d`, color: "#388e3c" };
}
