"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Oversikt" },
  { href: "/jobs", label: "Jobb" },
  { href: "/resumes", label: "CV:n" },
  { href: "/applications", label: "Ansokningar" },
];

export default function Nav() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-bold text-lg">
            TalentFlow
          </Link>
          <div className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  pathname.startsWith(item.href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <Link
                href="/profile"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {user.user_metadata?.full_name || user.email}
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logga ut
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
