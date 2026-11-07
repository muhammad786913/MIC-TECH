export default function SectionHeading({ eyebrow, title, href, linkLabel = "View all", className = "" }) {
  return (
    <div className={`mb-5 flex items-end justify-between gap-4 border-b border-line-dark pb-3 ${className}`}>
      <div>
        {eyebrow ? <p className="kicker mb-1.5">{eyebrow}</p> : null}
        <h2 className="font-display text-[clamp(1.35rem,2.2vw,1.85rem)] leading-tight">{title}</h2>
      </div>
      {href ? (
        <a
          href={href}
          className="shrink-0 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ivory/70 transition-colors hover:text-gold"
        >
          {linkLabel} →
        </a>
      ) : null}
    </div>
  );
}
