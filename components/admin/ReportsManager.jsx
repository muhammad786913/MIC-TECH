"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ReportsManager({ reports = [] }) {
  const router = useRouter();
  const [state, setState] = useState({ id: "", message: "" });

  async function resolve(id, status) {
    setState({ id, message: "" });
    try {
      const response = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not update the report.");
      router.refresh();
    } catch (error) {
      setState({ id, message: error.message });
    }
  }

  if (!reports.length) {
    return (
      <div className="border border-dashed border-line-dark p-10 text-center">
        <p className="font-display text-2xl">No open reports</p>
        <p className="mt-1 text-sm text-ivory/55">Reader reports about articles and comments appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <article key={report._id} className="border border-line-dark bg-surface p-4">
          <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.1em] text-ivory/55">
            <span className="border border-line-dark px-1.5 py-0.5 font-semibold">{report.targetType}</span>
            <span className="font-semibold text-ivory">{report.reason}</span>
            <span>{new Date(report.createdAt).toLocaleString()}</span>
            <span className={report.status === "open" ? "text-amber-400" : "text-gold"}>{report.status}</span>
          </div>
          {report.details ? <p className="mt-2 text-sm text-ivory/70">{report.details}</p> : null}
          <p className="mt-1 text-[11px] text-ivory/55">
            Target: {String(report.targetId || "").slice(0, 40)} Â· reported by {report.reporterEmail || "reader"}
          </p>
          {report.targetType === "article" ? (
            <Link href={`/admin/articles/${report.targetId}`} className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-[0.1em] text-gold">
              Open article â†’
            </Link>
          ) : (
            <Link href="/admin/comments" className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-[0.1em] text-gold">
              Open comments â†’
            </Link>
          )}
          {state.id === report._id && state.message ? <p className="mt-2 text-xs text-red-400">{state.message}</p> : null}
          <div className="mt-3 flex gap-3 border-t border-line-dark pt-3 text-[10px] font-semibold uppercase tracking-[0.1em]">
            <button type="button" onClick={() => resolve(report._id, "resolved")} className="text-gold">Mark resolved</button>
            <button type="button" onClick={() => resolve(report._id, "dismissed")} className="text-ivory/55">Dismiss</button>
            {report.status !== "open" ? (
              <button type="button" onClick={() => resolve(report._id, "open")} className="text-ivory/55">Reopen</button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

