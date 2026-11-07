import { getCurrentUser } from "@/lib/auth/guards";
import { buildMetadata } from "@/lib/seo";
import AccountNav from "@/components/account/AccountNav";
import { PasswordForm, DeleteAccountForm } from "@/components/account/SecurityForms";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Account security",
  description: "Update your MIC TECH password and manage your account.",
  path: "/account/security",
  noindex: true,
});

export default async function AccountSecurityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="wrap py-9 lg:py-12">
      <div className="mx-auto max-w-4xl">
        <AccountNav active="/account/security" />
        <header className="mt-7">
          <p className="kicker">Account security</p>
          <h1 className="mt-1 font-display text-4xl">Password & privacy</h1>
          <p className="mt-2 max-w-xl text-sm text-ivory/70">
            Passwords are stored as salted scrypt hashes. Changing your password signs out every
            other session.
          </p>
        </header>

        <section className="mt-6 border border-line-dark bg-surface p-5 sm:p-7">
          <h2 className="font-display text-2xl">Change password</h2>
          <div className="mt-4">
            <PasswordForm />
          </div>
        </section>

        <section className="mt-6 border border-line-dark bg-surface p-5 sm:p-7">
          <h2 className="font-display text-2xl">Sessions</h2>
          <p className="mt-2 text-sm text-ivory/70">
            You are signed in on this device. Sessions expire automatically. If you suspect misuse,
            change your password to invalidate all sessions.
          </p>
          <p className="mt-3 text-xs text-ivory/55">Email verified: {user.emailVerified ? "yes" : "no"}</p>
        </section>

        <section className="mt-6 border border-red-500/30 bg-surface p-5 sm:p-7">
          <h2 className="font-display text-2xl text-red-400">Close account</h2>
          <div className="mt-4">
            <DeleteAccountForm />
          </div>
        </section>
      </div>
    </div>
  );
}
