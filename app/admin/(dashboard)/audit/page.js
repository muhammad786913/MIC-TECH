import Link from "next/link";
import { listAudit } from "@/lib/audit";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Audit log",
  description: "MIC TECH administrative audit trail.",
  path: "/admin/audit",
  noindex: true,
});

export default async function AdminAuditPage({ searchParams }) {
  const query = await searchParams;
  const skip = Math.max(0, Number(query?.skip) || 0);
  const action = String(query?.action || "").slice(0, 80);
  const { items, total } = await listAudit({ limit: 50, skip, action });
  const back = Math.max(0, skip - 50);
  const next = skip + 50 < total ? skip + 50 : null;

  return (
    <div className="mx-auto max-w-[1100px]">
      <header>
        <p className="kicker">Accountability</p>
        <h1 className="mt-1 font-display text-4xl">Audit log</h1>
        <p className="mt-1 text-sm text-ivory/70">
          {total} recorded administrative actions. Append-only; visible to administrators only.
        </p>
      </header>

      <form method="get" className="mt-5 flex flex-wrap items-end gap-2 border border-line-dark bg-surface p-4">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="audit-action" className="field-label">Action filter</label>
          <input id="audit-action" name="action" defaultValue={action} className="input" placeholder="article.update, admin.login…" />
        </div>
        <button type="submit" className="btn-dark">Filter</button>
        {action ? <Link href="/admin/audit" className="px-2 py-2 text-[11px] uppercase tracking-[0.1em] text-ivory/55 hover:text-gold">Reset</Link> : null}
      </form>

      <div className="mt-4 overflow-x-auto border border-line-dark bg-surface">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-line-dark bg-surface-2/60 text-[10px] uppercase tracking-[0.12em] text-ivory/55">
              <th className="px-4 py-3 font-semibold">When</th>
              <th className="px-4 py-3 font-semibold">Actor</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-dark">
            {items.map((entry, index) => (
              <tr key={`${entry.createdAt}-${index}`}>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-ivory/55">{formatDate(entry.createdAt, { withTime: true })}</td>
                <td className="px-4 py-3 text-xs">
                  <p className="font-medium">{entry.actorName || "system"}</p>
                  <p className="text-ivory/55">{entry.actorEmail}</p>
                </td>
                <td className="px-4 py-3 text-xs font-mono">{entry.action}</td>
                <td className="px-4 py-3 text-xs text-ivory/70">{entry.summary}</td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-ivory/55">No matching audit entries.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <nav aria-label="Audit pages" className="mt-4 flex items-center justify-between text-xs">
        <p className="text-ivory/55">Showing {items.length} of {total}</p>
        <div className="flex gap-2">
          {skip > 0 ? <Link href={`/admin/audit?skip=${back}${action ? `&action=${encodeURIComponent(action)}` : ""}`} className="btn-outline">Newer</Link> : null}
          {next !== null ? <Link href={`/admin/audit?skip=${next}${action ? `&action=${encodeURIComponent(action)}` : ""}`} className="btn-outline">Older</Link> : null}
        </div>
      </nav>
    </div>
  );
}
