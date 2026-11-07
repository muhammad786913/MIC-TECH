import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { buildMetadata } from "@/lib/seo";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Sign in",
  description: "Sign in to like, save and comment on MIC TECH stories.",
  path: "/login",
  noindex: true,
});

export default async function LoginPage() {
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect(user.role === "admin" ? "/admin" : "/account");

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to MIC TECH"
      subtitle="Your reading stays free. Signing in simply lets you save stories and join the conversation."
      footer={
        <>
          New here? <a href="/signup" className="link-gold font-semibold">Create a reader account</a>.
          <span className="mx-2 text-line">|</span>
          <a href="/admin/login" className="hover:text-gold">Newsroom staff</a>
        </>
      }
    >
      <Suspense fallback={<p className="text-sm text-ivory/55">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
