"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Timeline" },
  { href: "/log", label: "Daily Log" },
  { href: "/funding", label: "Funding" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      <span
        style={{ fontWeight: 700, marginRight: 16, padding: "8px 0" }}
      >
        NordiqFlow Private
      </span>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? "active" : ""}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
