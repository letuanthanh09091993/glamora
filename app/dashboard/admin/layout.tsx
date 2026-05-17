/** Temporary: no auth redirects — verify `/dashboard/admin` route in production first. */
export default function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
