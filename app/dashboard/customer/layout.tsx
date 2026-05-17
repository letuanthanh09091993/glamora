import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function CustomerDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await getCurrentUser();
  return <>{children}</>;
}
