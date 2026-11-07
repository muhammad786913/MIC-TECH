import { buildMetadata } from "@/lib/seo";
import AuthShell from "@/components/auth/AuthShell";
import ForgotForm from "@/components/auth/ForgotForm";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Reset your password",
  description: "Request a secure password reset link for your MIC TECH account.",
  path: "/forgot-password",
  noindex: true,
});

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Forgot your password?"
      subtitle="Enter the email you registered with. If an account exists, we will send a reset link valid for one hour."
      footer={
        <>
          Remembered it? <a href="/login" className="link-gold font-semibold">Back to sign in</a>.
        </>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
