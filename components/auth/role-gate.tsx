"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { ROLE_META } from "@/lib/role-meta";
import { useLanguage } from "@/components/providers/language-provider";

export function RoleGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isReady } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (pathname === "/dashboard") {
      router.replace(ROLE_META[user.role].dashboardPath);
    }
  }, [isReady, pathname, router, user]);

  if (!isReady || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">
        {t("gate.loadingSession")}
      </div>
    );
  }

  return <>{children}</>;
}
