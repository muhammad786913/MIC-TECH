import { createComment, listArticleComments } from "@/lib/data/comments";
import { guardMutation, handleError, json, limit, readJson, requireApiUser } from "@/lib/api";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const articleId = new URL(request.url).searchParams.get("articleId") || "";
    if (!articleId) return json({ ok: false, error: "Article is required." }, 400);
    const comments = await listArticleComments(articleId);
    return json({ ok: true, comments });
  } catch (error) {
    return handleError(error, "comments/list");
  }
}

export async function POST(request) {
  try {
    guardMutation(request);
    limit(request, "comment", { max: 8, windowMs: 10 * 60_000 });
    const payload = await readJson(request);

    // Bot protection via Cloudflare Turnstile (defense in depth — comments require auth).
    const turnstile = await verifyTurnstile(payload.turnstileToken, request);
    if (!turnstile.success) {
      return fail("Bot verification failed. Please try again.", 403, {
        turnstile: turnstile.error,
      });
    }

    const user = await requireApiUser(request);
    const result = await createComment({
      user,
      articleId: String(payload.articleId || ""),
      body: payload.body,
      parentId: payload.parentId ? String(payload.parentId) : null,
    });
    return json({
      ok: true,
      comment: result.comment,
      status: result.status,
      message:
        result.status === "approved"
          ? "Your comment is live."
          : "Your comment is awaiting moderation.",
    });
  } catch (error) {
    return handleError(error, "comments/create");
  }
}
