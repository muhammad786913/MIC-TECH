import { updateProfile, getUserById } from "@/lib/data/users";
import { setSessionCookie } from "@/lib/auth/session";
import { guardMutation, handleError, json, limit, readJson, requireApiUser } from "@/lib/api";

export const runtime = "nodejs";

export async function PATCH(request) {
  try {
    guardMutation(request);
    limit(request, "account-profile", { max: 20, windowMs: 60 * 60_000 });
    const session = await requireApiUser(request);
    const payload = await readJson(request);
    await updateProfile(session._id, payload);
    const user = await getUserById(session._id);

    const response = json({
      ok: true,
      message: "Profile updated.",
      user: { name: user.name, bio: user.bio || "", avatarUrl: user.avatarUrl || "" },
    });
    await setSessionCookie(response, {
      sub: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      sv: user.sessionVersion || 0,
    });
    return response;
  } catch (error) {
    return handleError(error, "account/profile");
  }
}
