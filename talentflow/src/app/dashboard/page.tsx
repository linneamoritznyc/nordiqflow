import Nav from "@/components/layout/Nav";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Oversikt</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Skill Profile */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Din kompetens</h2>
              <Link
                href="/profile"
                className="text-sm text-blue-600 hover:underline"
              >
                Redigera
              </Link>
            </div>
            <p className="text-gray-500 text-sm">
              Ladda upp ditt CV for att borja.
            </p>
            <Link
              href="/profile/upload"
              className="mt-4 inline-block bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Ladda upp CV
            </Link>
          </div>

          {/* Top Job Matches */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Basta jobben for dig</h2>
              <Link
                href="/jobs"
                className="text-sm text-blue-600 hover:underline"
              >
                Se alla
              </Link>
            </div>
            <p className="text-gray-500 text-sm">
              Ladda upp ditt CV sa matchar vi jobb mot dina kompetenser.
            </p>
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Ansokningar</h2>
              <Link
                href="/applications"
                className="text-sm text-blue-600 hover:underline"
              >
                Se alla
              </Link>
            </div>
            <p className="text-gray-500 text-sm">
              Inga ansokningar an. Borja med att hitta ett jobb.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
