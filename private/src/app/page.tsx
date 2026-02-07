import { Timeline } from "@/components/Timeline";

export default function Home() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Project Timeline</h1>
        <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
          Synced from your{" "}
          <a
            href="https://docs.google.com/spreadsheets/d/1y-PAizoHyBlavtBO4y3Yi492TCbGeqUEC-q4J7zp7u4/edit"
            target="_blank"
            rel="noopener noreferrer"
          >
            planning spreadsheet
          </a>
        </p>
      </div>
      <Timeline />
    </div>
  );
}
