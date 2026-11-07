import Link from "next/link";
import Logo from "@/components/brand/Logo";

export default function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="wrap py-12 lg:py-16">
      <div className="mx-auto grid max-w-4xl overflow-hidden border border-line-dark bg-surface shadow-[0_20px_60px_-40px_rgba(21,21,21,0.35)] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="hidden flex-col justify-between bg-ink p-8 text-ivory lg:flex">
          <Logo variant="light" />
          <div>
            <p className="kicker text-gold-soft">Reader account</p>
            <p className="mt-3 font-display text-2xl leading-snug text-ivory">
              Independent journalism, held accountable in the open.
            </p>
            <p className="mt-4 font-body text-sm leading-relaxed text-ivory/60">
              Reading is always free. An account lets you like, save and join the conversation —
              nothing more.
            </p>
          </div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-ivory/35">
            Precision. Perspective. Pakistan.
          </p>
        </aside>

        <div className="p-6 sm:p-9">
          <p className="kicker">{eyebrow || "MIC TECH"}</p>
          <h1 className="mt-2 font-display text-3xl leading-tight">{title}</h1>
          {subtitle ? <p className="mt-2 font-body text-[15px] leading-relaxed text-ivory/70">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
          {footer ? <div className="mt-6 border-t border-line-dark pt-4 text-xs text-ivory/55">{footer}</div> : null}
        </div>
      </div>
      <p className="mx-auto mt-5 max-w-4xl text-center text-[11px] text-ivory/55">
        By continuing you agree to our{" "}
        <Link href="/terms" className="link-gold">terms</Link> and{" "}
        <Link href="/privacy" className="link-gold">privacy policy</Link>.
      </p>
    </div>
  );
}
