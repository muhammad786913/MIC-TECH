import Link from "next/link";
import Logo from "@/components/brand/Logo";
import Icon from "@/components/ui/Icon";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main id="main-content" className="grid min-h-screen place-items-center bg-ink px-6 py-16 text-ivory">
      <div className="w-full max-w-xl text-center">
        <div className="flex justify-center">
          <Logo variant="light" />
        </div>
        <p className="mt-10 kicker text-gold-soft">Error 404</p>
        <h1 className="mt-3 font-display text-[clamp(2.4rem,7vw,4.4rem)] leading-[1.02]">
          This page has left the newsroom.
        </h1>
        <p className="mx-auto mt-4 max-w-md font-body text-lg leading-relaxed text-ivory/70">
          The link may be outdated, mistyped or the story may have been moved. Our latest reporting is
          still where you left it.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-gold shine">
            Return home
            <Icon name="arrow-right" size={14} />
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center border border-ivory/30 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold hover:text-gold-soft"
          >
            Search MIC TECH
          </Link>
        </div>
        <p className="mt-8 text-[11px] uppercase tracking-[0.14em] text-ivory/40">
          Precision · Perspective · Pakistan
        </p>
      </div>
    </main>
  );
}
