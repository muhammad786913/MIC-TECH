"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", code: "" });
  const [needsMfa, setNeedsMfa] = useState(false);
  const [state, setState] = useState({ status: "idle", message: "" });

  async function submit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "" });
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          code: needsMfa ? form.code : undefined,
        }),
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (data.mfaRequired && !needsMfa) {
        setNeedsMfa(true);
        setState({ status: "mfa", message: "Enter the 6-digit code from your authenticator app." });
        return;
      }
      if (!response.ok) throw new Error(data.error || "Could not sign in.");
      router.push("/admin");
      router.refresh();
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="admin-email" className="field-label">Administrator email</label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          required
          className="input"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
      </div>
      <div>
        <label htmlFor="admin-password" className="field-label">Password</label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
      </div>
      {needsMfa ? (
        <div>
          <label htmlFor="admin-code" className="field-label">Authenticator code</label>
          <input
            id="admin-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            className="input tracking-[0.4em]"
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value.replace(/\D/g, "") })}
          />
        </div>
      ) : null}
      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "border border-red-500/30 bg-red-900/10 p-2.5 text-xs text-red-400"
              : "border border-gold/40 bg-surface-2/60 p-2.5 text-xs text-ivory/70"
          }
        >
          {state.message}
        </p>
      ) : null}
      <button type="submit" disabled={state.status === "loading"} className="btn-gold w-full disabled:opacity-60">
        {state.status === "loading" ? "Checking…" : needsMfa ? "Verify and enter newsroom" : "Sign in to newsroom"}
      </button>
      <p className="text-[11px] leading-relaxed text-ivory/55">
        Administrator sessions last 8 hours. Enable two-factor authentication in Settings once you
        are signed in.
      </p>
    </form>
  );
}
