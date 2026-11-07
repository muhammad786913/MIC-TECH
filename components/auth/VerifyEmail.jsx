"use client";

import { useEffect, useState } from "react";

export default function VerifyEmail({ token }) {
  const [state, setState] = useState({ status: token ? "loading" : "error", message: token ? "Verifying your emailâ€¦" : "This verification link is missing its token." });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          credentials: "same-origin",
        });
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (!response.ok) throw new Error(data.error || "Could not verify this link.");
        setState({ status: "done", message: data.message || "Email verified." });
      } catch (error) {
        if (!cancelled) setState({ status: "error", message: error.message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const tone =
    state.status === "error"
      ? "border-red-500/30 bg-red-900/10 text-red-400"
      : state.status === "done"
        ? "border-gold/40 bg-surface-2/60 text-ivory/70"
        : "border-line-dark bg-surface text-ivory/55";

  return (
    <div className={`border p-5 text-sm ${tone}`}>
      <p role="status">{state.message}</p>
      {state.status === "done" ? (
        <a href="/login" className="btn-gold mt-4 inline-flex">Continue to sign in</a>
      ) : null}
      {state.status === "error" ? (
        <a href="/login" className="mt-4 inline-block text-xs font-semibold uppercase tracking-[0.1em] text-gold">
          Back to sign in â†’
        </a>
      ) : null}
    </div>
  );
}

