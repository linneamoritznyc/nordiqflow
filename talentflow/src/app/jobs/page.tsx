import Nav from "@/components/layout/Nav";
import Link from "next/link";

export default function JobsPage() {
  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Hitta jobb</h1>

        {/* Search bar */}
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            placeholder="Sok jobb, foretag eller kompetens..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select className="border border-gray-300 rounded-lg px-4 py-2 text-sm">
            <option value="">Alla kommuner</option>
          </select>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            Sok
          </button>
        </div>

        {/* Placeholder for results */}
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">
            Sok efter jobb eller ladda upp ditt CV for att se matchningar.
          </p>
          <Link
            href="/profile/upload"
            className="text-blue-600 hover:underline text-sm"
          >
            Ladda upp CV for att se matchningspoang
          </Link>
        </div>
      </main>
    </>
  );
}
