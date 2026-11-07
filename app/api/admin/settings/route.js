import { getSettings, updateSettings } from "@/lib/data/settings";
import { guardMutation, handleError, json, readJson, requireApiAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await requireApiAdmin(request);
    return json({ ok: true, settings: await getSettings() });
  } catch (error) {
    return handleError(error, "admin/settings/get");
  }
}

export async function PATCH(request) {
  try {
    guardMutation(request);
    const admin = await requireApiAdmin(request);
    const payload = await readJson(request);
    const settings = await updateSettings(payload);
    await writeAudit({
      actor: admin,
      action: "settings.update",
      targetType: "settings",
      targetId: "site",
      summary: "Updated site settings",
    });
    return json({ ok: true, settings });
  } catch (error) {
    return handleError(error, "admin/settings/update");
  }
}
