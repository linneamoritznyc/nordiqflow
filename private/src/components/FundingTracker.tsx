"use client";

import { useEffect, useState } from "react";
import { DayRow } from "@/lib/sheets";
import { parseSheetDate, daysUntil, getUrgencyLevel } from "@/lib/dates";

interface FundingItem {
  date: string;
  weekday: string;
  deadline: string;
  eligibility: string;
  daysLeft: number;
  urgency: { label: string; color: string };
}

export function FundingTracker() {
  const [items, setItems] = useState<FundingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sheet/read")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);

        const funding: FundingItem[] = data.rows
          .filter((r: DayRow) => r.fundingDeadline)
          .map((r: DayRow) => {
            const d = parseSheetDate(r.date);
            const days = d ? daysUntil(new Date(d)) : 999;
            return {
              date: r.date,
              weekday: r.weekday,
              deadline: r.fundingDeadline,
              eligibility: r.fundingEligibility,
              daysLeft: days,
              urgency: getUrgencyLevel(days),
            };
          })
          .sort(
            (a: FundingItem, b: FundingItem) => a.daysLeft - b.daysLeft
          );

        setItems(funding);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  const upcoming = items.filter((i) => i.daysLeft >= 0);
  const past = items.filter((i) => i.daysLeft < 0);

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        Funding Deadlines
      </h1>

      {upcoming.length === 0 && past.length === 0 && (
        <div className="empty">
          <p>No funding deadlines found in your spreadsheet yet.</p>
          <p style={{ marginTop: 8 }}>
            Add deadlines in column E of your planning sheet, or use the Daily
            Log to add them from here.
          </p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="card">
          <h2>Upcoming</h2>
          {upcoming.map((item, i) => (
            <div key={i} className="funding-card">
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  {item.deadline}
                </div>
                <div
                  style={{ fontSize: 13, color: "var(--text-muted)" }}
                >
                  {item.date} ({item.weekday})
                </div>
                {item.eligibility && (
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    Eligibility: {item.eligibility}
                  </div>
                )}
              </div>
              <span
                className="deadline-badge"
                style={{ background: item.urgency.color }}
              >
                {item.urgency.label === "TODAY"
                  ? "TODAY"
                  : `${item.daysLeft} days left`}
              </span>
            </div>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="card" style={{ opacity: 0.6 }}>
          <h2>Past deadlines</h2>
          {past.map((item, i) => (
            <div key={i} className="funding-card">
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  {item.deadline}
                </div>
                <div
                  style={{ fontSize: 13, color: "var(--text-muted)" }}
                >
                  {item.date}
                </div>
              </div>
              <span
                className="deadline-badge"
                style={{ background: "#9e9e9e" }}
              >
                PAST
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
