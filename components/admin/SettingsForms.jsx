"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SettingsForm({ settings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    siteName: settings.siteName || "",
    tagline: settings.tagline || "",
    description: settings.description || "",
    contactEmail: settings.contactEmail || "",
    address: settings.address || "",
    maintenanceMessage: settings.maintenanceMessage || "",
    defaultSeoTitle: settings.defaultSeoTitle || "",
    defaultSeoDescription: settings.defaultSeoDescription || "",
    commentsEnabled: settings.commentsEnabled !== false,
    commentsAutoApprove: Boolean(settings.commentsAutoApprove),
    newsletterEnabled: settings.newsletterEnabled !== false,
    breakingTickerEnabled: settings.breakingTickerEnabled !== false,
    maintenanceMode: Boolean(settings.maintenanceMode),
    analyticsRetentionDays: settings.analyticsRetentionDays || 730,
    social: { ...(settings.social || {}) },
  });
  const [state, setState] = useState({ status: "idle", message: "" });

  async function submit(event) {
    event.preventDefault();
    setState({ status: "saving", message: "" });
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, analyticsRetentionDays: Number(form.analyticsRetentionDays) || 730 }),
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save settings.");
      setState({ status: "done", message: "Settings saved." });
      router.refresh();
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset className="border border-line-dark bg-surface p-5">
        <legend className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ivory/55">Identity</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="settings-site-name" className="field-label">Site name</label>
            <input id="settings-site-name" className="input" value={form.siteName} onChange={(event) => setForm({ ...form, siteName: event.target.value })} />
          </div>
          <div>
            <label htmlFor="settings-tagline" className="field-label">Tagline</label>
            <input id="settings-tagline" className="input" value={form.tagline} onChange={(event) => setForm({ ...form, tagline: event.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="settings-description" className="field-label">Description</label>
            <textarea id="settings-description" className="input min-h-[64px]" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <div>
            <label htmlFor="settings-contact" className="field-label">Contact email</label>
            <input id="settings-contact" type="email" className="input" value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} />
          </div>
          <div>
            <label htmlFor="settings-address" className="field-label">Address</label>
            <input id="settings-address" className="input" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
          </div>
        </div>
      </fieldset>

      <fieldset className="border border-line-dark bg-surface p-5">
        <legend className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ivory/55">Social profiles</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            ["x", "X / Twitter"],
            ["facebook", "Facebook"],
            ["instagram", "Instagram"],
            ["youtube", "YouTube"],
            ["linkedin", "LinkedIn"],
          ].map(([key, label]) => (
            <div key={key}>
              <label htmlFor={`settings-social-${key}`} className="field-label">{label}</label>
              <input
                id={`settings-social-${key}`}
                type="url"
                className="input"
                value={form.social[key] || ""}
                onChange={(event) => setForm({ ...form, social: { ...form.social, [key]: event.target.value } })}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="border border-line-dark bg-surface p-5">
        <legend className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ivory/55">Publishing & moderation</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            ["commentsEnabled", "Reader comments enabled"],
            ["commentsAutoApprove", "Auto-approve clean comments (links always held)"],
            ["newsletterEnabled", "Newsletter signup enabled"],
            ["breakingTickerEnabled", "Breaking news ticker"],
            ["maintenanceMode", "Maintenance mode (public site closed)"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-ivory/70">
              <input type="checkbox" checked={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.checked })} className="h-4 w-4 accent-[#C5A24B]" />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-3">
          <label htmlFor="settings-maintenance-message" className="field-label">Maintenance message</label>
          <textarea id="settings-maintenance-message" className="input min-h-[64px]" value={form.maintenanceMessage} onChange={(event) => setForm({ ...form, maintenanceMessage: event.target.value })} />
        </div>
      </fieldset>

      <fieldset className="border border-line-dark bg-surface p-5">
        <legend className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ivory/55">SEO & analytics</legend>
        <div className="mt-3 space-y-3">
          <input className="input" placeholder="Default SEO title" maxLength={70} value={form.defaultSeoTitle} onChange={(event) => setForm({ ...form, defaultSeoTitle: event.target.value })} />
          <textarea className="input min-h-[64px]" placeholder="Default SEO description" maxLength={160} value={form.defaultSeoDescription} onChange={(event) => setForm({ ...form, defaultSeoDescription: event.target.value })} />
          <div>
            <label htmlFor="settings-retention" className="field-label">Analytics retention (days)</label>
            <input id="settings-retention" type="number" min={30} max={3650} className="input max-w-[180px]" value={form.analyticsRetentionDays} onChange={(event) => setForm({ ...form, analyticsRetentionDays: event.target.value })} />
          </div>
        </div>
      </fieldset>

      {state.message ? (
        <p role="status" className={`border p-3 text-sm ${state.status === "error" ? "border-red-500/30 bg-red-900/10 text-red-400" : "border-gold/40 bg-surface-2/60 text-ivory/70"}`}>{state.message}</p>
      ) : null}
      <button type="submit" disabled={state.status === "saving"} className="btn-gold disabled:opacity-60">
        {state.status === "saving" ? "Savingâ€¦" : "Save settings"}
      </button>
    </form>
  );
}

