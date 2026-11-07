import { changePassword, getUserById } from "@/lib/data/users";
import { setSessionCookie } from "@/lib/auth/session";
import { guardMutation, handleError, json, limit, readJson, requireApiUser } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    guardMutation(request);
    limit(request, "account-password", { max: 6, windowMs: 60 * 60_000 });
    const session = await requireApiUser(request);
    const payload = await readJson(request);
    await changePassword(session._id, payload.currentPassword, payload.newPassword);
    const user = await getUserById(session._id);
    await writeAudit({
      actor: user,
      action: "account.password_change",
      targetType: "user",
      targetId: user._id,
      summary: "Password changed from account settings",
    });
    const response = json({ ok: true, message: "Password updated. Other sessions were signed out." });
    await setSessionCookie(response, {
      sub: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      sv: user.sessionVersion || 0,
    });
    return response;
  } catch (error) {
    return handleError(error, "account/password");
  }
}
