"use client";

import { useState } from "react";

export default function MediaField({ value, onChange, label = "Media URL", accept = "image/*" }) {
  const [state, setState] = useState({ status: "idle", message: "" });

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setState({ status: "uploading", message: "" });
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Upload failed.");
      onChange(data.media.url);
      setState({ status: "done", message: "Uploaded." });
    } catch (error) {
      setState({ status: "error", message: error.message });
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="flex flex-wrap gap-2">
        <input
          className="input flex-1"
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://â€¦ or /uploads/â€¦"
        />
        <label className="btn-outline cursor-pointer whitespace-nowrap">
          Upload
          <input type="file" accept={accept} onChange={upload} className="sr-only" />
        </label>
      </div>
      {state.message ? (
        <p className={`mt-1 text-[11px] ${state.status === "error" ? "text-red-400" : "text-ivory/55"}`}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

