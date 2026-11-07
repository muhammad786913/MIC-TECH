import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { listBookmarks, listLikes } from "@/lib/data/engagement";
import { listUserComments } from "@/lib/data/comments";
import { buildMetadata } from "@/lib/seo";
import { formatDate, initials } from "@/lib/utils";
import AccountNav from "@/components/account/AccountNav";
import ProfileForm from "@/components/account/ProfileForm";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Your account",
  description: "Manage your MIC TECH reader profile, bookmarks and comments.",
  path: "/account",
  noindex: true,
});

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [bookmarks, likes, comments] = await Promise.all([
    listBookmarks(user._id).catch(() => []),
    listLikes(user._id).catch(() => []),
    listUserComments(user._id).catch(() => []),
  ]);
  const publishedBookmarks = bookmarks.filter((item) => item.isPublished);

  return (
    <div className="wrap py-9 lg:py-12">
      <div className="mx-auto max-w-4xl">
        <AccountNav active="/account" />

        <header className="mt-7 flex flex-wrap items-center gap-4 border border-line-dark bg-surface p-5">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-ink font-display text-lg text-gold">
            {initials(user.name)}
          </span>
          <div className="min-w-0">
            <p className="kicker">Reader account</p>
            <h1 className="mt-1 font-display text-3xl leading-tight">{user.name}</h1>
            <p className="mt-1 truncate text-xs text-ivory/55">
              {user.email} · joined {formatDate(user.createdAt)}
            </p>
          </div>
          <span className="ml-auto border border-line-dark px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ivory/55">
            {user.emailVerified ? "Verified" : "Email unverified"}
          </span>
        </header>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Saved stories", value: publishedBookmarks.length, href: "/account/bookmarks" },
            { label: "Liked stories", value: likes.length, href: "/account" },
            { label: "Comments", value: comments.length, href: "/account/comments" },
          ].map((item) => (
            <Link key={item.label} href={item.href} className="border border-line-dark bg-surface p-4 transition-colors hover:border-gold">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ivory/55">{item.label}</p>
              <p className="mt-1 font-display text-3xl">{item.value}</p>
            </Link>
          ))}
        </div>

        {!user.emailVerified ? (
          <div className="mt-5 border border-gold/40 bg-surface-2/60 p-4 text-sm text-ivory/70">
            Your email is not verified. Some features, such as commenting when verification is
            required, may be unavailable. Check your inbox for the verification link or{" "}
            <Link href="/verify-email" className="link-gold font-semibold">request a new one</Link>.
          </div>
        ) : null}

        <section className="mt-8 border border-line-dark bg-surface p-5 sm:p-7">
          <h2 className="font-display text-2xl">Profile & preferences</h2>
          <p className="mt-1 mb-5 text-sm text-ivory/70">
            This information appears next to your comments. Your email is never shown publicly.
          </p>
          <ProfileForm user={user} />
        </section>
      </div>
    </div>
  );
}
