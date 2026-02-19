import Nav from "@/components/layout/Nav";

const COLUMNS = [
  { key: "saved", label: "Sparade", color: "bg-gray-100" },
  { key: "applied", label: "Ansokta", color: "bg-blue-50" },
  { key: "interview", label: "Intervju", color: "bg-yellow-50" },
  { key: "offer", label: "Erbjudande", color: "bg-green-50" },
];

export default function ApplicationsPage() {
  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Ansokningar</h1>

        {/* Kanban board */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.key} className={`${col.color} rounded-lg p-4 min-h-64`}>
              <h2 className="font-semibold text-sm text-gray-700 mb-3">
                {col.label}
              </h2>
              <p className="text-xs text-gray-400">
                Dra jobb hit eller klicka pa ett jobb for att andra status.
              </p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
