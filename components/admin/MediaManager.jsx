"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MediaManager({ items = [] }) {
  const router = useRouter();
  const [state, setState] = useState({ status: "idle", message: "" });

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setState({ status: "uploading", message: "Uploadingâ€¦" });
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/media", { method: "POST", body: form, credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Upload failed.");
      setState({ status: "done", message: "Uploaded." });
      router.refresh();
    } catch (error) {
      setState({ status: "error", message: error.message });
    } finally {
      event.target.value = "";
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this media file? This cannot be undone.")) return;
    setState({ status: "working", message: "Deletingâ€¦" });
    try {
      const response = await fetch(`/api/admin/media/${id}`, { method: "DELETE", credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not delete the file.");
      setState({ status: "done", message: "Deleted." });
      router.refresh();
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  }

  async function copy(url) {
    try {
      await navigator.clipboard.writeText(url);
      setState({ status: "done", message: "URL copied to clipboard." });
    } catch {
      setState({ status: "error", message: "Could not copy automatically. Select the URL manually." });
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border border-line-dark bg-surface p-4">
        <label className="btn-gold cursor-pointer">
          Upload file
          <input type="file" className="sr-only" onChange={upload} accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,application/pdf" />
        </label>
        <p className="text-xs text-ivory/55">JPG, PNG, WebP, AVIF, GIF, MP4 or PDF. Validated by type, magic bytes and size.</p>
        {state.message ? (
          <p role="status" className={`text-xs ${state.status === "error" ? "text-red-400" : "text-gold"}`}>{state.message}</p>
        ) : null}
      </div>

      {items.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((media) => (
            <figure key={media._id} className="border border-line-dark bg-surface">
              <div className="grid aspect-[4/3] place-items-center overflow-hidden bg-surface-2">
                {media.resourceType === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={media.url} alt={media.alt || media.originalName} className="h-full w-full object-cover" />
                ) : (
                  <span className="px-3 text-center text-xs uppercase tracking-[0.1em] text-ivory/55">{media.resourceType} Â· {media.format}</span>
                )}
              </div>
              <figcaption className="p-3">
                <p className="truncate text-xs font-medium" title={media.originalName}>{media.originalName}</p>
                <p className="mt-0.5 text-[10px] text-ivory/55">{Math.round((media.bytes || 0) / 1024)} KB Â· {media.provider}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.1em]">
                  <button type="button" onClick={() => copy(media.url)} className="text-gold">Copy URL</button>
                  <a href={media.url} target="_blank" rel="noreferrer" className="text-ivory/55">Open</a>
                  <button type="button" onClick={() => remove(media._id)} className="text-red-400">Delete</button>
                </div>
                <p className="mt-1 truncate text-[10px] text-ivory/55">{media.url}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="mt-4 border border-dashed border-line-dark p-10 text-center">
          <p className="font-display text-2xl">No media yet</p>
          <p className="mt-1 text-sm text-ivory/55">Upload an image, video or PDF to use in stories.</p>
        </div>
      )}
    </div>
  );
}

