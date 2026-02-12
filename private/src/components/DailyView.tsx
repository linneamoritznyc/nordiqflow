"use client";

import { DayRow } from "@/lib/sheets";
import { parseSheetDate, isToday, daysUntil } from "@/lib/dates";

interface Props {
  rows: DayRow[];
}

export default function DailyView({ rows }: Props) {
  const todayRow = rows.find((r) => {
    const d = parseSheetDate(r.date);
    return d && isToday(d);
  });

  const tomorrow = rows.find((r) => {
    const d = parseSheetDate(r.date);
    if (!d) return false;
    return daysUntil(new Date(d)) === 1;
  });

  return (
    <div className="space-y-6">
      {/* Today */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Today</h2>
          {todayRow && (
            <span className="text-sm text-gray-500">
              {todayRow.date}, {todayRow.weekday}
            </span>
          )}
        </div>

        {todayRow ? (
          <div className="space-y-4">
            {todayRow.event && (
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Event
                </h3>
                <p className="text-lg text-gray-900 font-medium">
                  {todayRow.event}
                </p>
              </div>
            )}

            {todayRow.gamePlan && (
              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Game Plan
                </h3>
                <p className="text-lg text-gray-900">{todayRow.gamePlan}</p>
              </div>
            )}

            {todayRow.fundingDeadline && (
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Funding Deadline
                </h3>
                <p className="text-lg text-gray-900">
                  {todayRow.fundingDeadline}
                </p>
              </div>
            )}

            {!todayRow.event &&
              !todayRow.gamePlan &&
              !todayRow.fundingDeadline && (
                <p className="text-gray-500">
                  No tasks scheduled for today. Add some in the Daily Log.
                </p>
              )}
          </div>
        ) : (
          <p className="text-gray-500">No row found for today in your spreadsheet.</p>
        )}
      </div>

      {/* Tomorrow preview */}
      {tomorrow && (tomorrow.event || tomorrow.gamePlan || tomorrow.fundingDeadline) && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Tomorrow -- {tomorrow.date}, {tomorrow.weekday}
          </h3>
          <div className="space-y-2">
            {tomorrow.event && (
              <p className="text-gray-700">
                <span className="font-medium text-purple-600">Event:</span>{" "}
                {tomorrow.event}
              </p>
            )}
            {tomorrow.gamePlan && (
              <p className="text-gray-700">
                <span className="font-medium text-indigo-600">Plan:</span>{" "}
                {tomorrow.gamePlan}
              </p>
            )}
            {tomorrow.fundingDeadline && (
              <p className="text-gray-700">
                <span className="font-medium text-red-600">Deadline:</span>{" "}
                {tomorrow.fundingDeadline}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
