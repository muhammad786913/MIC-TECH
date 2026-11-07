import { verifyEmailToken, issueEmailVerification, getUserById } from "@/lib/data/users";
import { sendVerificationEmail } from "@/lib/mailer";
import { requireApiUser, guardMutation, handleError, json, limit, readJson } from "@/lib/api";
import { config } from "@/lib/config";
import { absoluteUrl } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    guardMutation(request);
    limit(request, "verify", { max: 12, windowMs: 60 * 60_000 });
    const payload = await readJson(request);
    await verifyEmailToken(String(payload.token || ""));
    return json({ ok: true, message: "Email verified. You can now sign in." });
  } catch (error) {
    return handleError(error, "auth/verify");
  }
}

export async function PUT(request) {
  try {
    guardMutation(request);
    limit(request, "verify-resend", { max: 4, windowMs: 60 * 60_000 });
    const sessionUser = await requireApiUser(request);
    const user = await getUserById(sessionUser._id);
    if (!user) return json({ ok: false, error: "Account not found." }, 404);
    if (user.emailVerified) return json({ ok: true, already: true });
    const token = await issueEmailVerification(user);
    const link = absoluteUrl(`/verify-email?token=${token}`);
    const mail = await sendVerificationEmail({ to: user.email, name: user.name, link });
    return json({
      ok: true,
      delivery: mail.delivered ? "email" : "unconfigured",
      ...(config.exposeDevLinks && !mail.delivered ? { devLink: link } : {}),
    });
  } catch (error) {
    return handleError(error, "auth/verify-resend");
  }
}