export function MfaManager({ enabled }) {
  const router = useRouter();
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const [state, setState] = useState({ status: "idle", message: "" });

  async function start() {
    setState({ status: "working", message: "" });
    try {
      const response = await fetch("/api/admin/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not start MFA setup.");
      setSetup(data);
      setState({ status: "idle", message: data.message || "" });
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  }

  async function confirm(action) {
    setState({ status: "working", message: "" });
    try {
      const response = await fetch("/api/admin/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, code }),
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not verify the code.");
      setState({ status: "done", message: data.message || "Updated." });
      setSetup(null);
      setCode("");
      router.refresh();
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  }

  return (
    <div className="border border-line-dark bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="kicker">Security</p>
          <h2 className="font-display text-xl">Two-factor authentication</h2>
          <p className="mt-1 text-sm text-ivory/70">
            {enabled ? "TOTP is enabled for this administrator account." : "Add a time-based authenticator code to protect the newsroom."}
          </p>
        </div>
        <span className={`border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${enabled ? "border-gold/50 bg-gold/10 text-gold" : "border-line-dark bg-surface-2 text-ivory/55"}`}>
          {enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      {!enabled && !setup ? (
        <button type="button" onClick={start} disabled={state.status === "working"} className="btn-gold mt-4 disabled:opacity-60">
          Set up authenticator
        </button>
      ) : null}

      {!enabled && setup ? (
        <div className="mt-4 border border-gold/40 bg-surface-2/60 p-4">
          <p className="text-sm text-ivory/70">
            Add this secret to your authenticator app (Google Authenticator, 1Password, Aegis), then enter
            the current 6-digit code.
          </p>
          <p className="mt-2 break-all font-mono text-sm font-semibold">{setup.secret}</p>
          <p className="mt-1 break-all text-[10px] text-ivory/55">{setup.otpauth}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input inputMode="numeric" maxLength={6} pattern="[0-9]{6}" className="input max-w-[160px] tracking-[0.3em]" placeholder="000000" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} />
            <button type="button" onClick={() => confirm("enable")} disabled={state.status === "working"} className="btn-gold disabled:opacity-60">Enable MFA</button>
          </div>
        </div>
      ) : null}

      {enabled ? (
        <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-line-dark pt-4">
          <div>
            <label htmlFor="mfa-disable-code" className="field-label">Authenticator code</label>
            <input id="mfa-disable-code" inputMode="numeric" maxLength={6} className="input max-w-[160px] tracking-[0.3em]" placeholder="000000" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} />
          </div>
          <button type="button" onClick={() => confirm("disable")} disabled={state.status === "working"} className="border border-red-500/30 bg-red-900/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-400 disabled:opacity-60">
            Disable MFA
          </button>
        </div>
      ) : null}

      {state.message ? (
        <p role="status" className={`mt-3 border p-2.5 text-xs ${state.status === "error" ? "border-red-500/30 bg-red-900/10 text-red-400" : "border-gold/40 bg-surface-2/60 text-ivory/70"}`}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}


