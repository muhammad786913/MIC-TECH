import { authenticateUser } from "@/lib/data/users";
import { verifyTotp } from "@/lib/auth/totp";
import { setSessionCookie } from "@/lib/auth/session";
import { writeAudit } from "@/lib/audit";
import { fail, guardMutation, handleError, json, limit, readJson } from "@/lib/api";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    guardMutation(request);
    limit(request, "admin-login", { max: 8, windowMs: 15 * 60_000 });
    const payload = await readJson(request);

    // Bot protection via Cloudflare Turnstile.
    const turnstile = await verifyTurnstile(payload.turnstileToken, request);
    if (!turnstile.success) {
      return fail("Bot verification failed. Please try again.", 403, {
        turnstile: turnstile.error,
      });
    }

    const user = await authenticateUser({
      identifier: payload.email || payload.identifier,
      password: payload.password,
    });

    if (user.role !== "admin") {
      await writeAudit({
        actor: user,
        action: "admin.login.denied",
        targetType: "user",
        targetId: user._id,
        summary: "Non-admin attempted administrator sign-in",
      });
      return fail("Administrator access required.", 403);
    }
    if (user.disabled || user.deletedAt) return fail("This account is not available.", 403);

    if (user.mfaEnabled) {
      if (!payload.code) {
        return json({ ok: false, mfaRequired: true, error: "Enter the 6-digit code from your authenticator app." }, 401);
      }
      if (!verifyTotp(user.mfaSecret, payload.code)) {
        await writeAudit({
          actor: user,
          action: "admin.login.mfa_failed",
          targetType: "user",
          targetId: user._id,
          summary: "Invalid MFA code",
        });
        return fail("Invalid authenticator code.", 401);
      }
    }

    const response = json({ ok: true, mfaRequired: Boolean(user.mfaEnabled), mfaEnabled: Boolean(user.mfaEnabled) });
    await setSessionCookie(
      response,
      {
        sub: user._id,
        role: "admin",
        name: user.name,
        email: user.email,
        sv: user.sessionVersion || 0,
        mfa: Boolean(user.mfaEnabled),
      },
      { admin: true },
    );
    await writeAudit({
      actor: user,
      action: "admin.login",
      targetType: "user",
      targetId: user._id,
      summary: "Administrator signed in",
    });
    return response;
  } catch (error) {
    return handleError(error, "admin/login");
  }
}
