"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Turnstile } from "@/components/ui/Turnstile";
import { cloudflarePublic } from "@/lib/config";

export default function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", turnstileToken: "" });
  const [state, setState] = useState({ status: "idle", message: "", devLink: "" });
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);
  const onVerify = useCallback((token) => {
    if (formRef.current) {
      setForm({ ...formRef.current, turnstileToken: token });
    }
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (form.password !== form.confirm) {
      setState({ status: "error", message: "Passwords do not match.", devLink: "" });
      return;
    }
    setState({ status: "loading", message: "", devLink: "" });
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          turnstileToken: form.turnstileToken,
        }),
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not create your account.");
      if (data.requiresVerification) {
        setState({
          status: "done",
          message: "Account created. Check your inbox to verify your email address.",
          devLink: data.devLink || "",
        });
        return;
      }
      router.push("/account");
      router.refresh();
    } catch (error) {
      setState({ status: "error", message: error.message, devLink: "" });
    }
  }

  if (state.status === "done") {
    return (
      <div className="border border-gold/40 bg-surface-2/60 p-5">
        <p className="font-display text-xl">One more step</p>
        <p className="mt-2 font-body text-sm leading-relaxed text-ivory/70">{state.message}</p>
        {state.devLink ? (
          <p className="mt-3 break-all text-xs text-ivory/55">
            Development only — email is not configured.{" "}
            <a href={state.devLink} className="link-gold font-semibold">Open verification link</a>
          </p>
        ) : null}
        <a href="/login" className="btn-outline mt-4 inline-flex">Go to sign in</a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="signup-name" className="field-label">Full name</label>
        <input
          id="signup-name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={60}
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className="input"
        />
      </div>
      <div>
        <label htmlFor="signup-email" className="field-label">Email</label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          className="input"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="signup-password" className="field-label">Password</label>
          <input
            id="signup-password"
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
          <label htmlFor="signup-confirm" className="field-label">Confirm</label>
          <input
            id="signup-confirm"
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
      </div>
      <p className="text-[11px] text-ivory/55">At least 10 characters, including a letter and a number.</p>
      <Turnstile
        siteKey={cloudflarePublic.turnstileSiteKey}
        onVerify={onVerify}
      />
      {state.message ? (
        <p role="alert" className="border border-red-500/30 bg-red-900/10 p-2.5 text-xs text-red-400">
          {state.message}
        </p>
      ) : null}
      <button type="submit" disabled={state.status === "loading"} className="btn-gold w-full disabled:opacity-60">
        {state.status === "loading" ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
