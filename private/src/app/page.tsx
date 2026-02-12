"use client";

import { useEffect, useState, useRef } from "react";
import { DayRow } from "@/lib/sheets";
import {
  parseSheetDate,
  daysUntil,
  getWeekNumber,
  getWeekColor,
  isToday,
} from "@/lib/dates";
import DailyView from "@/components/DailyView";
import WeekView from "@/components/WeekView";
import DeadlineTracker from "@/components/DeadlineTracker";
import QuickLog from "@/components/QuickLog";

type View = "daily" | "week" | "deadlines" | "timeline";

export default function Dashboard() {
  const [rows, setRows] = useState<DayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>("daily");

  function fetchRows() {
    setLoading(true);
    fetch("/api/sheet/read")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        const filtered = (data.rows as DayRow[]).filter((r) => {
          const d = parseSheetDate(r.date);
          if (!d) return false;
          return d >= new Date(2026, 0, 1);
        });
        setRows(filtered);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchRows();
  }, []);

  const launchDate = new Date(2026, 1, 25);
  const daysToLaunch = daysUntil(new Date(launchDate));

  const tabs: { key: View; label: string }[] = [
    { key: "daily", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "deadlines", label: "Deadlines" },
    { key: "timeline", label: "Full Timeline" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                NordiqFlow Private
              </h1>
              <p className="text-sm text-gray-500">
                Launch: Feb 6 -- Feb 25, 2026
                {daysToLaunch > 0 && (
                  <span className="ml-2 font-semibold text-indigo-600">
                    ({daysToLaunch} days to go)
                  </span>
                )}
                {daysToLaunch === 0 && (
                  <span className="ml-2 font-bold text-green-600">
                    LAUNCH DAY
                  </span>
                )}
              </p>
            </div>
            <a
              href="https://docs.google.com/spreadsheets/d/1y-PAizoHyBlavtBO4y3Yi492TCbGeqUEC-q4J7zp7u4/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Open Spreadsheet
            </a>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  view === tab.key
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
            <p className="mt-4 text-sm text-gray-500">
              Loading from spreadsheet...
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700 font-medium">
              Could not load spreadsheet
            </p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {view === "daily" && <DailyView rows={rows} />}
              {view === "week" && <WeekView rows={rows} />}
              {view === "deadlines" && <DeadlineTracker rows={rows} />}
              {view === "timeline" && <TimelineView rows={rows} />}
            </div>
            <div>
              <QuickLog rows={rows} onSave={fetchRows} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function TimelineView({ rows }: { rows: DayRow[] }) {
  const todayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const enriched = rows.map((row) => ({
    ...row,
    parsedDate: parseSheetDate(row.date),
  }));

  interface WeekGroup {
    weekNumber: number;
    color: { bg: string; border: string };
    rows: (DayRow & { parsedDate: Date | null })[];
  }

  const weeks: WeekGroup[] = [];
  let currentWeek: WeekGroup | null = null;

  for (const row of enriched) {
    const wn = row.parsedDate ? getWeekNumber(row.parsedDate) : -1;
    if (!currentWeek || currentWeek.weekNumber !== wn) {
      currentWeek = { weekNumber: wn, color: getWeekColor(wn), rows: [] };
      weeks.push(currentWeek);
    }
    currentWeek.rows.push(row);
  }

  return (
    <div className="space-y-1">
      {weeks.map((week) => (
        <div
          key={week.weekNumber}
          className="rounded-lg overflow-hidden py-1"
          style={{ background: week.color.bg }}
        >
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-1">
            Week {week.weekNumber}
          </p>
          {week.rows.map((row) => {
            const today = row.parsedDate ? isToday(row.parsedDate) : false;
            return (
              <div
                key={row.rowIndex}
                ref={today ? todayRef : undefined}
                className={`grid grid-cols-[110px_80px_1fr_1fr] gap-2 px-3 py-1.5 text-sm ${
                  today
                    ? "border-l-4 border-indigo-600 font-semibold bg-white/50"
                    : "border-l-4 border-transparent"
                }`}
              >
                <span className="font-medium">{row.date}</span>
                <span className="text-gray-500 text-xs">{row.weekday}</span>
                <span className="text-indigo-700 font-semibold">
                  {row.event}
                  {row.fundingDeadline && (
                    <span className="ml-2 text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded">
                      DEADLINE
                    </span>
                  )}
                </span>
                <span className="text-gray-700">{row.gamePlan}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
