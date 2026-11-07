import Link from "next/link";
import Logo from "@/components/brand/Logo";

export const metadata = {
  title: "Scheduled maintenance",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main id="main-content" className="grid min-h-screen place-items-center bg-ink px-6 py-16">
      <div className="w-full max-w-lg border border-line-dark bg-surface p-8 text-center shadow-sm sm:p-12">
        <div className="flex justify-center">
          <Logo />
        </div>
        <p className="mt-9 kicker">Scheduled maintenance</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3rem)] leading-[1.06]">
          The newsroom is briefly offline.
        </h1>
        <p className="mx-auto mt-4 max-w-md font-body text-lg leading-relaxed text-ivory/70">
          We are upgrading the publishing platform. Published stories and your account are safe.
          Please check back shortly.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-dark">
            Try again
          </Link>
          <a href="mailto:editor@mictech.news" className="btn-outline">
            Contact the newsroom
          </a>
        </div>
        <p className="mt-8 border-t border-line-dark pt-5 text-[11px] uppercase tracking-[0.14em] text-ivory/55">
          Precision · Perspective · Pakistan
        </p>
      </div>
    </main>
  );
}
