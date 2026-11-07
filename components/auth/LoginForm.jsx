"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Turnstile } from "@/components/ui/Turnstile";
import { cloudflarePublic } from "@/lib/config";

function safeNext(value) {
  const next = String(value || "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [form, setForm] = useState({ identifier: "", password: "", turnstileToken: "" });
  const [state, setState] = useState({ status: "idle", message: "" });
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
    setState({ status: "loading", message: "" });
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form }),
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not sign in.");
      router.push(next);
      router.refresh();
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="login-identifier" className="field-label">Email or username</label>
        <input
          id="login-identifier"
          name="identifier"
          autoComplete="username"
          required
          value={form.identifier}
          onChange={(event) => setForm({ ...form, identifier: event.target.value })}
          className="input"
        />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="login-password" className="field-label">Password</label>
          <a href="/forgot-password" className="mb-1.5 text-[11px] text-ivory/55 hover:text-gold">
            Forgot password?
          </a>
        </div>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          className="input"
        />
      </div>
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
        {state.status === "loading" ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
