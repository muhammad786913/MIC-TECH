export function StatTile({ label, value, hint, tone = "" }) {
  return (
    <div className={`border border-line-dark bg-surface p-4 ${tone}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ivory/55">{label}</p>
      <p className="mt-1 font-display text-3xl leading-none">{value}</p>
      {hint ? <p className="mt-2 text-[11px] leading-snug text-ivory/55">{hint}</p> : null}
    </div>
  );
}

export function Panel({ title, eyebrow, action, children, className = "" }) {
  return (
    <section className={`border border-line-dark bg-surface ${className}`}>
      {title ? (
        <header className="flex flex-wrap items-end justify-between gap-2 border-b border-line-dark px-5 py-4">
          <div>
            {eyebrow ? <p className="kicker mb-1">{eyebrow}</p> : null}
            <h2 className="font-display text-xl leading-tight">{title}</h2>
          </div>
          {action}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

const STATUS_TONE = {
  published: "border-gold/50 bg-gold/10 text-gold",
  draft: "border-line-dark bg-surface-2 text-ivory/55",
  scheduled: "border-line-dark bg-surface-2 text-ivory/70",
  archived: "border-line-dark bg-surface text-ivory/55",
  approved: "border-gold/50 bg-gold/10 text-gold",
  pending: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  rejected: "border-red-400/40 bg-red-400/10 text-red-300",
  open: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  resolved: "border-gold/50 bg-gold/10 text-gold",
  dismissed: "border-line-dark bg-surface-2 text-ivory/55",
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${
        STATUS_TONE[status] || "border-line-dark bg-surface-2 text-ivory/55"
      }`}
    >
      {status}
    </span>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="border border-dashed border-line-dark p-10 text-center">
      <p className="font-display text-2xl">{title}</p>
      {children ? <div className="mt-2 text-sm text-ivory/70">{children}</div> : null}
    </div>
  );
}
