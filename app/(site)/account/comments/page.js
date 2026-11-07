import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { listUserComments } from "@/lib/data/comments";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import AccountNav from "@/components/account/AccountNav";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Your comments",
  description: "Your contributions to MIC TECH conversations.",
  path: "/account/comments",
  noindex: true,
});

const STATUS_STYLES = {
  approved: "text-gold",
  pending: "text-ivory/55",
  rejected: "text-red-400",
};

export default async function AccountCommentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const comments = await listUserComments(user._id).catch(() => []);

  return (
    <div className="wrap py-9 lg:py-12">
      <div className="mx-auto max-w-4xl">
        <AccountNav active="/account/comments" />
        <header className="mt-7">
          <p className="kicker">Your voice</p>
          <h1 className="mt-1 font-display text-4xl">My comments</h1>
          <p className="mt-2 max-w-xl text-sm text-ivory/70">
            Comments are moderated against our community guidelines. Rejected comments are shown
            here for transparency.
          </p>
        </header>

        <div className="mt-6 space-y-4">
          {comments.length ? (
            comments.map((comment) => (
              <article key={comment._id} className="border border-line-dark bg-surface p-5">
                <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.12em]">
                  <span className={`font-semibold ${STATUS_STYLES[comment.status] || "text-ivory/55"}`}>
                    {comment.status}
                  </span>
                  <span className="text-ivory/55">{formatDate(comment.createdAt, { withTime: true })}</span>
                  {comment.article ? (
                    <Link href={`/news/${comment.article.slug}`} className="ml-auto text-gold hover:text-ivory">
                      {comment.article.title}
                    </Link>
                  ) : null}
                </div>
                <p className="mt-3 whitespace-pre-line font-body text-sm leading-relaxed text-ivory/70">
                  {comment.body}
                </p>
              </article>
            ))
          ) : (
            <div className="border border-dashed border-line-dark py-12 text-center">
              <p className="font-display text-2xl">No comments yet</p>
              <p className="mt-2 text-sm text-ivory/70">
                Join the conversation on any published story.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

