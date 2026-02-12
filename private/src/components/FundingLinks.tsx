"use client";

import { useState } from "react";

interface FundingSource {
  name: string;
  org: string;
  description: string;
  amount: string;
  deadline: string;
  url: string;
  relevance: "high" | "medium" | "low";
  category: "grant" | "loan" | "accelerator" | "eu";
}

const FUNDING_SOURCES: FundingSource[] = [
  // --- HIGH RELEVANCE ---
  {
    name: "Innovativa Startups",
    org: "Vinnova",
    description:
      "For knowledge-intensive, newly started companies with innovative business ideas. Perfect fit for NordiqFlow's AI matching tech.",
    amount: "Up to 500,000 SEK",
    deadline: "Rolling (projects must end by Aug 25, 2026)",
    url: "https://www.vinnova.se/en/calls-for-proposals/innovative-startups/innovative-startups-2025/",
    relevance: "high",
    category: "grant",
  },
  {
    name: "Advanced and Innovative AI",
    org: "Vinnova",
    description:
      "Development of advanced and innovative AI solutions. NordiqFlow's ML matching algorithm qualifies.",
    amount: "Varies by project",
    deadline: "Check current calls",
    url: "https://www.vinnova.se/en/calls-for-proposals/ai-from-research-to-innovation/advanced-and-innovative-ai/",
    relevance: "high",
    category: "grant",
  },
  {
    name: "Mikrolån (Micro Loan)",
    org: "Almi",
    description:
      "Quick startup loan, can fund 100% of capital needs. Only 10% personal guarantee.",
    amount: "Up to 250,000 SEK",
    deadline: "Apply anytime (3-4 week processing)",
    url: "https://www.almi.se/en/loan/",
    relevance: "high",
    category: "loan",
  },
  {
    name: "Startup Loan",
    org: "Almi",
    description:
      "Larger loans for startups, often without collateral requirements.",
    amount: "Up to 3,000,000 SEK",
    deadline: "Apply anytime (3-4 week processing)",
    url: "https://www.almi.se/en/loan/",
    relevance: "high",
    category: "loan",
  },
  {
    name: "Innovationscheckar (Innovation Vouchers)",
    org: "Almi / Vinnova",
    description:
      "Purchase external expertise for business development, IP strategy, and test-beds.",
    amount: "Up to 100,000 SEK (standard) / 400,000 SEK (infrastructure)",
    deadline: "Rolling",
    url: "https://www.almi.se/en/",
    relevance: "high",
    category: "grant",
  },
  // --- MEDIUM RELEVANCE ---
  {
    name: "EIC Accelerator",
    org: "European Innovation Council",
    description:
      "EU's flagship program for deep-tech and high-risk innovation startups. Grant + equity combo.",
    amount: "Up to 2.5M EUR (grant) + 10M EUR (equity)",
    deadline: "Mar 4, May 6, Jul 8, Sep 2, Nov 4, 2026",
    url: "https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en",
    relevance: "medium",
    category: "eu",
  },
  {
    name: "Horizon Europe - Digital & AI",
    org: "European Commission",
    description:
      "AI, digital innovation and industrial applications. Includes GenAI4EU initiative.",
    amount: "4-19M EUR per project (consortium)",
    deadline: "April 15, 2026",
    url: "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home",
    relevance: "medium",
    category: "eu",
  },
  {
    name: "Google for Startups Accelerator: Europe",
    org: "Google",
    description:
      "3-month virtual accelerator for AI-first startups (Seed to Series A). Equity-free with mentoring and Google AI access.",
    amount: "Equity-free (mentoring + resources)",
    deadline: "Check application windows",
    url: "https://startup.google.com/programs/accelerator/europe/",
    relevance: "medium",
    category: "accelerator",
  },
  {
    name: "Industrial Applied AI",
    org: "Vinnova",
    description:
      "Industry-driven digital solutions through advanced digitalization.",
    amount: "Varies (12-24 month projects)",
    deadline: "Check current calls",
    url: "https://www.vinnova.se/en/calls-for-proposals/advanced-digitalization-industrial-2024-04161/industrial-applied-ai-by-advanced-digitalization/",
    relevance: "medium",
    category: "grant",
  },
  {
    name: "Nordic Innovation",
    org: "Nordic Council of Ministers",
    description:
      "Cross-border Nordic projects in green transition, deep-tech, and data collaboration.",
    amount: "200,000 NOK (step 1)",
    deadline: "Check open calls",
    url: "https://www.nordicinnovation.org/",
    relevance: "medium",
    category: "grant",
  },
  // --- LOWER BUT USEFUL ---
  {
    name: "Tillväxtverket Grants",
    org: "Tillväxtverket",
    description:
      "Business development, export, and sustainability grants for SMEs.",
    amount: "Up to 2,000,000 SEK",
    deadline: "Rolling calls",
    url: "https://tillvaxtverket.se/tillvaxtverket/inenglish/financing.2911.html",
    relevance: "low",
    category: "grant",
  },
  {
    name: "Regional ERUF Funding",
    org: "EU / Regional",
    description:
      "European Regional Development Fund grants distributed through Swedish regions.",
    amount: "Up to 40% of project costs",
    deadline: "Varies by region",
    url: "https://www.regionstockholm.se/",
    relevance: "low",
    category: "eu",
  },
  {
    name: "Feasibility Study Fund",
    org: "Almi",
    description: "Small grants for feasibility studies and early validation.",
    amount: "Up to 35,000 SEK",
    deadline: "Apply anytime",
    url: "https://www.almi.se/en/",
    relevance: "low",
    category: "grant",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  grant: "Grants",
  loan: "Loans",
  eu: "EU Funding",
  accelerator: "Accelerators",
};

const RELEVANCE_STYLES: Record<string, string> = {
  high: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function FundingLinks() {
  const [filter, setFilter] = useState<string>("all");

  const filtered =
    filter === "all"
      ? FUNDING_SOURCES
      : FUNDING_SOURCES.filter((s) => s.category === filter);

  const categories = ["all", "grant", "loan", "eu", "accelerator"];

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
              filter === cat
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
            }`}
          >
            {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Funding cards */}
      <div className="space-y-3">
        {filtered.map((source, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">
                    {source.name}
                  </h3>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${RELEVANCE_STYLES[source.relevance]}`}
                  >
                    {source.relevance}
                  </span>
                </div>
                <p className="text-sm text-indigo-600 font-medium mb-2">
                  {source.org}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  {source.description}
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>
                    <span className="font-semibold text-gray-700">Amount:</span>{" "}
                    {source.amount}
                  </span>
                  <span>
                    <span className="font-semibold text-gray-700">
                      Deadline:
                    </span>{" "}
                    {source.deadline}
                  </span>
                </div>
              </div>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Apply
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Useful links */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">
          Useful Resources
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <a
            href="https://www.vinnova.se/en/apply-for-funding/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800"
          >
            Vinnova -- All Open Calls
          </a>
          <a
            href="https://www.almi.se/en/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800"
          >
            Almi -- Loans & Venture Capital
          </a>
          <a
            href="https://eic.ec.europa.eu/eic-funding-opportunities_en"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800"
          >
            EIC -- All Funding Opportunities
          </a>
          <a
            href="https://www.sisp.se/en/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800"
          >
            SISP -- Science Parks & Incubators
          </a>
          <a
            href="https://tillvaxtverket.se/tillvaxtverket/inenglish/financing.2911.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800"
          >
            Tillväxtverket -- Regional Grants
          </a>
          <a
            href="https://www.nordicinnovation.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800"
          >
            Nordic Innovation
          </a>
        </div>
      </div>
    </div>
  );
}
