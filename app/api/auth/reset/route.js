import { resetPassword } from "@/lib/data/users";
import { clearSessionCookie } from "@/lib/auth/session";
import { guardMutation, handleError, json, limit, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    guardMutation(request);
    limit(request, "reset", { max: 8, windowMs: 60 * 60_000 });
    const payload = await readJson(request);
    await resetPassword(String(payload.token || ""), payload.password);
    const response = json({ ok: true, message: "Password updated. Sign in with your new password." });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return handleError(error, "auth/reset");
  }
}
