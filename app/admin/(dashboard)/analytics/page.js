import Link from "next/link";
import { getAnalytics } from "@/lib/data/analytics";
import { buildMetadata } from "@/lib/seo";
import { formatDate, number, rangeFromParams } from "@/lib/utils";
import { EmptyState, Panel, StatTile } from "@/components/admin/AdminUI";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Audience analytics",
  description: "First-party MIC TECH audience analytics.",
  path: "/admin/analytics",
  noindex: true,
});

const RANGES = [
  ["today", "Today"],
  ["7d", "7 days"],
  ["30d", "30 days"],
  ["90d", "90 days"],
  ["custom", "Custom"],
];

function BarList({ items, emptyLabel = "No data in this period.", limit = 8, suffix = "" }) {
  const rows = (items || []).slice(0, limit);
  if (!rows.length) return <p className="text-sm text-ivory/55">{emptyLabel}</p>;
  const max = Math.max(...rows.map((item) => Number(item.value ?? item.views ?? 0)), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map((item) => {
        const value = Number(item.value ?? item.views ?? 0);
        return (
          <li key={item.name}>
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="truncate capitalize text-ivory/70">{item.name || "unknown"}</span>
              <span className="font-display text-sm">{number(value)}{suffix}</span>
            </div>
            <div className="mt-1 h-1.5 w-full bg-surface-2">
              <div
                className="h-1.5 bg-gold"
                style={{ width: `${Math.max(2, Math.round((value / max) * 100))}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DailyChart({ series }) {
  if (!series?.length) return <p className="text-sm text-ivory/55">No pageviews in this period.</p>;
  const max = Math.max(...series.map((day) => day.views), 1);
  return (
    <div className="flex h-40 items-end gap-1 overflow-x-auto" role="img" aria-label="Daily pageviews">
      {series.map((day) => (
        <div key={day.date} className="group relative flex min-w-[6px] flex-1 flex-col justify-end">
          <div
            className="w-full bg-gold/80 transition-colors group-hover:bg-gold"
            style={{ height: `${Math.max(2, Math.round((day.views / max) * 100))}%` }}
            title={`${day.date}: ${number(day.views)} pageviews`}
          />
        </div>
      ))}
    </div>
  );
}

export default async function AdminAnalyticsPage({ searchParams }) {
  const query = await searchParams;
  const range = rangeFromParams(query || {});
  const analytics = await getAnalytics(range);

  return (
    <div className="mx-auto max-w-[1400px]">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">First-party measurement</p>
          <h1 className="mt-1 font-display text-4xl">Audience analytics</h1>
          <p className="mt-1 text-sm text-ivory/70">
            {formatDate(range.from)} → {formatDate(range.to)} · unique visitors are counted once per
            random first-party cookie.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="btn-outline">Dashboard</Link>
          <Link href="/admin/articles" className="btn-gold">Articles</Link>
        </div>
      </header>

      <form method="get" className="mt-5 flex flex-wrap items-end gap-2 border border-line-dark bg-surface p-4">
        <div>
          <label htmlFor="analytics-range" className="field-label">Period</label>
          <select id="analytics-range" name="range" defaultValue={range.range} className="input">
            {RANGES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        {range.range === "custom" ? (
          <>
            <div>
              <label htmlFor="analytics-from" className="field-label">From</label>
              <input id="analytics-from" type="date" name="from" defaultValue={String(query?.from || "").slice(0, 10)} className="input" />
            </div>
            <div>
              <label htmlFor="analytics-to" className="field-label">To</label>
              <input id="analytics-to" type="date" name="to" defaultValue={String(query?.to || "").slice(0, 10)} className="input" />
            </div>
          </>
        ) : null}
        <button type="submit" className="btn-dark">Apply</button>
        <p className="ml-auto self-center text-xs text-ivory/55">
          <span className="inline-block h-2 w-2 rounded-full bg-gold" /> {number(analytics.realtime?.visitors || 0)} reading now · last 5 minutes
        </p>
      </form>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Unique visitors"
          value={number(analytics.totals.visitors)}
          hint={`${number(analytics.totals.returningVisitors)} returning · ${number(analytics.totals.events)} tracked events`}
        />
        <StatTile
          label="Pageviews"
          value={number(analytics.totals.pageviews)}
          hint={`${analytics.totals.visitors ? (analytics.totals.pageviews / analytics.totals.visitors).toFixed(1) : "0.0"} pages per visitor`}
        />
        <StatTile
          label="Engagement"
          value={number(analytics.totals.likes + analytics.totals.comments + analytics.totals.bookmarks + analytics.totals.shares)}
          hint={`${number(analytics.totals.likes)} likes · ${number(analytics.totals.comments)} comments · ${number(analytics.totals.bookmarks)} bookmarks · ${number(analytics.totals.shares)} shares`}
        />
        <StatTile
          label="New registrations"
          value={number(analytics.totals.registrations)}
          hint="Reader accounts created in this period"
        />
      </div>

      {analytics.totals.truncated ? (
        <p className="mt-4 border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          This period holds more events than the aggregation cap, so totals are a lower bound.
          Narrow the date range for exact figures.
        </p>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Panel eyebrow="Trend" title="Daily pageviews">
          <DailyChart series={analytics.dailySeries} />
          <div className="mt-3 flex justify-between text-[10px] uppercase tracking-[0.1em] text-ivory/55">
            <span>{analytics.dailySeries[0]?.date || "—"}</span>
            <span>{analytics.dailySeries[analytics.dailySeries.length - 1]?.date || "—"}</span>
          </div>
        </Panel>

        <Panel eyebrow="Live" title="Right now">
          <p className="font-display text-5xl leading-none">{number(analytics.realtime?.visitors || 0)}</p>
          <p className="mt-2 text-sm text-ivory/70">
            readers in the last {analytics.realtime?.minutes || 5} minutes, based on
            {" "}{number(analytics.realtime?.views || 0)} pageviews.
          </p>
          <p className="mt-4 border-t border-line-dark pt-3 text-[11px] leading-relaxed text-ivory/55">
            Bot traffic is excluded at collection time. No third-party analytics script is loaded,
            and there are no invented numbers on this page.
          </p>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel eyebrow="Acquisition" title="Traffic sources">
          <BarList items={analytics.sources} />
        </Panel>
        <Panel eyebrow="Devices" title="Device mix">
          <BarList items={analytics.devices} />
          <div className="mt-4 border-t border-line-dark pt-3">
            <BarList items={analytics.browsers} limit={4} />
          </div>
        </Panel>
        <Panel eyebrow="Geography" title="Countries">
          <BarList items={analytics.countries} />
          <p className="mt-3 text-[11px] leading-relaxed text-ivory/55">
            Country is derived from edge headers where available; otherwise it is reported as unknown.
          </p>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Panel eyebrow="Attention" title="Top stories">
          {analytics.topArticles.length ? (
            <div className="divide-y divide-line-dark">
              {analytics.topArticles.slice(0, 10).map((item, index) => (
                <div key={item.articleId} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="w-5 font-display text-lg text-ivory/55">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    {item.article?.slug ? (
                      <Link href={`/news/${item.article.slug}`} target="_blank" className="truncate text-sm font-medium hover:text-gold">
                        {item.article.title}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-medium text-ivory/55">Removed story</p>
                    )}
                    <p className="text-[11px] text-ivory/55">
                      {item.article?.categoryName || "Uncategorised"} · {number(item.visitors)} visitors
                    </p>
                  </div>
                  <span className="font-display text-lg">{number(item.views)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No article views yet">
              Article-level analytics appear as readers open published stories.
            </EmptyState>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel eyebrow="Sections" title="Views by desk">
            <BarList items={analytics.categories.map((item) => ({ name: item.name, value: item.views }))} />
          </Panel>
          <Panel eyebrow="Pages" title="Most-opened paths">
            <BarList items={analytics.paths.map((item) => ({ name: item.name, value: item.value }))} limit={6} />
          </Panel>
        </div>
      </div>

      <p className="mt-6 border-t border-line-dark pt-4 text-[11px] text-ivory/55">
        Export-ready data lives in the database collection <code className="bg-surface-2 px-1">analyticsEvents</code>.
        Analytics retention is configured in Settings. Ranges are inclusive of the selected end date.
      </p>
    </div>
  );
}
