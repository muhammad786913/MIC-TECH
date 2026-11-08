import { requestPasswordReset } from "@/lib/data/users";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { config } from "@/lib/config";
import { absoluteUrl } from "@/lib/utils";
import { guardMutation, fail, handleError, json, limit, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    guardMutation(request);
    limit(request, "forgot", { max: 5, windowMs: 60 * 60_000 });
    const payload = await readJson(request);

    const result = await requestPasswordReset(payload.email).catch(() => ({ sent: false }));

    // Always return the same response to avoid account enumeration.
    let devLink = "";
    if (result.sent && result.user) {
      const link = absoluteUrl(`/reset-password?token=${result.token}`);
      const mail = await sendPasswordResetEmail({
        to: result.user.email,
        name: result.user.name,
        link,
      });
      if (config.exposeDevLinks && !mail.delivered) devLink = link;
    }
    return json({
      ok: true,
      message: "If an account exists for that address, a reset link has been sent.",
      ...(devLink ? { devLink } : {}),
    });
  } catch (error) {
    return handleError(error, "auth/forgot");
  }
}
