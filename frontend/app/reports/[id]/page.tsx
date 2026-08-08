"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

type ReportDetail = {
  id: string;
  createdAt: string;
  topic: string;
  focus: string;
  recency: string;
  status: string;
  sourceCount: number;
  title: string;
  markdown: string;
};

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/reports/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "Report not found" : `Request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => setReport(data.report))
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"));
  }, [params.id]);

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "2rem 1.5rem 4rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <Link href="/reports" style={{ fontSize: "0.9rem" }}>
        ← My reports
      </Link>

      {error && <p style={{ color: "crimson", marginTop: "1rem" }}>Error: {error}</p>}
      {!report && !error && <p style={{ marginTop: "1rem" }}>Loading…</p>}

      {report && (
        <article style={{ marginTop: "1rem", lineHeight: 1.6 }}>
          <ReactMarkdown>{report.markdown}</ReactMarkdown>
        </article>
      )}
    </main>
  );
}
