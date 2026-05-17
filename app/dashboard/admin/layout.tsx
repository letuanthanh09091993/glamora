import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { AppRoutes } from "@/lib/app-routes";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { dbUser } = await getCurrentUser();

  if (dbUser.role !== "admin" || dbUser.account_status !== "active") {
    redirect(AppRoutes.dashboardCustomer);
  }

  return <>{children}</>;
}
