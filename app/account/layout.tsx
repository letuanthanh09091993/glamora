import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await getCurrentUser();
  return <>{children}</>;
}
