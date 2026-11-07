import { updateCategory, deleteCategory } from "@/lib/data/categories";
import { guardMutation, handleError, json, readJson, requireApiAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    guardMutation(request);
    const admin = await requireApiAdmin(request);
    const { id } = await params;
    const payload = await readJson(request);
    const category = await updateCategory(id, payload);
    await writeAudit({
      actor: admin,
      action: "category.update",
      targetType: "category",
      targetId: id,
      summary: `Updated category "${category.name}"`,
    });
    return json({ ok: true, category });
  } catch (error) {
    return handleError(error, "admin/categories/update");
  }
}

export async function DELETE(request, { params }) {
  try {
    guardMutation(request);
    const admin = await requireApiAdmin(request);
    const { id } = await params;
    await deleteCategory(id);
    await writeAudit({
      actor: admin,
      action: "category.delete",
      targetType: "category",
      targetId: id,
      summary: "Deleted category",
    });
    return json({ ok: true });
  } catch (error) {
    return handleError(error, "admin/categories/delete");
  }
}
