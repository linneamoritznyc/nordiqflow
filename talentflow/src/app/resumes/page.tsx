import Nav from "@/components/layout/Nav";
import Link from "next/link";

export default function ResumesPage() {
  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dina CV:n</h1>
          <Link
            href="/resumes/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Skapa nytt CV
          </Link>
        </div>

        {/* Empty state */}
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">
            Du har inga sparade CV:n an. Skapa ditt forsta!
          </p>
          <Link
            href="/resumes/new"
            className="text-blue-600 hover:underline text-sm"
          >
            Skapa anpassat CV
          </Link>
        </div>
      </main>
    </>
  );
}
