/** Debug mode: auth guard disabled — role routing happens on /dashboard only. */
export default function CustomerDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
