import { moderateComment, deleteComment } from "@/lib/data/comments";
import { guardMutation, handleError, json, limit, readJson, requireApiAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    guardMutation(request);
    limit(request, "admin-comment-moderate", { max: 120, windowMs: 60_000 });
    const admin = await requireApiAdmin(request);
    const { id } = await params;
    const payload = await readJson(request);
    const comment = await moderateComment(id, payload.status, admin);
    await writeAudit({
      actor: admin,
      action: "comment.moderate",
      targetType: "comment",
      targetId: id,
      summary: `Set comment status to ${payload.status}`,
    });
    return json({ ok: true, comment });
  } catch (error) {
    return handleError(error, "admin/comments/moderate");
  }
}

export async function DELETE(request, { params }) {
  try {
    guardMutation(request);
    const admin = await requireApiAdmin(request);
    const { id } = await params;
    await deleteComment(id, { isAdmin: true });
    await writeAudit({
      actor: admin,
      action: "comment.delete",
      targetType: "comment",
      targetId: id,
      summary: "Deleted comment",
    });
    return json({ ok: true });
  } catch (error) {
    return handleError(error, "admin/comments/delete");
  }
}
