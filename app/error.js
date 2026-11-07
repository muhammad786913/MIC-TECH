"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("[client] unhandled application error", error);
  }, [error]);

  return (
    <main id="main-content" className="grid min-h-screen place-items-center bg-ink px-6 py-16 text-ivory">
      <div className="w-full max-w-xl text-center">
        <p className="kicker text-gold-soft">Something went wrong</p>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,6vw,3.8rem)] leading-[1.05]">
          We could not finish loading this page.
        </h1>
        <p className="mx-auto mt-4 max-w-md font-body text-lg leading-relaxed text-ivory/70">
          The problem is on our side. You can retry, or return to the homepage. If it keeps happening,
          please tell the newsroom what you were doing.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => reset()} className="btn-gold shine">
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-ivory/30 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold hover:text-gold-soft"
          >
            Return home
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center border border-ivory/30 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold hover:text-gold-soft"
          >
            Contact us
          </Link>
        </div>
      </div>
    </main>
  );
}
