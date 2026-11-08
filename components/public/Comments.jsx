"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { timeAgo } from "@/lib/utils";

function Avatar({ name }) {
  const initials = String(name || "Reader")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 font-display text-xs font-semibold text-gold">
      {initials || "R"}
    </span>
  );
}

function CommentForm({ articleId, parentId = null, onPosted, onCancel, autoFocus = false }) {
  const [body, setBody] = useState("");
  const [state, setState] = useState({ status: "idle", message: "" });

  async function submit(event) {
    event.preventDefault();
    if (state.status === "loading") return;
    setState({ status: "loading", message: "" });
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, body, parentId }),
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not post your comment.");
      setBody("");
      onPosted?.(data.comment, data.status, parentId);
      setState({
        status: "done",
        message:
          data.status === "approved"
            ? "Comment published."
            : "Comment submitted for moderation. It will appear once approved.",
      });
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  }

  return (
    <form onSubmit={submit} className="mt-3">
      <label htmlFor={`comment-${parentId || "root"}`} className="sr-only">
        {parentId ? "Write a reply" : "Write a comment"}
      </label>
      <textarea
        id={`comment-${parentId || "root"}`}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        required
        minLength={2}
        maxLength={2000}
        rows={parentId ? 3 : 4}
        autoFocus={autoFocus}
        placeholder={parentId ? "Write a reply…" : "Join the conversation. Keep it civil and on topic."}
        className="input resize-y"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={state.status === "loading"} className="btn-dark disabled:opacity-60">
          {state.status === "loading" ? "Posting…" : parentId ? "Post reply" : "Post comment"}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="text-xs font-semibold uppercase tracking-[0.1em] text-ivory/55 hover:text-ivory">
            Cancel
          </button>
        ) : null}
        <span className="text-[11px] text-ivory/55">Comments are moderated. Links are limited to two.</span>
      </div>
      {state.message ? (
        <p
          role="status"
          className={`mt-2 text-xs ${state.status === "error" ? "text-red-400" : "text-gold"}`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function CommentItem({ comment, articleId, signedIn, onPosted, depth = 0 }) {
  const [replying, setReplying] = useState(false);
  return (
    <li className={depth > 0 ? "mt-5 border-l border-line-dark pl-4 sm:pl-6" : "border-b border-line-dark pb-5"}>
      <div className="flex gap-3">
        <Avatar name={comment.userName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-sm font-semibold">{comment.userName}</span>
            <span className="text-[11px] text-ivory/55">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="mt-1 whitespace-pre-line font-body text-[15px] leading-relaxed text-ivory/70">
            {comment.body}
          </p>
          {signedIn && depth < 2 ? (
            <button
              type="button"
              onClick={() => setReplying((value) => !value)}
              className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ivory/55 hover:text-gold"
            >
              {replying ? "Cancel reply" : "Reply"}
            </button>
          ) : null}
          {replying ? (
            <CommentForm
              articleId={articleId}
              parentId={comment._id}
              autoFocus
              onCancel={() => setReplying(false)}
              onPosted={(posted, status, parentId) => {
                onPosted?.(posted, status, parentId);
                setReplying(false);
              }}
            />
          ) : null}
          {comment.replies?.length ? (
            <ul className="mt-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  articleId={articleId}
                  signedIn={signedIn}
                  onPosted={onPosted}
                  depth={depth + 1}
                />
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default function Comments({ articleId, path = "/", initial = [], signedIn = false, enabled = true, count = 0 }) {
  const [comments, setComments] = useState(initial);
  const [notice, setNotice] = useState("");

  function addComment(comment, status, parentId) {
    if (!comment) return;
    if (status !== "approved") {
      setNotice("Your comment is awaiting moderation and will appear after review.");
      return;
    }
    setNotice("");
    if (!parentId) {
      setComments((current) => [{ ...comment, replies: [] }, ...current]);
      return;
    }
    setComments((current) =>
      current.map((item) => {
        if (item._id === parentId) {
          return { ...item, replies: [...(item.replies || []), { ...comment, replies: [] }] };
        }
        return {
          ...item,
          replies: (item.replies || []).map((reply) =>
            reply._id === parentId
              ? { ...reply, replies: [...(reply.replies || []), { ...comment, replies: [] }] }
              : reply,
          ),
        };
      }),
    );
  }

  return (
    <section id="comments" className="scroll-mt-24 border-t border-line-dark pt-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl">Comments <span className="text-ivory/55">({count || comments.length})</span></h2>
      </div>

      {!enabled ? (
        <p className="mt-4 border border-line-dark bg-surface-2/60 p-4 text-sm text-ivory/55">
          Comments are closed for this story.
        </p>
      ) : (
        <CommentForm articleId={articleId} onPosted={addComment} />
      )}

      {notice ? (
        <p role="status" className="mt-3 text-xs text-gold">
          {notice}
        </p>
      ) : null}

      {comments.length ? (
        <ul className="mt-6 space-y-5">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              articleId={articleId}
              signedIn={signedIn}
              onPosted={addComment}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-6 border border-dashed border-line-dark p-6 text-center text-sm text-ivory/55">
          No comments yet. Be the first to add context.
        </p>
      )}
    </section>
  );
}
