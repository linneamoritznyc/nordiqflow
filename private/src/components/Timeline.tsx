"use client";

import { useEffect, useState, useRef } from "react";
import { DayRow } from "@/lib/sheets";
import { parseSheetDate, getWeekNumber, getWeekColor, isToday } from "@/lib/dates";

interface WeekGroup {
  weekNumber: number;
  color: { bg: string; border: string };
  rows: (DayRow & { parsedDate: Date | null })[];
}

export function Timeline() {
  const [rows, setRows] = useState<DayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const todayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/sheet/read")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRows(data.rows);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [loading]);

  if (loading) return <div className="loading">Loading your timeline...</div>;
  if (error)
    return (
      <div className="card">
        <p className="status-error">
          Could not load spreadsheet: {error}
        </p>
        <p style={{ fontSize: 13, color: "#666", marginTop: 8 }}>
          Make sure your Google Sheets API credentials are set in Vercel
          environment variables.
        </p>
      </div>
    );

  // Group rows by week
  const enriched = rows.map((row) => ({
    ...row,
    parsedDate: parseSheetDate(row.date),
  }));

  const weeks: WeekGroup[] = [];
  let currentWeek: WeekGroup | null = null;

  for (const row of enriched) {
    const wn = row.parsedDate ? getWeekNumber(row.parsedDate) : -1;
    if (!currentWeek || currentWeek.weekNumber !== wn) {
      currentWeek = {
        weekNumber: wn,
        color: getWeekColor(wn),
        rows: [],
      };
      weeks.push(currentWeek);
    }
    currentWeek.rows.push(row);
  }

  return (
    <div>
      {weeks.map((week) => (
        <div
          key={week.weekNumber}
          className="week-group"
          style={{ background: week.color.bg }}
        >
          <div className="week-label">Week {week.weekNumber}</div>
          {week.rows.map((row) => {
            const today = row.parsedDate ? isToday(row.parsedDate) : false;
            return (
              <div
                key={row.rowIndex}
                ref={today ? todayRef : undefined}
                className={`timeline-row ${today ? "is-today" : ""}`}
              >
                <span className="date">{row.date}</span>
                <span className="weekday">{row.weekday}</span>
                <span className="event">
                  {row.event}
                  {row.fundingDeadline && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 11,
                        background: "#dc2626",
                        color: "white",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      DEADLINE: {row.fundingDeadline}
                    </span>
                  )}
                </span>
                <span className="plan">{row.gamePlan}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
