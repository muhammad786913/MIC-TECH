import { dbHealth } from "@/lib/db/store";
import { handleError, json } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await dbHealth();
    return json({
      ok: health.ok,
      service: "mic-tech",
      database: health.driver || "unknown",
      time: new Date().toISOString(),
    });
  } catch (error) {
    return handleError(error, "health");
  }
}
