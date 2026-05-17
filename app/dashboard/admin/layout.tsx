import { AdminDashboardShell } from "@/components/admin/admin-dashboard-shell";
import { requireAdminAccess } from "@/lib/admin/require-admin-page";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdminAccess();

  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}
