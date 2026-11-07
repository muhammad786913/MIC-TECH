import { getSettings } from "@/lib/data/settings";
import { getCurrentUser } from "@/lib/auth/guards";
import { dbHealth } from "@/lib/db/store";
import { config } from "@/lib/config";
import { buildMetadata } from "@/lib/seo";
import { SettingsForm, MfaManager } from "@/components/admin/SettingsForms";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Settings",
  description: "MIC TECH site settings and security.",
  path: "/admin/settings",
  noindex: true,
});

export default async function AdminSettingsPage() {
  const [settings, user, health] = await Promise.all([
    getSettings(),
    getCurrentUser(),
    dbHealth(),
  ]);

  const checks = [
    { label: "Database", value: health.driver, ok: health.ok },
    { label: "Cloudinary media", value: config.cloudinary.cloudName ? "configured" : "local development storage", ok: Boolean(config.cloudinary.cloudName) },
    { label: "Transactional email", value: config.mail.resendKey ? "configured" : "not configured (dev links shown locally)", ok: Boolean(config.mail.resendKey) },
    { label: "SESSION_SECRET", value: config.sessionSecret ? "configured" : "development fallback", ok: Boolean(config.sessionSecret) },
    { label: "CRON_SECRET", value: config.cronSecret ? "configured" : "not configured", ok: Boolean(config.cronSecret) },
  ];

  return (
    <div className="mx-auto max-w-[1100px]">
      <header>
        <p className="kicker">Configuration</p>
        <h1 className="mt-1 font-display text-4xl">Settings</h1>
        <p className="mt-1 text-sm text-ivory/70">Brand identity, moderation, SEO and deployment state.</p>
      </header>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SettingsForm settings={settings} />

        <aside className="space-y-5">
          <MfaManager enabled={Boolean(user?.mfaEnabled)} />

          <section className="border border-line-dark bg-surface p-5">
            <p className="kicker">Deployment</p>
            <h2 className="font-display text-xl">Integration status</h2>
            <ul className="mt-3 space-y-2 text-xs">
              {checks.map((check) => (
                <li key={check.label} className="flex items-start justify-between gap-3 border-b border-line-dark pb-2 last:border-0 last:pb-0">
                  <span className="font-medium">{check.label}</span>
                  <span className={check.ok ? "text-right text-gold" : "text-right text-ivory/55"}>{check.value}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-ivory/55">
              Secrets are read from environment variables and never displayed. Configure them in
              the deployment secret store, not in the database.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
