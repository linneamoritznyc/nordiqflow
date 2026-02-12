"use client";

import { DayRow } from "@/lib/sheets";
import { parseSheetDate, daysUntil } from "@/lib/dates";

interface Props {
  rows: DayRow[];
}

interface Deadline {
  date: string;
  weekday: string;
  deadline: string;
  eligibility: string;
  daysLeft: number;
  rowIndex: number;
}

export default function DeadlineTracker({ rows }: Props) {
  const deadlines: Deadline[] = rows
    .filter((r) => r.fundingDeadline)
    .map((r) => {
      const d = parseSheetDate(r.date);
      return {
        date: r.date,
        weekday: r.weekday,
        deadline: r.fundingDeadline,
        eligibility: r.fundingEligibility,
        daysLeft: d ? daysUntil(new Date(d)) : 999,
        rowIndex: r.rowIndex,
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const upcoming = deadlines.filter((d) => d.daysLeft >= 0);
  const past = deadlines.filter((d) => d.daysLeft < 0);

  function getBadgeClasses(daysLeft: number): string {
    if (daysLeft === 0) return "bg-red-600 text-white";
    if (daysLeft <= 3) return "bg-red-500 text-white";
    if (daysLeft <= 7) return "bg-orange-500 text-white";
    if (daysLeft <= 14) return "bg-yellow-500 text-white";
    return "bg-green-600 text-white";
  }

  if (deadlines.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500 mb-2">No funding deadlines found.</p>
        <p className="text-sm text-gray-400">
          Add deadlines in column E of your spreadsheet, or use the Daily Log.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Upcoming Deadlines
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {upcoming.map((item, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{item.deadline}</p>
                  <p className="text-sm text-gray-500">
                    {item.date} ({item.weekday})
                  </p>
                  {item.eligibility && (
                    <p className="text-xs text-gray-500 mt-1">
                      Eligibility: {item.eligibility}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-full ${getBadgeClasses(item.daysLeft)}`}
                >
                  {item.daysLeft === 0
                    ? "TODAY"
                    : `${item.daysLeft} day${item.daysLeft === 1 ? "" : "s"} left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden opacity-60">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Past Deadlines
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {past.map((item, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-500">{item.deadline}</p>
                  <p className="text-sm text-gray-400">{item.date}</p>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-300 text-white">
                  PAST
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
