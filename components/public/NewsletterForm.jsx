"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

export default function NewsletterForm({ compact = false }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ status: "idle", message: "" });

  async function submit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "" });
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not subscribe.");
      setState({
        status: "done",
        message: data.already ? "You are already on the list." : "You are subscribed. Welcome to the briefing.",
      });
      setEmail("");
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  }

  return (
    <form onSubmit={submit} className={compact ? "flex gap-2" : "flex flex-col gap-3 sm:flex-row"}>
      <label htmlFor={compact ? "newsletter-compact" : "newsletter-email"} className="sr-only">
        Email address
      </label>
      <input
        id={compact ? "newsletter-compact" : "newsletter-email"}
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="your@email.com"
        autoComplete="email"
        className={compact ? "input flex-1 !py-2 text-xs" : "input flex-1 !border-ivory/15 !bg-surface/5 !py-3 text-sm !text-ivory placeholder:!text-ivory/40"}
      />
      <button
        type="submit"
        disabled={state.status === "loading"}
        className="btn-gold shine shrink-0 disabled:opacity-60"
      >
        {state.status === "loading" ? "Joiningâ€¦" : "Subscribe"}
        <Icon name="arrow-right" size={14} />
      </button>
      {state.message && (
        <p
          role="status"
          className={
            state.status === "error"
              ? "mt-1 text-xs text-red-400 sm:absolute sm:mt-12"
              : "mt-1 text-xs text-gold-soft sm:absolute sm:mt-12"
          }
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

