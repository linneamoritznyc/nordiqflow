"use client";

import { useEffect, useState } from "react";
import { DayRow } from "@/lib/sheets";
import { parseSheetDate, daysUntil } from "@/lib/dates";
import DailyView from "@/components/DailyView";
import WeekView from "@/components/WeekView";
import DeadlineTracker from "@/components/DeadlineTracker";
import QuickLog from "@/components/QuickLog";
import FundingLinks from "@/components/FundingLinks";
import MeetingNotes from "@/components/MeetingNotes";
import ActionItems from "@/components/ActionItems";
import { MeetingNote } from "@/lib/sheets";

type View = "daily" | "week" | "deadlines" | "funding" | "meetings" | "spreadsheet";

export default function Dashboard() {
  const [rows, setRows] = useState<DayRow[]>([]);
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>([]);
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

  function fetchMeetingNotes() {
    fetch("/api/notes")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setMeetingNotes(data.notes || []);
      })
      .catch(() => {});
  }

  useEffect(() => {
    fetchRows();
    fetchMeetingNotes();
  }, []);

  const launchDate = new Date(2026, 1, 25);
  const daysToLaunch = daysUntil(new Date(launchDate));

  const tabs: { key: View; label: string }[] = [
    { key: "daily", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "deadlines", label: "Deadlines" },
    { key: "funding", label: "Funding Sources" },
    { key: "meetings", label: "Meetings" },
    { key: "spreadsheet", label: "Spreadsheet" },
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
        {/* Proactive action items -- always visible */}
        {!loading && !error && rows.length > 0 && (
          <ActionItems rows={rows} meetingNotes={meetingNotes} />
        )}

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
        ) : view === "funding" ? (
          <FundingLinks />
        ) : view === "meetings" ? (
          <MeetingNotes />
        ) : view === "spreadsheet" ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">
                Live spreadsheet -- edits sync automatically
              </p>
              <a
                href="https://docs.google.com/spreadsheets/d/1y-PAizoHyBlavtBO4y3Yi492TCbGeqUEC-q4J7zp7u4/edit?gid=59492130#gid=59492130"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Open in Google Sheets
              </a>
            </div>
            <iframe
              src="https://docs.google.com/spreadsheets/d/1y-PAizoHyBlavtBO4y3Yi492TCbGeqUEC-q4J7zp7u4/edit?gid=59492130&rm=minimal"
              className="w-full border-0"
              style={{ height: "calc(100vh - 220px)", minHeight: "600px" }}
              title="NordiqFlow Planning Spreadsheet"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {view === "daily" && <DailyView rows={rows} />}
              {view === "week" && <WeekView rows={rows} />}
              {view === "deadlines" && <DeadlineTracker rows={rows} />}
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

