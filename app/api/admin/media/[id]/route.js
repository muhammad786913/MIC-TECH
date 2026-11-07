import { deleteMedia } from "@/lib/media";
import { guardMutation, handleError, json, requireApiAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function DELETE(request, { params }) {
  try {
    guardMutation(request);
    const admin = await requireApiAdmin(request);
    const { id } = await params;
    await deleteMedia(id);
    await writeAudit({
      actor: admin,
      action: "media.delete",
      targetType: "media",
      targetId: id,
      summary: "Deleted media file",
    });
    return json({ ok: true });
  } catch (error) {
    return handleError(error, "admin/media/delete");
  }
}
