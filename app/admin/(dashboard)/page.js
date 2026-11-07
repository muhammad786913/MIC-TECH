import Link from "next/link";
import { getDashboardData } from "@/lib/data/analytics";
import { listReports } from "@/lib/data/comments";
import { buildMetadata } from "@/lib/seo";
import { formatDate, number } from "@/lib/utils";
import { EmptyState, Panel, StatTile, StatusBadge } from "@/components/admin/AdminUI";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Newsroom dashboard",
  description: "MIC TECH editorial dashboard.",
  path: "/admin",
  noindex: true,
});

export default async function AdminDashboardPage() {
  const data = await getDashboardData({ range: "7d" });
  const { analytics, articles, engagement, comments, users, newsletter, health, audit } = data;
  const reports = await listReports({ status: "open", limit: 100 }).catch(() => []);

  return (
    <div className="mx-auto max-w-[1400px]">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Last 7 days</p>
          <h1 className="mt-1 font-display text-4xl">Newsroom overview</h1>
          <p className="mt-1 text-sm text-ivory/70">
            First-party analytics from this deployment only — no invented statistics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/articles/new" className="btn-gold">New story</Link>
          <Link href="/admin/analytics" className="btn-outline">Full analytics</Link>
        </div>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Unique visitors"
          value={number(analytics.totals.visitors)}
          hint={`${number(analytics.totals.pageviews)} pageviews · ${number(analytics.realtime?.visitors || 0)} reading now`}
        />
        <StatTile
          label="Published stories"
          value={number(articles.published)}
          hint={`${articles.draft} drafts · ${articles.scheduled} scheduled · ${articles.archived} archived`}
        />
        <StatTile
          label="Engagement"
          value={number(engagement.likes)}
          hint={`${number(engagement.bookmarks)} bookmarks · ${number(analytics.totals.shares)} shares this week`}
        />
        <StatTile
          label="Reader accounts"
          value={number(users.readers)}
          hint={`${number(users.verified)} verified · ${number(newsletter.subscribed)} newsletter subscribers`}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel
          eyebrow="Attention"
          title="What readers are opening"
          action={<Link href="/admin/analytics" className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">Details →</Link>}
        >
          {analytics.topArticles.length ? (
            <div className="divide-y divide-line-dark">
              {analytics.topArticles.slice(0, 7).map((item, index) => (
                <div key={item.articleId} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="w-5 font-display text-lg text-ivory/55">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.article?.title || "Removed story"}
                    </p>
                    <p className="text-[11px] text-ivory/55">
                      {item.article?.categoryName || "—"} · {number(item.visitors)} visitors
                    </p>
                  </div>
                  <span className="font-display text-lg">{number(item.views)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No pageviews yet">
              Analytics appears once readers visit the public site. Bot traffic is excluded.
            </EmptyState>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel eyebrow="Moderation" title="Needs attention">
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin/comments?status=pending" className="border border-line-dark p-3 hover:border-gold">
                <p className="text-[10px] uppercase tracking-[0.12em] text-ivory/55">Comments</p>
                <p className="mt-1 font-display text-2xl">{comments.pending}</p>
                <p className="text-[11px] text-ivory/55">pending review</p>
              </Link>
              <Link href="/admin/reports" className="border border-line-dark p-3 hover:border-gold">
                <p className="text-[10px] uppercase tracking-[0.12em] text-ivory/55">Reports</p>
                <p className="mt-1 font-display text-2xl">{reports.length}</p>
                <p className="text-[11px] text-ivory/55">open reports</p>
              </Link>
            </div>
            <div className="mt-4 space-y-2 text-xs text-ivory/70">
              <p className="flex items-center justify-between gap-3 border-t border-line-dark pt-3">
                <span>Database</span>
                <span className="text-right">{health.driver} · {health.ok ? "connected" : "unreachable"}</span>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span>Latency</span>
                <span>{health.latencyMs} ms</span>
              </p>
            </div>
          </Panel>

          <Panel eyebrow="Recent activity" title="Audit trail" action={<Link href="/admin/audit" className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">All →</Link>}>
            {audit.length ? (
              <ul className="space-y-2.5">
                {audit.map((entry, index) => (
                  <li key={`${entry.createdAt}-${index}`} className="border-b border-line-dark pb-2 last:border-0 last:pb-0">
                    <p className="text-xs text-ivory/70">{entry.summary || entry.action}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-ivory/55">
                      {entry.actorName || entry.actorEmail || "system"} · {formatDate(entry.createdAt, { withTime: true })}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ivory/55">No administrative actions recorded yet.</p>
            )}
          </Panel>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel eyebrow="Pipeline" title="Editorial status">
          <ul className="space-y-2 text-sm">
            {[
              ["Published", articles.published, "published"],
              ["Scheduled", articles.scheduled, "scheduled"],
              ["Drafts", articles.draft, "draft"],
              ["Archived", articles.archived, "archived"],
            ].map(([label, value, status]) => (
              <li key={label} className="flex items-center justify-between gap-3 border-b border-line-dark pb-2 last:border-0 last:pb-0">
                <span className="flex items-center gap-2"><StatusBadge status={status} /> {label}</span>
                <span className="font-display text-lg">{number(value)}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel eyebrow="Categories" title="Desk activity">
          <ul className="space-y-2 text-sm">
            {data.categories.slice(0, 6).map((category) => (
              <li key={category._id} className="flex items-center justify-between gap-3 border-b border-line-dark pb-2 last:border-0 last:pb-0">
                <span className="truncate">{category.name}</span>
                <span className="text-ivory/55">{number(category.publishedCount || 0)} / {number(category.totalCount || 0)}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel eyebrow="Latest" title="Recently updated">
          <ul className="space-y-2 text-sm">
            {data.articles.total === 0 ? (
              <li className="text-ivory/55">No articles yet.</li>
            ) : (
              <li className="text-ivory/55">Open the articles desk to review the latest edits.</li>
            )}
          </ul>
          <Link href="/admin/articles" className="btn-outline mt-4 inline-flex">Open articles</Link>
        </Panel>
      </div>
    </div>
  );
}
