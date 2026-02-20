"use client";

import Nav from "@/components/layout/Nav";
import { useState } from "react";

export default function CVUploadPage() {
  const [cvText, setCvText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      let textToSend = cvText;

      // If file uploaded, extract text (send file to API)
      if (file && !cvText) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/parse-cv", {
          method: "POST",
          body: formData,
        });
        const data = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(data.error || "Upload failed");
        setResult(data);
        setLoading(false);
        return;
      }

      // Send text to API
      const res = await fetch("/api/parse-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSend }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Ladda upp ditt CV</h1>
        <p className="text-gray-600 mb-8">
          Ladda upp en PDF eller klistra in texten fran ditt CV. AI analyserar
          dina kompetenser och matchar dem mot Arbetsformedlingens taxonomi.
        </p>

        {!result ? (
          <div className="space-y-6">
            {/* File upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ladda upp PDF
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100"
              />
            </div>

            <div className="text-center text-gray-400 text-sm">eller</div>

            {/* Text paste */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Klistra in CV-text
              </label>
              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                rows={12}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Klistra in texten fran ditt CV har..."
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || (!cvText && !file)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Analyserar ditt CV..." : "Analysera"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                CV analyserat!
              </p>
            </div>

            {/* Skills */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="font-semibold mb-3">Kompetenser</h2>
              <div className="flex flex-wrap gap-2">
                {(
                  (result.skills as { name: string }[]) || []
                ).map((skill: { name: string }, i: number) => (
                  <span
                    key={i}
                    className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="font-semibold mb-3">Erfarenhet</h2>
              {(
                (result.experiences as { title: string; employer: string; start_date: string; end_date: string | null }[]) || []
              ).map(
                (
                  exp: {
                    title: string;
                    employer: string;
                    start_date: string;
                    end_date: string | null;
                  },
                  i: number
                ) => (
                  <div key={i} className="mb-3 last:mb-0">
                    <p className="font-medium">{exp.title}</p>
                    <p className="text-sm text-gray-600">
                      {exp.employer} &middot; {exp.start_date} &ndash;{" "}
                      {exp.end_date || "Nu"}
                    </p>
                  </div>
                )
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  /* TODO: save to profile */
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Spara profil
              </button>
              <button
                onClick={() => setResult(null)}
                className="border border-gray-300 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Analysera igen
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
