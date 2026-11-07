import { buildMetadata } from "@/lib/seo";
import AuthShell from "@/components/auth/AuthShell";
import VerifyEmail from "@/components/auth/VerifyEmail";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Verify your email",
  description: "Confirm your MIC TECH account email address.",
  path: "/verify-email",
  noindex: true,
});

export default async function VerifyEmailPage({ searchParams }) {
  const query = await searchParams;
  const token = String(query?.token || "");

  return (
    <AuthShell
      eyebrow="Account security"
      title="Verify your email"
      subtitle="Verification confirms you own this address and keeps the comment section accountable."
      footer={
        <>
          Need help? <a href="/contact" className="link-gold font-semibold">Contact the newsroom</a>.
        </>
      }
    >
      <VerifyEmail token={token} />
    </AuthShell>
  );
}
