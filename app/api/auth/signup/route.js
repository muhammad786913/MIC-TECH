import { createUser } from "@/lib/data/users";
import { sendVerificationEmail } from "@/lib/mailer";
import { setSessionCookie } from "@/lib/auth/session";
import { config } from "@/lib/config";
import { absoluteUrl } from "@/lib/utils";
import { fail, guardMutation, handleError, json, limit, readJson } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    guardMutation(request);
    limit(request, "signup", { max: 6, windowMs: 60 * 60_000 });
    const payload = await readJson(request);

    const { user, verificationToken } = await createUser({
      name: payload.name,
      userEmail: payload.email,
      password: payload.password,
    });

    const link = absoluteUrl(`/verify-email?token=${verificationToken}`);
    const mail = await sendVerificationEmail({ to: user.email, name: user.name, link });

    let signedIn = false;
    if (!config.emailVerificationRequired) {
      const response = json({ ok: true, requiresVerification: false, user: { name: user.name } });
      await setSessionCookie(response, {
        sub: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        sv: user.sessionVersion || 0,
      });
      signedIn = true;
      return response;
    }

    await writeAudit({
      actor: user,
      action: "user.signup",
      targetType: "user",
      targetId: user._id,
      summary: `Reader registered: ${user.email}`,
    });

    return json({
      ok: true,
      requiresVerification: true,
      signedIn,
      delivery: mail.delivered ? "email" : "unconfigured",
      ...(config.exposeDevLinks && !mail.delivered ? { devLink: link } : {}),
    });
  } catch (error) {
    return handleError(error, "auth/signup");
  }
}

export function GET() {
  return fail("Method not allowed.", 405);
}
