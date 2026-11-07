/** Append-only administrative audit trail. Failures never block the primary action. */
import { db, ensureDb } from "@/lib/db/store";
import { isoNow } from "@/lib/utils";

export async function writeAudit({
  actor,
  action,
  targetType = "",
  targetId = "",
  summary = "",
  meta = {},
}) {
  try {
    await ensureDb();
    await db.collection("auditLogs").insertOne({
      actorId: actor?._id || "",
      actorEmail: actor?.email || "",
      actorName: actor?.name || "",
      action: String(action || "unknown").slice(0, 80),
      targetType: String(targetType || "").slice(0, 40),
      targetId: String(targetId || "").slice(0, 80),
      summary: String(summary || "").slice(0, 300),
      meta: meta && typeof meta === "object" ? meta : {},
      createdAt: isoNow(),
    });
  } catch (error) {
    console.warn(`[audit] failed: ${error?.message || error}`);
  }
}

export async function listAudit({ limit = 50, skip = 0, action = "" } = {}) {
  await ensureDb();
  const filter = action ? { action } : {};
  const [items, total] = await Promise.all([
    db.collection("auditLogs").find(filter, {
      sort: { createdAt: -1 },
      limit: Math.min(Number(limit) || 50, 200),
      skip: Number(skip) || 0,
    }),
    db.collection("auditLogs").count(filter),
  ]);
  return { items, total };
}
