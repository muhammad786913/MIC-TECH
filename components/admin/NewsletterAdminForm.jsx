"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewsletterAdminForm({ stats }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ status: "idle", message: "" });

  async function submit(event) {
    event.preventDefault();
    setState({ status: "saving", message: "" });
    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not add the subscriber.");
      setState({ status: "done", message: data.already ? "That address is already subscribed." : "Subscriber added." });
      setEmail("");
      router.refresh();
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="border border-line-dark bg-surface p-5">
        <p className="kicker">Audience</p>
        <h2 className="mt-1 font-display text-2xl">{stats.subscribed} active subscribers</h2>
        <p className="mt-2 text-sm text-ivory/70">
          {stats.total} addresses in total. Double opt-in and unsubscribe links require an email
          provider; configure one before launch. No subscriber email is exposed publicly.
        </p>
        <form onSubmit={submit} className="mt-5 flex flex-wrap items-end gap-2">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="newsletter-add" className="field-label">Add subscriber manually</label>
            <input id="newsletter-add" type="email" required className="input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="reader@example.com" />
          </div>
          <button type="submit" disabled={state.status === "saving"} className="btn-gold disabled:opacity-60">
            {state.status === "saving" ? "Addingâ€¦" : "Add"}
          </button>
        </form>
        {state.message ? (
          <p role="status" className={`mt-3 border p-2.5 text-xs ${state.status === "error" ? "border-red-500/30 bg-red-900/10 text-red-400" : "border-gold/40 bg-surface-2/60 text-ivory/70"}`}>{state.message}</p>
        ) : null}
      </div>
      <div className="border border-line-dark bg-surface p-5">
        <p className="kicker">Delivery</p>
        <h2 className="mt-1 font-display text-xl">Email provider</h2>
        <p className="mt-2 text-sm text-ivory/70">
          Set <code className="rounded bg-surface-2 px-1">RESEND_API_KEY</code> and{" "}
          <code className="rounded bg-surface-2 px-1">MAIL_FROM</code> to send verification and reset
          emails. Without them, development links are shown in the UI instead.
        </p>
      </div>
    </div>
  );
}

