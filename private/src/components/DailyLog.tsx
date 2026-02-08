"use client";

import { useEffect, useState } from "react";
import { DayRow } from "@/lib/sheets";
import { parseSheetDate, isToday, daysUntil } from "@/lib/dates";

export function DailyLog() {
  const [rows, setRows] = useState<DayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<DayRow | null>(null);
  const [gamePlan, setGamePlan] = useState("");
  const [event, setEvent] = useState("");
  const [fundingDeadline, setFundingDeadline] = useState("");
  const [fundingEligibility, setFundingEligibility] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/sheet/read")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRows(data.rows);
        // Auto-select today
        const todayRow = data.rows.find((r: DayRow) => {
          const d = parseSheetDate(r.date);
          return d && isToday(d);
        });
        if (todayRow) selectRow(todayRow);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function selectRow(row: DayRow) {
    setSelectedRow(row);
    setGamePlan(row.gamePlan);
    setEvent(row.event);
    setFundingDeadline(row.fundingDeadline);
    setFundingEligibility(row.fundingEligibility);
    setStatus(null);
  }

  async function handleSave() {
    if (!selectedRow) return;
    setSaving(true);
    setStatus(null);

    try {
      const res = await fetch("/api/sheet/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowIndex: selectedRow.rowIndex,
          gamePlan,
          event,
          fundingDeadline,
          fundingEligibility,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setStatus({ type: "success", message: "Saved to spreadsheet" });

      // Update local state
      setRows((prev) =>
        prev.map((r) =>
          r.rowIndex === selectedRow.rowIndex
            ? { ...r, gamePlan, event, fundingDeadline, fundingEligibility }
            : r
        )
      );
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to save",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  // Show upcoming 14 days for quick selection
  const upcoming = rows.filter((r) => {
    const d = parseSheetDate(r.date);
    if (!d) return false;
    const days = daysUntil(new Date(d));
    return days >= -1 && days <= 14;
  });

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        Daily Log
      </h1>

      <div className="card">
        <h2>Select a day</h2>
        <div className="date-picker-row">
          {upcoming.map((row) => {
            const d = parseSheetDate(row.date);
            const today = d ? isToday(d) : false;
            const isSelected = selectedRow?.rowIndex === row.rowIndex;
            return (
              <button
                key={row.rowIndex}
                onClick={() => selectRow(row)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: isSelected
                    ? "2px solid var(--accent)"
                    : "1px solid var(--border)",
                  background: today
                    ? "var(--accent)"
                    : isSelected
                      ? "var(--accent-light)"
                      : "white",
                  color: today ? "white" : "var(--text)",
                  fontSize: 12,
                  fontWeight: today || isSelected ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {row.date}
                <br />
                <span style={{ fontSize: 10, opacity: 0.7 }}>
                  {row.weekday}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedRow && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>
            {selectedRow.date} ({selectedRow.weekday})
          </h2>

          <div className="log-form">
            <div>
              <label>Game plan</label>
              <textarea
                rows={3}
                value={gamePlan}
                onChange={(e) => setGamePlan(e.target.value)}
                placeholder="What's the plan for this day?"
              />
            </div>

            <div>
              <label>Event in Startup</label>
              <input
                type="text"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                placeholder="e.g., OFFICIAL LAUNCH, Pilot kickoff..."
              />
            </div>

            <div>
              <label>Funding deadline</label>
              <input
                type="text"
                value={fundingDeadline}
                onChange={(e) => setFundingDeadline(e.target.value)}
                placeholder="e.g., Vinnova application due"
              />
            </div>

            <div>
              <label>Funding eligibility confirmed?</label>
              <input
                type="text"
                value={fundingEligibility}
                onChange={(e) => setFundingEligibility(e.target.value)}
                placeholder="e.g., Yes, Pending, No..."
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save to Spreadsheet"}
              </button>
              {status && (
                <span
                  className={
                    status.type === "success"
                      ? "status-success"
                      : "status-error"
                  }
                >
                  {status.message}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
