import { deleteComment } from "@/lib/data/comments";
import { guardMutation, handleError, json, limit, requireApiUser } from "@/lib/api";

export const runtime = "nodejs";

export async function DELETE(request, { params }) {
  try {
    guardMutation(request);
    limit(request, "comment-delete", { max: 20, windowMs: 60 * 60_000 });
    const user = await requireApiUser(request);
    const { id } = await params;
    await deleteComment(id, { user, isAdmin: user.role === "admin" });
    return json({ ok: true });
  } catch (error) {
    return handleError(error, "comments/delete");
  }
}
