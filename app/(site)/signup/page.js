import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { buildMetadata } from "@/lib/seo";
import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Create a reader account",
  description: "Join MIC TECH to like, save and discuss independent reporting.",
  path: "/signup",
  noindex: true,
});

export default async function SignupPage() {
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect(user.role === "admin" ? "/admin" : "/account");

  return (
    <AuthShell
      eyebrow="Join the readership"
      title="Create your account"
      subtitle="One account for likes, bookmarks and moderated comments. We never sell reader data."
      footer={
        <>
          Already registered? <a href="/login" className="link-gold font-semibold">Sign in</a>.
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
