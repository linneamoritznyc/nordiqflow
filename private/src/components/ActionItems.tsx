"use client";

import { DayRow, MeetingNote } from "@/lib/sheets";
import { parseSheetDate, isToday, daysUntil } from "@/lib/dates";

interface Props {
  rows: DayRow[];
  meetingNotes?: MeetingNote[];
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

export default function ActionItems({ rows, meetingNotes = [] }: Props) {
  const actions: ActionItem[] = [];
  const now = new Date();
  const currentHour = now.getHours();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ... 5=Fri, 6=Sat

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

  // --- Meeting follow-ups ---
  const pendingFollowUps = meetingNotes.filter(
    (n) => n.status === "Follow-up needed" && n.followUp
  );
  for (const note of pendingFollowUps) {
    actions.push({
      priority: "high",
      message: `Follow up with ${note.contact}${note.organization ? ` (${note.organization})` : ""}`,
      detail: note.followUp,
    });
  }

  const waitingMeetings = meetingNotes.filter((n) => n.status === "Waiting");
  if (waitingMeetings.length > 0) {
    actions.push({
      priority: "info",
      message: `${waitingMeetings.length} meeting${waitingMeetings.length === 1 ? "" : "s"} waiting for response`,
      detail: waitingMeetings.map((n) => n.contact).join(", "),
    });
  }

  const scheduledMeetings = meetingNotes.filter(
    (n) => n.status === "Scheduled"
  );
  if (scheduledMeetings.length > 0) {
    actions.push({
      priority: "medium",
      message: `${scheduledMeetings.length} upcoming meeting${scheduledMeetings.length === 1 ? "" : "s"} scheduled`,
      detail: scheduledMeetings.map((n) => `${n.contact} (${n.date})`).join(", "),
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

  // --- End of day planning nudge ---
  if (currentHour >= 16 && dayOfWeek >= 1 && dayOfWeek <= 5) {
    const nextDayRow = rows.find((r) => {
      const d = parseSheetDate(r.date);
      if (!d) return false;
      return daysUntil(new Date(d)) === 1;
    });
    if (nextDayRow && !nextDayRow.gamePlan) {
      actions.push({
        priority: "medium",
        message: "End of day: Plan tomorrow before you stop working.",
        detail: "Write down your top priorities so you can start strong tomorrow.",
      });
    }
  }

  // --- Friday: plan next week ---
  if (dayOfWeek === 5) {
    const nextWeekEmpty = rows.filter((r) => {
      const d = parseSheetDate(r.date);
      if (!d) return false;
      const days = daysUntil(new Date(d));
      return days >= 3 && days <= 7 && !r.gamePlan && !r.event;
    });
    if (nextWeekEmpty.length >= 3) {
      actions.push({
        priority: "medium",
        message: "It's Friday -- plan your next week.",
        detail: `${nextWeekEmpty.length} days next week have no plan yet. Open the Spreadsheet tab to fill them in.`,
      });
    }
  }

  // --- Monday morning kickoff ---
  if (dayOfWeek === 1 && currentHour < 12) {
    actions.push({
      priority: "info",
      message: "Monday -- review your week ahead.",
      detail: "Check your deadlines, events, and game plans for this week.",
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
      detail: "Open the Spreadsheet tab to fill in your week.",
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

  // --- Funding eligibility check ---
  const unconfirmedFunding = rows.filter((r) => {
    if (!r.fundingDeadline) return false;
    const d = parseSheetDate(r.date);
    if (!d) return false;
    const days = daysUntil(new Date(d));
    return days > 0 && days <= 14 && !r.fundingEligibility;
  });
  if (unconfirmedFunding.length > 0) {
    actions.push({
      priority: "medium",
      message: `${unconfirmedFunding.length} upcoming funding deadline${unconfirmedFunding.length === 1 ? " has" : "s have"} unconfirmed eligibility`,
      detail: "Check if you're eligible and update the spreadsheet.",
    });
  }

  // --- Week progress ---
  const thisWeekRows = rows.filter((r) => {
    const d = parseSheetDate(r.date);
    if (!d) return false;
    const days = daysUntil(new Date(d));
    return days >= -dayOfWeek && days <= (7 - dayOfWeek);
  });
  const completedDays = thisWeekRows.filter(
    (r) => {
      const d = parseSheetDate(r.date);
      if (!d) return false;
      return daysUntil(new Date(d)) < 0 && (r.gamePlan || r.event);
    }
  ).length;
  const totalPlannedDays = thisWeekRows.filter(
    (r) => r.gamePlan || r.event
  ).length;
  if (totalPlannedDays > 0 && completedDays > 0) {
    actions.push({
      priority: "info",
      message: `Week progress: ${completedDays} of ${totalPlannedDays} planned days done`,
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
