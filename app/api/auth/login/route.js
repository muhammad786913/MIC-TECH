import { authenticateUser } from "@/lib/data/users";
import { setSessionCookie } from "@/lib/auth/session";
import { guardMutation, fail, handleError, json, limit, readJson } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    guardMutation(request);
    limit(request, "login", { max: 10, windowMs: 15 * 60_000 });
    const payload = await readJson(request);

    // Bot protection via Cloudflare Turnstile.
    const turnstile = await verifyTurnstile(payload.turnstileToken, request);
    if (!turnstile.success) {
      return fail("Bot verification failed. Please try again.", 403, {
        turnstile: turnstile.error,
      });
    }

    const user = await authenticateUser({
      identifier: payload.identifier || payload.email,
      password: payload.password,
    });

    if (user.role === "admin") {
      return fail("Use the administrator sign-in page.", 403);
    }
    if (user.disabled || user.deletedAt) {
      return fail("This account is not available.", 403);
    }

    const response = json({
      ok: true,
      user: { name: user.name, email: user.email, role: user.role },
    });
    await setSessionCookie(response, {
      sub: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      sv: user.sessionVersion || 0,
    });
    await writeAudit({
      actor: user,
      action: "auth.login",
      targetType: "user",
      targetId: user._id,
      summary: "Reader signed in",
    });
    return response;
  } catch (error) {
    return handleError(error, "auth/login");
  }
}
