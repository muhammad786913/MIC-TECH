import { buildMetadata } from "@/lib/seo";
import AuthShell from "@/components/auth/AuthShell";
import ResetForm from "@/components/auth/ResetForm";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Choose a new password",
  description: "Set a new password for your MIC TECH account.",
  path: "/reset-password",
  noindex: true,
});

export default async function ResetPasswordPage({ searchParams }) {
  const query = await searchParams;
  const token = String(query?.token || "");

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Choose a new password"
      subtitle="Passwords are stored only as salted scrypt hashes. Existing sessions will be signed out."
      footer={
        <>
          Need a new link? <a href="/forgot-password" className="link-gold font-semibold">Request another</a>.
        </>
      }
    >
      <ResetForm token={token} />
    </AuthShell>
  );
}
