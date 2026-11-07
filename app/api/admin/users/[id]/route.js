import { adminUpdateUser } from "@/lib/data/users";
import { guardMutation, handleError, json, readJson, requireApiAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    guardMutation(request);
    const admin = await requireApiAdmin(request);
    const { id } = await params;
    const payload = await readJson(request);
    const user = await adminUpdateUser(id, payload);
    await writeAudit({
      actor: admin,
      action: "user.update",
      targetType: "user",
      targetId: id,
      summary: "Updated reader account",
    });
    return json({ ok: true, user });
  } catch (error) {
    return handleError(error, "admin/users/update");
  }
}
