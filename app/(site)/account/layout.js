import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login?next=/account");
  if (user.role === "admin") redirect("/admin");
  return children;
}
