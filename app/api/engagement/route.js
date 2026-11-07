import { toggleBookmark, toggleLike } from "@/lib/data/engagement";
import { guardMutation, handleError, json, limit, readJson, requireApiUser } from "@/lib/api";
import { oneOf } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    guardMutation(request);
    limit(request, "engagement", { max: 60, windowMs: 60_000 });
    const user = await requireApiUser(request);
    const payload = await readJson(request);
    const action = oneOf(payload.action, ["like", "bookmark"], "Action");
    const articleId = String(payload.articleId || "");
    if (!articleId) return json({ ok: false, error: "Article is required." }, 400);
    const result = action === "like" ? await toggleLike(user._id, articleId) : await toggleBookmark(user._id, articleId);
    return json({ ok: true, ...result });
  } catch (error) {
    return handleError(error, "engagement");
  }
}
