import { setMfaSecret, enableMfa, disableMfa, getUserById } from "@/lib/data/users";
import { generateTotpSecret, otpauthUrl, verifyTotp } from "@/lib/auth/totp";
import { guardMutation, handleError, json, limit, readJson, requireApiAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const admin = await requireApiAdmin(request);
    const user = await getUserById(admin._id);
    return json({ ok: true, mfaEnabled: Boolean(user.mfaEnabled) });
  } catch (error) {
    return handleError(error, "admin/mfa/get");
  }
}

export async function POST(request) {
  try {
    guardMutation(request);
    limit(request, "admin-mfa", { max: 12, windowMs: 15 * 60_000 });
    const admin = await requireApiAdmin(request);
    const payload = await readJson(request);
    const action = String(payload.action || "");

    if (action === "setup") {
      const secret = generateTotpSecret();
      await setMfaSecret(admin._id, secret);
      return json({
        ok: true,
        secret,
        otpauth: otpauthUrl({ secret, account: admin.email }),
        message: "Scan the QR code or enter the secret, then confirm with a code.",
      });
    }

    const user = await getUserById(admin._id);
    if (action === "enable") {
      if (!user?.mfaPendingSecret) return json({ ok: false, error: "Start MFA setup first." }, 400);
      if (!verifyTotp(user.mfaPendingSecret, payload.code)) {
        return json({ ok: false, error: "That code is not valid. Try again." }, 400);
      }
      await enableMfa(admin._id);
      await writeAudit({
        actor: admin,
        action: "admin.mfa_enabled",
        targetType: "user",
        targetId: admin._id,
        summary: "Enabled TOTP multi-factor authentication",
      });
      return json({ ok: true, mfaEnabled: true, message: "Two-factor authentication enabled." });
    }

    if (action === "disable") {
      if (!user?.mfaEnabled) return json({ ok: true, mfaEnabled: false });
      if (!verifyTotp(user.mfaSecret, payload.code)) {
        return json({ ok: false, error: "Enter a valid authenticator code to disable MFA." }, 400);
      }
      await disableMfa(admin._id);
      await writeAudit({
        actor: admin,
        action: "admin.mfa_disabled",
        targetType: "user",
        targetId: admin._id,
        summary: "Disabled TOTP multi-factor authentication",
      });
      return json({ ok: true, mfaEnabled: false, message: "Two-factor authentication disabled." });
    }

    return json({ ok: false, error: "Unknown action." }, 400);
  } catch (error) {
    return handleError(error, "admin/mfa");
  }
}
