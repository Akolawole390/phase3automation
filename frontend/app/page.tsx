"use client";

import { useState } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";

type TriggerResponse = {
  runId: string;
  publicAccessToken: string;
};

export default function Home() {
  const [handle, setHandle] = useState<TriggerResponse | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerError, setTriggerError] = useState<string | null>(null);

  const { run, error: realtimeError } = useRealtimeRun(handle?.runId ?? "", {
    accessToken: handle?.publicAccessToken ?? "",
    enabled: !!handle,
  });

  async function handleClick() {
    setIsTriggering(true);
    setTriggerError(null);
    try {
      const res = await fetch("/api/trigger-hello-world", { method: "POST" });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = (await res.json()) as TriggerResponse;
      setHandle(data);
    } catch (err) {
      setTriggerError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsTriggering(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 560,
        margin: "4rem auto",
        padding: "0 1.5rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        Trigger.dev Realtime Demo
      </h1>

      <button
        onClick={handleClick}
        disabled={isTriggering}
        style={{
          padding: "0.6rem 1.2rem",
          fontSize: "1rem",
          cursor: isTriggering ? "not-allowed" : "pointer",
        }}
      >
        {isTriggering ? "Triggering…" : "Trigger hello-world task"}
      </button>

      {triggerError && (
        <p style={{ color: "crimson", marginTop: "1rem" }}>
          Error: {triggerError}
        </p>
      )}

      {handle && (
        <section
          style={{
            marginTop: "2rem",
            borderTop: "1px solid #ddd",
            paddingTop: "1rem",
          }}
        >
          <p>
            <strong>Run ID:</strong> {handle.runId}
          </p>

          {realtimeError && (
            <p style={{ color: "crimson" }}>
              Realtime error: {realtimeError.message}
            </p>
          )}

          {!run && !realtimeError && <p>Connecting to run…</p>}

          {run && (
            <>
              <p>
                <strong>Status:</strong> {run.status}
              </p>
              {run.status === "COMPLETED" && (
                <pre
                  style={{
                    background: "#f5f5f5",
                    padding: "0.75rem",
                    overflowX: "auto",
                  }}
                >
                  {JSON.stringify(run.output, null, 2)}
                </pre>
              )}
              {run.status === "FAILED" && (
                <p style={{ color: "crimson" }}>
                  Task failed. Check the Trigger.dev dashboard for details.
                </p>
              )}
            </>
          )}
        </section>
      )}
    </main>
  );
}
