import { getArticleById, updateArticle, deleteArticle } from "@/lib/data/articles";
import { guardMutation, handleError, json, limit, readJson, requireApiAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    await requireApiAdmin(request);
    const { id } = await params;
    const article = await getArticleById(id);
    if (!article) return json({ ok: false, error: "Article not found." }, 404);
    return json({ ok: true, article });
  } catch (error) {
    return handleError(error, "admin/articles/get");
  }
}

export async function PATCH(request, { params }) {
  try {
    guardMutation(request);
    limit(request, "admin-article-update", { max: 60, windowMs: 60_000 });
    const admin = await requireApiAdmin(request);
    const { id } = await params;
    const payload = await readJson(request, { maxBytes: 2_000_000 });
    const article = await updateArticle(id, admin, payload);
    await writeAudit({
      actor: admin,
      action: "article.update",
      targetType: "article",
      targetId: id,
      summary: `Updated "${article.title}" (${article.status})`,
    });
    return json({ ok: true, article });
  } catch (error) {
    return handleError(error, "admin/articles/update");
  }
}

export async function DELETE(request, { params }) {
  try {
    guardMutation(request);
    limit(request, "admin-article-delete", { max: 20, windowMs: 60_000 });
    const admin = await requireApiAdmin(request);
    const { id } = await params;
    await deleteArticle(id);
    await writeAudit({
      actor: admin,
      action: "article.delete",
      targetType: "article",
      targetId: id,
      summary: "Deleted article (soft delete)",
    });
    return json({ ok: true });
  } catch (error) {
    return handleError(error, "admin/articles/delete");
  }
}
