"use client";

import { useState } from "react";
import { Turnstile } from "@/components/ui/Turnstile";
import { cloudflarePublic } from "@/lib/config";

export default function ForgotForm() {
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [state, setState] = useState({ status: "idle", message: "", devLink: "" });

  async function submit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "", devLink: "" });
    try {
      const response = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not send the reset email.");
      setState({ status: "done", message: data.message, devLink: data.devLink || "" });
    } catch (error) {
      setState({ status: "error", message: error.message, devLink: "" });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="forgot-email" className="field-label">Email address</label>
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="input"
        />
      </div>
      <Turnstile
        siteKey={cloudflarePublic.turnstileSiteKey}
        onVerify={(token) => setTurnstileToken(token)}
      />
      {state.message ? (
        <div className={state.status === "error" ? "border border-red-500/30 bg-red-900/10 p-3 text-xs text-red-400" : "border border-gold/40 bg-surface-2/60 p-3 text-xs text-ivory/70"}>
          <p>{state.message}</p>
          {state.devLink ? (
            <p className="mt-2 break-all">
              Development link:{" "}
              <a href={state.devLink} className="link-gold font-semibold">reset password</a>
            </p>
          ) : null}
        </div>
      ) : null}
      <button type="submit" disabled={state.status === "loading"} className="btn-gold w-full disabled:opacity-60">
        {state.status === "loading" ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
