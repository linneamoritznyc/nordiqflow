"use client";

import { useState, useEffect } from "react";
import { DayRow } from "@/lib/sheets";
import { parseSheetDate, isToday } from "@/lib/dates";

interface Props {
  rows: DayRow[];
  onSave: () => void;
}

export default function QuickLog({ rows, onSave }: Props) {
  const [gamePlan, setGamePlan] = useState("");
  const [event, setEvent] = useState("");
  const [fundingDeadline, setFundingDeadline] = useState("");
  const [fundingEligibility, setFundingEligibility] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const todayRow = rows.find((r) => {
    const d = parseSheetDate(r.date);
    return d && isToday(d);
  });

  useEffect(() => {
    if (todayRow) {
      setGamePlan(todayRow.gamePlan);
      setEvent(todayRow.event);
      setFundingDeadline(todayRow.fundingDeadline);
      setFundingEligibility(todayRow.fundingEligibility);
    }
  }, [todayRow?.rowIndex]);

  async function handleSave() {
    if (!todayRow) return;
    setSaving(true);
    setStatus(null);

    try {
      const res = await fetch("/api/sheet/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowIndex: todayRow.rowIndex,
          gamePlan,
          event,
          fundingDeadline,
          fundingEligibility,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setStatus({ type: "success", message: "Saved!" });
      onSave();
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to save",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!todayRow) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Log</h3>
        <p className="text-sm text-gray-500">
          No row found for today in the spreadsheet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-20">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Quick Log</h3>
      <p className="text-xs text-gray-500 mb-4">
        {todayRow.date} ({todayRow.weekday})
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Game plan
          </label>
          <textarea
            rows={3}
            value={gamePlan}
            onChange={(e) => setGamePlan(e.target.value)}
            placeholder="What's the plan for today?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Event
          </label>
          <input
            type="text"
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            placeholder="e.g., OFFICIAL LAUNCH"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Funding deadline
          </label>
          <input
            type="text"
            value={fundingDeadline}
            onChange={(e) => setFundingDeadline(e.target.value)}
            placeholder="e.g., Vinnova application due"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Eligibility confirmed?
          </label>
          <input
            type="text"
            value={fundingEligibility}
            onChange={(e) => setFundingEligibility(e.target.value)}
            placeholder="Yes, Pending, No..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : "Save to Spreadsheet"}
        </button>

        {status && (
          <p
            className={`text-xs font-medium ${
              status.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {status.message}
          </p>
        )}
      </div>
    </div>
  );
}
