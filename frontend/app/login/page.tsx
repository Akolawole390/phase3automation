"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Incorrect username or password");
      }
      const dest = searchParams.get("from") || "/";
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 360,
        margin: "6rem auto",
        padding: "0 1.5rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>Research Agent</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoFocus
          required
          autoComplete="username"
          style={{ padding: "0.6rem", fontSize: "1rem", border: "1px solid #ccc", borderRadius: 4 }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          autoComplete="current-password"
          style={{ padding: "0.6rem", fontSize: "1rem", border: "1px solid #ccc", borderRadius: 4 }}
        />
        <button
          type="submit"
          disabled={isSubmitting || !username || !password}
          style={{
            padding: "0.6rem 1rem",
            fontSize: "1rem",
            cursor: isSubmitting || !username || !password ? "not-allowed" : "pointer",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 4,
          }}
        >
          {isSubmitting ? "Checking…" : "Enter"}
        </button>
      </form>
      {error && <p style={{ color: "crimson", marginTop: "0.75rem" }}>{error}</p>}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
