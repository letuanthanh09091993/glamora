"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { ROLE_META } from "@/lib/role-meta";
import { useLanguage } from "@/components/providers/language-provider";
import { allowsSessionWithoutVerifiedEmail, AuthRoutes } from "@/lib/auth/rbac";

export function RoleGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isReady, isEmailVerified } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (user.accountStatus === "suspended" && !pathname.startsWith(AuthRoutes.accountSuspended)) {
      router.replace(AuthRoutes.accountSuspended);
      return;
    }

    const needsEmailForThisShell =
      (pathname.startsWith("/dashboard") || pathname.startsWith("/account")) &&
      !allowsSessionWithoutVerifiedEmail(pathname);

    if (!isEmailVerified && needsEmailForThisShell) {
      router.replace(AuthRoutes.verifyEmail);
      return;
    }

    if (pathname === "/dashboard") {
      router.replace(ROLE_META[user.role].dashboardPath);
    }
  }, [isEmailVerified, isReady, pathname, router, user]);

  if (!isReady || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">
        {t("gate.loadingSession")}
      </div>
    );
  }

  return <>{children}</>;
}
