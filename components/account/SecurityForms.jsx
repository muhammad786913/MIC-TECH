"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PasswordForm() {
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [state, setState] = useState({ status: "idle", message: "" });

  async function submit(event) {
    event.preventDefault();
    if (form.newPassword !== form.confirm) {
      setState({ status: "error", message: "New passwords do not match." });
      return;
    }
    setState({ status: "loading", message: "" });
    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not change your password.");
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      setState({ status: "saved", message: data.message || "Password updated." });
      router.refresh();
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="current-password" className="field-label">Current password</label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          value={form.currentPassword}
          onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="new-password" className="field-label">New password</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            maxLength={128}
            className="input"
            value={form.newPassword}
            onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="field-label">Confirm new password</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            maxLength={128}
            className="input"
            value={form.confirm}
            onChange={(event) => setForm({ ...form, confirm: event.target.value })}
          />
        </div>
      </div>
      {state.message ? (
        <p
          role="status"
          className={state.status === "error" ? "border border-red-500/30 bg-red-900/10 p-2.5 text-xs text-red-400" : "border border-gold/40 bg-surface-2/60 p-2.5 text-xs text-ivory/70"}
        >
          {state.message}
        </p>
      ) : null}
      <button type="submit" disabled={state.status === "loading"} className="btn-gold disabled:opacity-60">
        {state.status === "loading" ? "Updatingâ€¦" : "Update password"}
      </button>
    </form>
  );
}

export function DeleteAccountForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [state, setState] = useState({ status: "idle", message: "" });

  async function submit(event) {
    event.preventDefault();
    if (!confirm) {
      setState({ status: "error", message: "Tick the confirmation box to continue." });
      return;
    }
    setState({ status: "loading", message: "" });
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not close your account.");
      router.push("/");
      router.refresh();
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="font-body text-sm leading-relaxed text-ivory/70">
        Closing your account removes your profile, likes, bookmarks and comment attribution. Your
        published comments remain unless you delete them first. This action cannot be undone.
      </p>
      <div>
        <label htmlFor="delete-password" className="field-label">Confirm with your password</label>
        <input
          id="delete-password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <label className="flex items-start gap-2 text-xs text-ivory/70">
        <input
          type="checkbox"
          checked={confirm}
          onChange={(event) => setConfirm(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#C5A24B]"
        />
        I understand this permanently closes my account.
      </label>
      {state.message ? (
        <p role="alert" className="border border-red-500/30 bg-red-900/10 p-2.5 text-xs text-red-400">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={state.status === "loading"}
        className="border border-red-500/30 bg-red-900/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-red-400 disabled:opacity-60"
      >
        {state.status === "loading" ? "Closingâ€¦" : "Close my account"}
      </button>
    </form>
  );
}


