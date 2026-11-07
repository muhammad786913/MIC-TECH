import { listCategories, createCategory } from "@/lib/data/categories";
import { guardMutation, handleError, json, readJson, requireApiAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await requireApiAdmin(request);
    const categories = await listCategories({ includeHidden: true, withCounts: true });
    return json({ ok: true, categories });
  } catch (error) {
    return handleError(error, "admin/categories/list");
  }
}

export async function POST(request) {
  try {
    guardMutation(request);
    const admin = await requireApiAdmin(request);
    const payload = await readJson(request);
    const category = await createCategory(payload);
    await writeAudit({
      actor: admin,
      action: "category.create",
      targetType: "category",
      targetId: category._id,
      summary: `Created category "${category.name}"`,
    });
    return json({ ok: true, category }, 201);
  } catch (error) {
    return handleError(error, "admin/categories/create");
  }
}
