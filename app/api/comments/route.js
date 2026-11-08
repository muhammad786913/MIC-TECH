import { createComment, listArticleComments } from "@/lib/data/comments";
import { guardMutation, fail, handleError, json, limit, readJson } from "@/lib/api";

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

    // Optional authentication — comments work without signing in.
    let user = null;
    try {
      user = await requireApiUser(request);
    } catch {
      // User not signed in — allow anonymous comment.
    }
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
