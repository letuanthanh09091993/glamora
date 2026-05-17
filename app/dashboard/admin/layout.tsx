import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { postLoginPathForRole } from "@/lib/auth/post-login-path";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { dbUser } = await getCurrentUser();

  if (dbUser.role !== "admin" || dbUser.account_status !== "active") {
    const redirectTo =
      dbUser.role === "admin" && dbUser.account_status !== "active"
        ? postLoginPathForRole(null)
        : postLoginPathForRole(dbUser.role);
    redirect(redirectTo);
  }

  return <>{children}</>;
}
