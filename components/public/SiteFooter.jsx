import Link from "next/link";
import Logo from "@/components/brand/Logo";
import Icon from "@/components/ui/Icon";

const LEGAL = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
  { href: "/community-guidelines", label: "Community guidelines" },
  { href: "/corrections", label: "Corrections" },
];

const COMPANY = [
  { href: "/about", label: "About MIC TECH" },
  { href: "/contact", label: "Contact" },
  { href: "/editorial-policy", label: "Editorial standards" },
  { href: "/rss.xml", label: "RSS feed" },
];

const SOCIAL = [
  { href: "https://x.com/mictechnews", label: "X", icon: "xsocial" },
  { href: "https://www.facebook.com/mictechnews", label: "Facebook", icon: "facebook" },
  { href: "https://www.youtube.com/@mictechnews", label: "YouTube", icon: "youtube" },
  { href: "https://www.instagram.com/mictechnews", label: "Instagram", icon: "instagram" },
];

export default function SiteFooter({ settings, categories = [] }) {
  const social = settings?.social || {};
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t-4 border-gold bg-ink text-ivory">
      <div className="wrap py-12 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo variant="light" />
            <p className="mt-5 max-w-sm font-body text-[15px] leading-relaxed text-ivory/65">
              {settings?.description ||
                "Independent reporting and analysis on Pakistan, world affairs, technology, business and culture."}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {SOCIAL.map((item) => (
                <a
                  key={item.label}
                  href={social[item.icon] || item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`MIC TECH on ${item.label}`}
                  className="grid h-9 w-9 place-items-center border border-ivory/15 text-ivory/70 transition-colors hover:border-gold hover:text-gold"
                >
                  <Icon name={item.icon} size={16} />
                </a>
              ))}
              <a
                href="/rss.xml"
                aria-label="RSS feed"
                className="grid h-9 w-9 place-items-center border border-ivory/15 text-ivory/70 transition-colors hover:border-gold hover:text-gold"
              >
                <Icon name="rss" size={16} />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Sections</p>
              <ul className="space-y-2.5 text-[13px] text-ivory/70">
                {categories.slice(0, 7).map((category) => (
                  <li key={category._id}>
                    <Link href={`/category/${category.slug}`} className="transition-colors hover:text-gold">
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">More</p>
              <ul className="space-y-2.5 text-[13px] text-ivory/70">
                {categories.slice(7).map((category) => (
                  <li key={category._id}>
                    <Link href={`/category/${category.slug}`} className="transition-colors hover:text-gold">
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Company</p>
              <ul className="space-y-2.5 text-[13px] text-ivory/70">
                {COMPANY.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="transition-colors hover:text-gold">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-ivory/10 pt-6 text-[11px] text-ivory/45 md:flex-row md:items-center md:justify-between">
          <p>© {year} MIC TECH. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-gold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="flex items-center gap-2 text-ivory/35">
            <span className="h-1 w-1 rounded-full bg-gold" />
            Independent. Accountable. Precise.
          </p>
        </div>
      </div>
    </footer>
  );
}
