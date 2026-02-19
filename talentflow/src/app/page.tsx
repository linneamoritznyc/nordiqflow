import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-4">TalentFlow</h1>
        <p className="text-xl text-gray-600 mb-8">
          Din AI-drivna jobbassistent. Hitta jobb du faktiskt passar for, skapa
          anpassade CV:n och sok smartare.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Kom igang
          </Link>
          <a
            href="https://nordiqflow-hr2n.vercel.app/"
            className="border border-gray-300 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition"
          >
            Las mer
          </a>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Ladda upp ditt CV
            </h3>
            <p className="text-gray-600">
              AI analyserar dina kompetenser och matchar dem mot
              Arbetsformedlingens taxonomi med 8 000+ fardigheter.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Hitta ratt jobb
            </h3>
            <p className="text-gray-600">
              Varje jobb far en matchningspoang baserad pa dina faktiska
              kompetenser — inte bara sokord.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Sok smartare
            </h3>
            <p className="text-gray-600">
              AI skapar anpassade CV:n och personliga brev for varje jobb du
              soker.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
