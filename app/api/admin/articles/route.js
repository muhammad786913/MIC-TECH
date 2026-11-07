import { listAdminArticles, createArticle } from "@/lib/data/articles";
import { guardMutation, handleError, json, limit, readJson, requireApiAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await requireApiAdmin(request);
    const params = new URL(request.url).searchParams;
    const result = await listAdminArticles({
      status: params.get("status") || "",
      q: params.get("q") || "",
      categorySlug: params.get("category") || "",
      page: params.get("page") || 1,
      sort: params.get("sort") || "updated",
    });
    return json({ ok: true, ...result });
  } catch (error) {
    return handleError(error, "admin/articles/list");
  }
}

export async function POST(request) {
  try {
    guardMutation(request);
    limit(request, "admin-article", { max: 30, windowMs: 60_000 });
    const admin = await requireApiAdmin(request);
    const payload = await readJson(request, { maxBytes: 2_000_000 });
    const article = await createArticle(admin, payload);
    await writeAudit({
      actor: admin,
      action: "article.create",
      targetType: "article",
      targetId: article._id,
      summary: `Created "${article.title}" (${article.status})`,
    });
    return json({ ok: true, article }, 201);
  } catch (error) {
    return handleError(error, "admin/articles/create");
  }
}
