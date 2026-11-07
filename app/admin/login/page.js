import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { buildMetadata } from "@/lib/seo";
import Logo from "@/components/brand/Logo";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Newsroom sign in",
  description: "Administrator access to the MIC TECH newsroom.",
  path: "/admin/login",
  noindex: true,
});

export default async function AdminLoginPage({ searchParams }) {
  const user = await getCurrentUser().catch(() => null);
  if (user?.role === "admin") redirect("/admin");
  const query = await searchParams;

  return (
    <div className="grid min-h-screen bg-ink lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-ink p-10 text-ivory lg:flex">
        <Logo variant="light" />
        <div>
          <p className="kicker text-gold-soft">The control room</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.1] text-ivory">
            Independent journalism needs a disciplined newsroom.
          </h1>
          <p className="mt-4 max-w-md font-body text-sm leading-relaxed text-ivory/60">
            Publish, schedule and moderate from one place. Every action is attributed in the audit
            log, and every session is short-lived.
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.16em] text-ivory/35">
          MIC TECH Â· Editorial systems
        </p>
      </aside>

      <main id="main-content" className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <p className="kicker mt-8 lg:mt-0">Administrator</p>
          <h2 className="mt-2 font-display text-3xl">Newsroom sign in</h2>
          <p className="mt-2 text-sm text-ivory/70">
            Staff access only. Reader accounts cannot open the newsroom.
          </p>
          {query?.error === "forbidden" ? (
            <p className="mt-4 border border-red-500/30 bg-red-900/10 p-3 text-xs text-red-400">
              That account does not have administrator access.
            </p>
          ) : null}
          {query?.error === "session" ? (
            <p className="mt-4 border border-gold/40 bg-surface-2/60 p-3 text-xs text-ivory/70">
              Your session expired. Sign in again to continue.
            </p>
          ) : null}
          <div className="mt-6">
            <AdminLoginForm />
          </div>
          <p className="mt-6 border-t border-line-dark pt-4 text-[11px] text-ivory/55">
            Reader? <Link href="/login" className="link-gold font-semibold">Sign in here</Link>.
            {" "}Back to <Link href="/" className="hover:text-gold">MIC TECH</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}


