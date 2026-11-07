import { getSettings } from "@/lib/data/settings";
import { listCategories } from "@/lib/data/categories";
import { listPublished } from "@/lib/data/articles";
import { getCurrentUser } from "@/lib/auth/guards";
import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";

export const dynamic = "force-dynamic";

async function safely(promise, fallback) {
  try {
    return await promise;
  } catch (error) {
    console.warn(`[site] ${error?.message || error}`);
    return fallback;
  }
}

export default async function SiteLayout({ children }) {
  const [settings, categories, breaking, user] = await Promise.all([
    safely(getSettings(), null),
    safely(listCategories(), []),
    safely(listPublished({ breaking: true, limit: 6 }), { items: [] }),
    safely(getCurrentUser(), null),
  ]);

  // Database-driven maintenance mode. Edge middleware covers the env override.
  if (settings?.maintenanceMode) {
    return (
      <>
        <SiteHeader
          settings={settings}
          categories={categories}
          breaking={[]}
          user={user}
        />
        <main id="main-content" className="wrap py-16 lg:py-24">
          <div className="mx-auto max-w-2xl border border-line-dark bg-surface p-8 text-center shadow-sm sm:p-12">
            <p className="kicker">Scheduled maintenance</p>
            <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3rem)] leading-[1.06]">
              The newsroom is briefly offline.
            </h1>
            <p className="mx-auto mt-4 max-w-md font-body text-lg leading-relaxed text-ivory/70">
              {settings.maintenanceMessage ||
                "MIC TECH is performing scheduled maintenance. We will be back shortly."}
            </p>
            <p className="mt-8 border-t border-line-dark pt-5 text-[11px] uppercase tracking-[0.14em] text-ivory/55">
              Precision · Perspective · Pakistan
            </p>
          </div>
        </main>
        <SiteFooter settings={settings} categories={categories} />
      </>
    );
  }

  return (
    <>
      <SiteHeader
        settings={settings}
        categories={categories}
        breaking={breaking.items || []}
        user={user}
      />
      <main id="main-content">{children}</main>
      <SiteFooter settings={settings} categories={categories} />
    </>
  );
}
