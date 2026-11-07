"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

export default function EngagementBar({
  articleId,
  title,
  path,
  initial = {},
  signedIn = false,
}) {
  const [likes, setLikes] = useState(Number(initial.likes || 0));
  const [bookmarks, setBookmarks] = useState(Number(initial.bookmarks || 0));
  const [liked, setLiked] = useState(Boolean(initial.liked));
  const [bookmarked, setBookmarked] = useState(Boolean(initial.bookmarked));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  async function toggle(action) {
    setBusy(action);
    setMessage("");
    try {
      const response = await fetch("/api/engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, action }),
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save your reaction.");
      if (action === "like") {
        setLiked(Boolean(data.active));
        setLikes(Number(data.count || 0));
      } else {
        setBookmarked(Boolean(data.active));
        setBookmarks(Number(data.count || 0));
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy("");
    }
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : path;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("Link copied to clipboard.");
      }
      fetch("/api/analytics/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "share", path, articleId }),
        credentials: "same-origin",
        keepalive: true,
      }).catch(() => {});
    } catch (error) {
      if (error?.name !== "AbortError") setMessage("Sharing is unavailable in this browser.");
    }
  }

  return (
    <div className="border-y border-line-dark py-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => toggle("like")}
          aria-pressed={liked}
          disabled={busy === "like"}
          className={`inline-flex items-center gap-2 border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition-colors disabled:opacity-60 ${
            liked
              ? "border-gold bg-gold text-night"
              : "border-line-dark bg-surface text-ivory hover:border-gold"
          }`}
        >
          <Icon name="heart" size={15} />
          {liked ? "Liked" : "Like"}
          <span className="tabular-nums">{likes}</span>
        </button>

        <button
          type="button"
          onClick={() => toggle("bookmark")}
          aria-pressed={bookmarked}
          disabled={busy === "bookmark"}
          className={`inline-flex items-center gap-2 border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition-colors disabled:opacity-60 ${
            bookmarked
              ? "border-gold bg-gold text-night"
              : "border-line-dark bg-surface text-ivory hover:border-gold"
          }`}
        >
          <Icon name="bookmark" size={15} />
          {bookmarked ? "Saved" : "Save"}
          <span className="tabular-nums">{bookmarks}</span>
        </button>

        <button
          type="button"
          onClick={share}
          className="inline-flex items-center gap-2 border border-line-dark bg-surface px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-ivory transition-colors hover:border-gold"
        >
          <Icon name="share" size={15} /> Share
        </button>

        <a
          href="#comments"
          className="inline-flex items-center gap-2 border border-line-dark bg-surface px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-ivory transition-colors hover:border-gold"
        >
          <Icon name="comment" size={15} /> {Number(initial.comments || 0)} comments
        </a>
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-4 text-xs text-ivory/55">
        {message}
      </p>
    </div>
  );
}
