"use client";

import { useEffect, useState } from "react";
import { MeetingNote } from "@/lib/sheets";

const MEETING_TYPES = [
  "Investor",
  "Funding",
  "Partner",
  "Advisor",
  "Pilot user",
  "Government",
  "Other",
];

const STATUS_OPTIONS = ["Scheduled", "Done", "Follow-up needed", "Waiting", "Closed"];

const STATUS_COLORS: Record<string, string> = {
  Scheduled: "bg-blue-100 text-blue-700",
  Done: "bg-green-100 text-green-700",
  "Follow-up needed": "bg-orange-100 text-orange-700",
  Waiting: "bg-yellow-100 text-yellow-700",
  Closed: "bg-gray-100 text-gray-500",
};

interface FormData {
  date: string;
  contact: string;
  organization: string;
  type: string;
  notes: string;
  followUp: string;
  status: string;
}

const EMPTY_FORM: FormData = {
  date: new Date().toISOString().split("T")[0],
  contact: "",
  organization: "",
  type: "Funding",
  notes: "",
  followUp: "",
  status: "Scheduled",
};

export default function MeetingNotes() {
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");

  function fetchNotes() {
    setLoading(true);
    fetch("/api/notes")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setNotes(data.notes || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  function openNewForm() {
    setForm(EMPTY_FORM);
    setEditingRow(null);
    setShowForm(true);
    setSaveStatus(null);
  }

  function openEditForm(note: MeetingNote) {
    setForm({
      date: note.date,
      contact: note.contact,
      organization: note.organization,
      type: note.type,
      notes: note.notes,
      followUp: note.followUp,
      status: note.status,
    });
    setEditingRow(note.rowIndex);
    setShowForm(true);
    setSaveStatus(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus(null);

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowIndex: editingRow,
          ...form,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSaveStatus("Saved!");
      setShowForm(false);
      fetchNotes();
    } catch (err) {
      setSaveStatus(
        err instanceof Error ? err.message : "Failed to save"
      );
    } finally {
      setSaving(false);
    }
  }

  const filtered =
    filterType === "all"
      ? notes
      : notes.filter((n) => n.type === filterType);

  // Sort by date descending (most recent first)
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
        <p className="mt-4 text-sm text-gray-500">Loading meeting notes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
              filterType === "all"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
            }`}
          >
            All ({notes.length})
          </button>
          {MEETING_TYPES.map((type) => {
            const count = notes.filter((n) => n.type === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                  filterType === type
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
                }`}
              >
                {type} ({count})
              </button>
            );
          })}
        </div>
        <button
          onClick={openNewForm}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0"
        >
          + New Meeting
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {editingRow ? "Edit Meeting Note" : "New Meeting Note"}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {MEETING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Contact name
              </label>
              <input
                type="text"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="e.g., Anna Svensson"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Organization
              </label>
              <input
                type="text"
                value={form.organization}
                onChange={(e) =>
                  setForm({ ...form, organization: e.target.value })
                }
                placeholder="e.g., Vinnova, Almi, Science Park"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Notes
              </label>
              <textarea
                rows={4}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="What was discussed? Key takeaways..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Follow-up action
              </label>
              <input
                type="text"
                value={form.followUp}
                onChange={(e) =>
                  setForm({ ...form, followUp: e.target.value })
                }
                placeholder="e.g., Send pitch deck by Friday"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !form.contact}
              className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {saving
                ? "Saving..."
                : editingRow
                  ? "Update Note"
                  : "Save to Spreadsheet"}
            </button>
            {saveStatus && (
              <span
                className={`text-xs font-medium ${
                  saveStatus === "Saved!" ? "text-green-600" : "text-red-600"
                }`}
              >
                {saveStatus}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Notes list */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-2">No meeting notes yet.</p>
          <p className="text-sm text-gray-400">
            Click &quot;+ New Meeting&quot; to log your first meeting.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((note) => (
            <div
              key={note.rowIndex}
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openEditForm(note)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">{note.date}</span>
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {note.type}
                    </span>
                    {note.status && (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          STATUS_COLORS[note.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {note.status}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900">
                    {note.contact}
                    {note.organization && (
                      <span className="font-normal text-gray-500">
                        {" "}
                        -- {note.organization}
                      </span>
                    )}
                  </h4>
                  {note.notes && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {note.notes}
                    </p>
                  )}
                  {note.followUp && (
                    <p className="text-xs text-orange-600 font-medium mt-2">
                      Follow-up: {note.followUp}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  Click to edit
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
