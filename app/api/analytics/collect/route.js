import { randomUUID } from "node:crypto";
import { recordEvent } from "@/lib/data/analytics";
import { VISITOR_COOKIE, SESSION_TTL_SECONDS } from "@/lib/config";
import { apiUser, guardMutation, handleError, json, limit, readJson } from "@/lib/api";
import { isBot } from "@/lib/utils";

export const runtime = "nodejs";

const COOKIE = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS * 52,
};

export async function POST(request) {
  try {
    guardMutation(request);
    const userAgent = request.headers.get("user-agent") || "";
    if (isBot(userAgent)) return json({ ok: true, skipped: true });

    const payload = await readJson(request, { maxBytes: 8_000 });
    let visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
    const fresh = !visitorId;
    if (!visitorId || visitorId.length < 8) visitorId = randomUUID();

    limit(request, "analytics", { max: 120, windowMs: 60_000, scope: visitorId });
    const user = await apiUser(request).catch(() => null);
    const result = await recordEvent({
      type: payload.type === "share" ? "share" : "pageview",
      articleId: String(payload.articleId || ""),
      path: String(payload.path || "/"),
      referrer: String(payload.referrer || ""),
      request,
      user,
      visitorId,
    });

    const response = json({ ok: true, ...result });
    if (fresh) response.cookies.set(VISITOR_COOKIE, visitorId, COOKIE);
    return response;
  } catch (error) {
    return handleError(error, "analytics/collect");
  }
}
