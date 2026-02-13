"use client";

import { DayRow } from "@/lib/sheets";
import { parseSheetDate, isToday, daysUntil } from "@/lib/dates";

interface Props {
  rows: DayRow[];
}

interface ActionItem {
  priority: "urgent" | "high" | "medium" | "info";
  message: string;
  detail?: string;
}

const PRIORITY_STYLES = {
  urgent: {
    bg: "bg-red-50 border-red-300",
    badge: "bg-red-600 text-white",
    text: "text-red-900",
    detail: "text-red-700",
    label: "URGENT",
  },
  high: {
    bg: "bg-orange-50 border-orange-300",
    badge: "bg-orange-500 text-white",
    text: "text-orange-900",
    detail: "text-orange-700",
    label: "DO NOW",
  },
  medium: {
    bg: "bg-yellow-50 border-yellow-300",
    badge: "bg-yellow-500 text-white",
    text: "text-yellow-900",
    detail: "text-yellow-700",
    label: "SOON",
  },
  info: {
    bg: "bg-blue-50 border-blue-300",
    badge: "bg-blue-500 text-white",
    text: "text-blue-900",
    detail: "text-blue-700",
    label: "FYI",
  },
};

export default function ActionItems({ rows }: Props) {
  const actions: ActionItem[] = [];

  const todayRow = rows.find((r) => {
    const d = parseSheetDate(r.date);
    return d && isToday(d);
  });

  // --- Check today's tasks ---
  if (todayRow) {
    if (todayRow.gamePlan) {
      actions.push({
        priority: "high",
        message: `Today's game plan: ${todayRow.gamePlan}`,
      });
    }
    if (todayRow.event) {
      actions.push({
        priority: "urgent",
        message: `Event today: ${todayRow.event}`,
      });
    }
    if (todayRow.fundingDeadline) {
      actions.push({
        priority: "urgent",
        message: `Funding deadline TODAY: ${todayRow.fundingDeadline}`,
        detail: todayRow.fundingEligibility
          ? `Eligibility: ${todayRow.fundingEligibility}`
          : undefined,
      });
    }
    if (!todayRow.gamePlan && !todayRow.event && !todayRow.fundingDeadline) {
      actions.push({
        priority: "medium",
        message: "No tasks set for today.",
        detail:
          "Open the Quick Log on the right and write your game plan for today.",
      });
    }
  }

  // --- Check upcoming deadlines (next 7 days) ---
  const upcomingDeadlines = rows.filter((r) => {
    if (!r.fundingDeadline) return false;
    const d = parseSheetDate(r.date);
    if (!d) return false;
    const days = daysUntil(new Date(d));
    return days > 0 && days <= 7;
  });

  for (const dl of upcomingDeadlines) {
    const d = parseSheetDate(dl.date);
    const days = d ? daysUntil(new Date(d)) : 0;
    actions.push({
      priority: days <= 3 ? "urgent" : "medium",
      message: `Funding deadline in ${days} day${days === 1 ? "" : "s"}: ${dl.fundingDeadline}`,
      detail: `${dl.date} (${dl.weekday})`,
    });
  }

  // --- Check upcoming events (next 3 days) ---
  const upcomingEvents = rows.filter((r) => {
    if (!r.event) return false;
    const d = parseSheetDate(r.date);
    if (!d) return false;
    const days = daysUntil(new Date(d));
    return days > 0 && days <= 3;
  });

  for (const ev of upcomingEvents) {
    const d = parseSheetDate(ev.date);
    const days = d ? daysUntil(new Date(d)) : 0;
    actions.push({
      priority: days === 1 ? "high" : "medium",
      message: `${ev.event}${days === 1 ? " is TOMORROW" : ` in ${days} days`}`,
      detail: ev.gamePlan ? `Plan: ${ev.gamePlan}` : undefined,
    });
  }

  // --- Check if tomorrow has a plan ---
  const tomorrowRow = rows.find((r) => {
    const d = parseSheetDate(r.date);
    if (!d) return false;
    return daysUntil(new Date(d)) === 1;
  });

  if (tomorrowRow && !tomorrowRow.gamePlan && !tomorrowRow.event) {
    actions.push({
      priority: "info",
      message: "Tomorrow has no game plan yet.",
      detail: "Consider planning ahead before you end today.",
    });
  }

  // --- Check days without plans in the next week ---
  const emptyDays = rows.filter((r) => {
    const d = parseSheetDate(r.date);
    if (!d) return false;
    const days = daysUntil(new Date(d));
    return days >= 2 && days <= 7 && !r.gamePlan && !r.event;
  });

  if (emptyDays.length >= 3) {
    actions.push({
      priority: "info",
      message: `${emptyDays.length} days this week have no plan.`,
      detail: "Use the Daily Log to fill in your week.",
    });
  }

  // --- Launch countdown ---
  const launchDate = new Date(2026, 1, 25);
  const daysToLaunch = daysUntil(new Date(launchDate));
  if (daysToLaunch > 0 && daysToLaunch <= 14) {
    actions.push({
      priority: daysToLaunch <= 3 ? "urgent" : daysToLaunch <= 7 ? "high" : "info",
      message: `${daysToLaunch} days until OFFICIAL LAUNCH (Feb 25)`,
      detail:
        daysToLaunch <= 7
          ? "Make sure everything is ready for go-live."
          : undefined,
    });
  }

  if (actions.length === 0) {
    return null;
  }

  // Sort: urgent first, then high, medium, info
  const order = { urgent: 0, high: 1, medium: 2, info: 3 };
  actions.sort((a, b) => order[a.priority] - order[b.priority]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
        What to do right now
      </h2>
      <div className="space-y-2">
        {actions.map((action, i) => {
          const style = PRIORITY_STYLES[action.priority];
          return (
            <div
              key={i}
              className={`rounded-lg border px-4 py-3 ${style.bg}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5 ${style.badge}`}
                >
                  {style.label}
                </span>
                <div>
                  <p className={`text-sm font-medium ${style.text}`}>
                    {action.message}
                  </p>
                  {action.detail && (
                    <p className={`text-xs mt-0.5 ${style.detail}`}>
                      {action.detail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
