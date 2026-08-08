"use client";

import { useState } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import ReactMarkdown from "react-markdown";

type TriggerResponse = {
  runId: string;
  publicAccessToken: string;
};

type ResearchBriefOutput = {
  reportId: string;
  topic: string;
  title: string;
  generatedDate: string;
  sourceCount: number;
  markdown: string;
  html: string;
  sheetsWriteOk: boolean;
};

function downloadBlob(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const [focus, setFocus] = useState("");
  const [recency, setRecency] = useState("evergreen");
  const [handle, setHandle] = useState<TriggerResponse | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerError, setTriggerError] = useState<string | null>(null);

  const { run, error: realtimeError } = useRealtimeRun(handle?.runId ?? "", {
    accessToken: handle?.publicAccessToken ?? "",
    enabled: !!handle,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setIsTriggering(true);
    setTriggerError(null);
    setHandle(null);
    try {
      const res = await fetch("/api/trigger-research-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, focus: focus || undefined, recency }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed: ${res.status}`);
      }
      const data = (await res.json()) as TriggerResponse;
      setHandle(data);
    } catch (err) {
      setTriggerError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsTriggering(false);
    }
  }

  const output = run?.output as ResearchBriefOutput | undefined;

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "2rem 1.5rem 4rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Research Agent</h1>
      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        Give a topic and get back a structured research brief — Executive
        Summary, Key Findings, Analysis, Recommendations, and Sources.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          Topic
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. AI coding agents in 2026"
            required
            style={{ padding: "0.6rem", fontSize: "1rem", border: "1px solid #ccc", borderRadius: 4 }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          Focus (optional)
          <input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g. market sizing, competitive landscape"
            style={{ padding: "0.6rem", fontSize: "1rem", border: "1px solid #ccc", borderRadius: 4 }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          Recency (optional)
          <select
            value={recency}
            onChange={(e) => setRecency(e.target.value)}
            style={{ padding: "0.6rem", fontSize: "1rem", border: "1px solid #ccc", borderRadius: 4 }}
          >
            <option value="evergreen">Evergreen (no filter)</option>
            <option value="week">Past week</option>
            <option value="month">Past month</option>
            <option value="year">Past year</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={isTriggering || !topic.trim()}
          style={{
            padding: "0.7rem 1.2rem",
            fontSize: "1rem",
            cursor: isTriggering || !topic.trim() ? "not-allowed" : "pointer",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 4,
          }}
        >
          {isTriggering ? "Starting…" : "Start research"}
        </button>
      </form>

      {triggerError && (
        <p style={{ color: "crimson", marginTop: "1rem" }}>Error: {triggerError}</p>
      )}

      {handle && (
        <section style={{ marginTop: "2rem", borderTop: "1px solid #ddd", paddingTop: "1.5rem" }}>
          {realtimeError && (
            <p style={{ color: "crimson" }}>Realtime error: {realtimeError.message}</p>
          )}

          {!run && !realtimeError && <p>Connecting to run…</p>}

          {run && run.status !== "COMPLETED" && run.status !== "FAILED" && (
            <p>
              <strong>Status:</strong> {run.status}
            </p>
          )}

          {run?.status === "FAILED" && (
            <p style={{ color: "crimson" }}>
              Research task failed. Check the Trigger.dev dashboard for details.
            </p>
          )}

          {run?.status === "COMPLETED" && output && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
                <h2 style={{ fontSize: "1.2rem" }}>{output.title}</h2>
                <span style={{ fontSize: "0.85rem", color: "#666" }}>
                  {output.sourceCount} sources
                </span>
              </div>
              {!output.sheetsWriteOk && (
                <p style={{ fontSize: "0.85rem", color: "#a66" }}>
                  Note: couldn&apos;t save this to My reports, but the brief below is complete.
                </p>
              )}
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
                <button
                  onClick={() => downloadBlob(`${output.reportId}.md`, output.markdown, "text/markdown")}
                  style={{ padding: "0.4rem 0.8rem", cursor: "pointer" }}
                >
                  Download .md
                </button>
                <button
                  onClick={() => downloadBlob(`${output.reportId}.html`, output.html, "text/html")}
                  style={{ padding: "0.4rem 0.8rem", cursor: "pointer" }}
                >
                  Download .html
                </button>
              </div>
              <article style={{ lineHeight: 1.6 }}>
                <ReactMarkdown>{output.markdown}</ReactMarkdown>
              </article>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
