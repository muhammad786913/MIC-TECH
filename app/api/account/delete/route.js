import { deleteAccount } from "@/lib/data/users";
import { clearSessionCookie } from "@/lib/auth/session";
import { guardMutation, handleError, json, limit, readJson, requireApiUser } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    guardMutation(request);
    limit(request, "account-delete", { max: 4, windowMs: 60 * 60_000 });
    const session = await requireApiUser(request);
    if (session.role === "admin") {
      return json({ ok: false, error: "Administrator accounts cannot be deleted here." }, 403);
    }
    const payload = await readJson(request);
    await deleteAccount(session._id, payload.password);
    await writeAudit({
      actor: null,
      action: "account.delete",
      targetType: "user",
      targetId: session._id,
      summary: "Reader deleted their account",
    });
    const response = json({ ok: true, message: "Your account has been closed." });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return handleError(error, "account/delete");
  }
}
