import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guards";
import { listBookmarks } from "@/lib/data/engagement";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import AccountNav from "@/components/account/AccountNav";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Saved stories",
  description: "Your saved MIC TECH reporting.",
  path: "/account/bookmarks",
  noindex: true,
});

export default async function BookmarksPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="wrap py-9 lg:py-12">
        <div className="mx-auto max-w-2xl">
          <AccountNav active="/account/bookmarks" />
          <header className="mt-7 border border-line-dark bg-surface p-8 text-center">
            <p className="kicker">Your library</p>
            <h1 className="mt-1 font-display text-3xl leading-tight">Sign in to view saved stories</h1>
            <p className="mt-3 max-w-lg font-body text-lg leading-relaxed text-ivory/70">
              Sign in to see your bookmarked stories. Public reading remains free for everyone.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/login" className="btn-gold inline-flex">
                Sign in
              </Link>
              <Link href="/signup" className="btn-outline inline-flex">
                Create account
              </Link>
            </div>
          </header>
        </div>
      </div>
    );
  }
  const bookmarks = await listBookmarks(user._id).catch(() => []);

  return (
    <div className="wrap py-9 lg:py-12">
      <div className="mx-auto max-w-4xl">
        <AccountNav active="/account/bookmarks" />
        <header className="mt-7">
          <p className="kicker">Your library</p>
          <h1 className="mt-1 font-display text-4xl">Saved stories</h1>
          <p className="mt-2 max-w-xl text-sm text-ivory/70">
            Stories you bookmark are stored in your account. Unpublished or removed stories stay
            hidden until they return.
          </p>
        </header>

        <div className="mt-6 divide-y divide-line-dark border-y border-line-dark">
          {bookmarks.length ? (
            bookmarks.map((article) => (
              <div key={article._id} className="flex flex-wrap items-start gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
                    {article.categoryName || "Story"}
                  </p>
                  {article.isPublished ? (
                    <Link href={`/news/${article.slug}`} className="mt-1 block font-display text-xl leading-snug hover:text-gold">
                      {article.title}
                    </Link>
                  ) : (
                    <p className="mt-1 font-display text-xl leading-snug text-ivory/55">
                      {article.title} <span className="text-xs uppercase tracking-[0.1em]">(unavailable)</span>
                    </p>
                  )}
                  <p className="mt-1 text-xs text-ivory/55">
                    Saved {formatDate(article.savedAt)} · {article.readingTime || 1} min read
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <p className="font-display text-2xl">Nothing saved yet</p>
              <p className="mt-2 text-sm text-ivory/70">
                Use the bookmark button on any story to keep it here.
              </p>
              <Link href="/" className="btn-outline mt-5 inline-flex">Browse the latest</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
