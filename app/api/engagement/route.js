import { toggleBookmark, toggleLike } from "@/lib/data/engagement";
import { guardMutation, handleError, json, limit, readJson, requireApiUser } from "@/lib/api";
import { oneOf } from "@/lib/validation";
import { VISITOR_COOKIE } from "@/lib/config";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    guardMutation(request);
    limit(request, "engagement", { max: 60, windowMs: 60_000 });
    const payload = await readJson(request);

    // Optional authentication — engagement works without signing in.
    // Fall back to the visitor cookie (mic_vid) for anonymous users.
    let userId = null;
    try {
      const user = await requireApiUser(request);
      userId = user._id;
    } catch {
      userId = request.cookies.get(VISITOR_COOKIE)?.value || `anon-${crypto.randomUUID()}`;
    }

    const action = oneOf(payload.action, ["like", "bookmark"], "Action");
    const articleId = String(payload.articleId || "");
    if (!articleId) return json({ ok: false, error: "Article is required." }, 400);
    const result = action === "like"
      ? await toggleLike(userId, articleId)
      : await toggleBookmark(userId, articleId);
    return json({ ok: true, ...result });
  } catch (error) {
    return handleError(error, "engagement");
  }
}
