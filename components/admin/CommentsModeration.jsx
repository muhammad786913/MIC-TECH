"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CommentsModeration({ items = [] }) {
  const router = useRouter();
  const [state, setState] = useState({ id: "", status: "idle", message: "" });

  async function moderate(id, status) {
    setState({ id, status: "working", message: "" });
    try {
      const response = await fetch(`/api/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not moderate the comment.");
      router.refresh();
    } catch (error) {
      setState({ id, status: "error", message: error.message });
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this comment and its replies?")) return;
    setState({ id, status: "working", message: "" });
    try {
      const response = await fetch(`/api/admin/comments/${id}`, { method: "DELETE", credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not delete the comment.");
      router.refresh();
    } catch (error) {
      setState({ id, status: "error", message: error.message });
    }
  }

  if (!items.length) {
    return (
      <div className="border border-dashed border-line-dark p-10 text-center">
        <p className="font-display text-2xl">Nothing to moderate</p>
        <p className="mt-1 text-sm text-ivory/55">New comments appear here for review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((comment) => (
        <article key={comment._id} className="border border-line-dark bg-surface p-4">
          <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.1em] text-ivory/55">
            <span className="font-semibold text-ivory">{comment.userName}</span>
            <span>{new Date(comment.createdAt).toLocaleString()}</span>
            <span className={comment.status === "pending" ? "text-amber-400" : comment.status === "rejected" ? "text-red-400" : "text-gold"}>
              {comment.status}
            </span>
            {comment.article ? (
              <Link href={`/news/${comment.article.slug}`} target="_blank" className="ml-auto text-gold hover:text-ivory">
                {comment.article.title}
              </Link>
            ) : null}
          </div>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ivory/70">{comment.body}</p>
          {comment.parentId ? <p className="mt-1 text-[10px] text-ivory/55">Reply to {comment.parentId.slice(0, 8)}â€¦</p> : null}
          {state.id === comment._id && state.message ? (
            <p role="alert" className="mt-2 text-xs text-red-400">{state.message}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2 border-t border-line-dark pt-3 text-[10px] font-semibold uppercase tracking-[0.1em]">
            <button type="button" onClick={() => moderate(comment._id, "approved")} disabled={state.status === "working"} className="text-gold disabled:opacity-40">Approve</button>
            <button type="button" onClick={() => moderate(comment._id, "pending")} disabled={state.status === "working"} className="text-ivory/55 disabled:opacity-40">Hold</button>
            <button type="button" onClick={() => moderate(comment._id, "rejected")} disabled={state.status === "working"} className="text-amber-800 disabled:opacity-40">Reject</button>
            <button type="button" onClick={() => remove(comment._id)} disabled={state.status === "working"} className="ml-auto text-red-400 disabled:opacity-40">Delete</button>
          </div>
        </article>
      ))}
    </div>
  );
}

