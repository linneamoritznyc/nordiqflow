"use client";

import { DayRow } from "@/lib/sheets";
import { parseSheetDate, isToday, daysUntil, getWeekColor, getWeekNumber } from "@/lib/dates";

interface Props {
  rows: DayRow[];
}

export default function WeekView({ rows }: Props) {
  // Get the next 7 days from today
  const upcoming = rows.filter((r) => {
    const d = parseSheetDate(r.date);
    if (!d) return false;
    const days = daysUntil(new Date(d));
    return days >= 0 && days <= 6;
  });

  if (upcoming.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-500 text-center">No data for this week.</p>
      </div>
    );
  }

  const weekNum = (() => {
    const d = parseSheetDate(upcoming[0].date);
    return d ? getWeekNumber(d) : 0;
  })();
  const weekColor = getWeekColor(weekNum);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div
        className="px-6 py-3 border-b"
        style={{ background: weekColor.bg, borderColor: weekColor.border }}
      >
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          This Week -- Week {weekNum}
        </h2>
      </div>

      <div className="divide-y divide-gray-100">
        {upcoming.map((row) => {
          const d = parseSheetDate(row.date);
          const today = d ? isToday(d) : false;
          const hasContent = row.event || row.gamePlan || row.fundingDeadline;

          return (
            <div
              key={row.rowIndex}
              className={`px-6 py-4 ${today ? "bg-indigo-50 border-l-4 border-indigo-600" : ""}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-28 flex-shrink-0">
                  <p className={`font-medium ${today ? "text-indigo-700" : "text-gray-900"}`}>
                    {row.date}
                  </p>
                  <p className="text-xs text-gray-500">{row.weekday}</p>
                  {today && (
                    <span className="inline-block mt-1 text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">
                      TODAY
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  {row.event && (
                    <p className="font-semibold text-purple-700">{row.event}</p>
                  )}
                  {row.gamePlan && (
                    <p className="text-gray-700">{row.gamePlan}</p>
                  )}
                  {row.fundingDeadline && (
                    <p className="text-sm font-medium text-red-600">
                      DEADLINE: {row.fundingDeadline}
                    </p>
                  )}
                  {!hasContent && (
                    <p className="text-sm text-gray-400 italic">No tasks</p>
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
