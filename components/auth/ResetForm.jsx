"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetForm({ token }) {
  const router = useRouter();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [state, setState] = useState({ status: "idle", message: "" });

  async function submit(event) {
    event.preventDefault();
    if (form.password !== form.confirm) {
      setState({ status: "error", message: "Passwords do not match." });
      return;
    }
    setState({ status: "loading", message: "" });
    try {
      const response = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password }),
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not reset your password.");
      setState({ status: "done", message: data.message || "Password updated." });
      window.setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1400);
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  }

  if (!token) {
    return (
      <div className="border border-red-500/30 bg-red-900/10 p-4 text-sm text-red-400">
        This reset link is missing its token. Request a new link from{" "}
        <a href="/forgot-password" className="underline">forgot password</a>.
      </div>
    );
  }

  if (state.status === "done") {
    return <p className="border border-gold/40 bg-surface-2/60 p-4 text-sm text-ivory/70">{state.message} Redirecting to sign inâ€¦</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="reset-password" className="field-label">New password</label>
        <input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={128}
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          className="input"
        />
      </div>
      <div>
        <label htmlFor="reset-confirm" className="field-label">Confirm new password</label>
        <input
          id="reset-confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={128}
          value={form.confirm}
          onChange={(event) => setForm({ ...form, confirm: event.target.value })}
          className="input"
        />
      </div>
      <p className="text-[11px] text-ivory/55">At least 10 characters, including a letter and a number.</p>
      {state.message ? (
        <p role="alert" className="border border-red-500/30 bg-red-900/10 p-2.5 text-xs text-red-400">{state.message}</p>
      ) : null}
      <button type="submit" disabled={state.status === "loading"} className="btn-gold w-full disabled:opacity-60">
        {state.status === "loading" ? "Updatingâ€¦" : "Update password"}
      </button>
    </form>
  );
}


