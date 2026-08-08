"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ReportSummary = {
  id: string;
  createdAt: string;
  topic: string;
  focus: string;
  recency: string;
  status: string;
  sourceCount: number;
  title: string;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => setReports(data.reports))
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"));
  }, []);

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "2rem 1.5rem 4rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>My reports</h1>

      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}
      {!reports && !error && <p>Loading…</p>}
      {reports && reports.length === 0 && (
        <p style={{ color: "#555" }}>
          No reports yet. Go <Link href="/">start some research</Link>.
        </p>
      )}

      {reports && reports.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {reports.map((r) => (
            <li key={r.id} style={{ border: "1px solid #ddd", borderRadius: 6, padding: "0.9rem 1rem" }}>
              <Link href={`/reports/${r.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ fontWeight: 600 }}>{r.topic}</div>
                <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.2rem" }}>
                  {new Date(r.createdAt).toLocaleDateString()} · {r.sourceCount} sources · {r.status}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
