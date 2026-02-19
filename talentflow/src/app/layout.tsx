import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalentFlow — Din AI-drivna jobbassistent",
  description:
    "Hitta jobb du faktiskt passar for, skapa anpassade CV:n och sok smartare med AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
