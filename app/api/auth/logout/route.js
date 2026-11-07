import { clearSessionCookie } from "@/lib/auth/session";
import { guardMutation, handleError, json } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    guardMutation(request);
    const response = json({ ok: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return handleError(error, "auth/logout");
  }
}
