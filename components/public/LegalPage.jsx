import Link from "next/link";

export default function LegalPage({ eyebrow, title, updated, intro, sections = [], footer }) {
  return (
    <div className="wrap py-10 lg:py-14">
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ivory/55">
          <Link href="/" className="hover:text-gold">Home</Link>
          <span className="mx-2 text-line">/</span>
          <span className="text-ivory/70">{title}</span>
        </nav>

        <header className="mt-6 border-b border-line-dark pb-6">
          <p className="kicker">{eyebrow}</p>
          <h1 className="mt-2 font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.06]">{title}</h1>
          {updated ? (
            <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-ivory/55">Last updated {updated}</p>
          ) : null}
          {intro ? (
            <p className="mt-4 font-body text-lg leading-relaxed text-ivory/70">{intro}</p>
          ) : null}
        </header>

        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.heading} aria-labelledby={section.id || undefined}>
              <h2 id={section.id} className="font-display text-2xl leading-tight">{section.heading}</h2>
              <div className="mt-3 space-y-3 font-body text-[15px] leading-relaxed text-ivory/70">
                {section.body.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
                {section.list ? (
                  <ul className="list-disc space-y-2 pl-5">
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </div>

        {footer ? (
          <div className="mt-10 border border-line-dark bg-surface-2/60 p-5 text-sm leading-relaxed text-ivory/70">
            {footer}
          </div>
        ) : null}

        <p className="mt-8 border-t border-line-dark pt-5 text-xs text-ivory/55">
          Questions about this page? <Link href="/contact" className="link-gold font-semibold">Contact the newsroom</Link>.
        </p>
      </div>
    </div>
  );
}
