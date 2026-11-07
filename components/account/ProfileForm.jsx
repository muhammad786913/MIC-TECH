"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({ user }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: user.name || "",
    bio: user.bio || "",
    avatarUrl: user.avatarUrl || "",
    comments: user.notificationPrefs?.comments !== false,
    replies: user.notificationPrefs?.replies !== false,
    newsletter: Boolean(user.notificationPrefs?.newsletter),
    product: Boolean(user.notificationPrefs?.product),
  });
  const [state, setState] = useState({ status: "idle", message: "" });

  async function submit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "" });
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          bio: form.bio,
          avatarUrl: form.avatarUrl,
          notificationPrefs: {
            comments: form.comments,
            replies: form.replies,
            newsletter: form.newsletter,
            product: form.product,
          },
        }),
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save your profile.");
      setState({ status: "saved", message: "Profile saved." });
      router.refresh();
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="profile-name" className="field-label">Display name</label>
          <input
            id="profile-name"
            className="input"
            required
            minLength={2}
            maxLength={60}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </div>
        <div>
          <label htmlFor="profile-avatar" className="field-label">Avatar URL (optional)</label>
          <input
            id="profile-avatar"
            className="input"
            type="url"
            placeholder="https://â€¦"
            value={form.avatarUrl}
            onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })}
          />
        </div>
      </div>
      <div>
        <label htmlFor="profile-bio" className="field-label">Short bio (optional)</label>
        <textarea
          id="profile-bio"
          className="input min-h-[92px]"
          maxLength={300}
          value={form.bio}
          onChange={(event) => setForm({ ...form, bio: event.target.value })}
        />
      </div>
      <fieldset className="border border-line-dark p-4">
        <legend className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ivory/55">
          Email preferences
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ["comments", "Comment activity"],
            ["replies", "Replies to me"],
            ["newsletter", "Weekly briefing"],
            ["product", "Product updates"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-ivory/70">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(event) => setForm({ ...form, [key]: event.target.checked })}
                className="h-4 w-4 accent-[#C5A24B]"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {state.message ? (
        <p
          role="status"
          className={state.status === "error" ? "border border-red-500/30 bg-red-900/10 p-2.5 text-xs text-red-400" : "border border-gold/40 bg-surface-2/60 p-2.5 text-xs text-ivory/70"}
        >
          {state.message}
        </p>
      ) : null}
      <button type="submit" disabled={state.status === "loading"} className="btn-gold disabled:opacity-60">
        {state.status === "loading" ? "Savingâ€¦" : "Save profile"}
      </button>
    </form>
  );
}


