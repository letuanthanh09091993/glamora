/** Debug mode: auth guard disabled — use /debug-auth to inspect session. */
export default function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
