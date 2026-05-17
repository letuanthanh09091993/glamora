"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { AppButton } from "@/components/ui/app-button";
import { Notice } from "@/components/ui/notice";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { resendSignupVerificationEmail } from "@/lib/auth/client-actions";
import { AppRoutes } from "@/lib/app-routes";
import { getBrowserSupabase } from "@/lib/supabase/browser-client";

export default function VerifyEmailPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user, isReady, isEmailVerified, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  /* Debug mode: client redirect disabled — use /dashboard for role routing */
  // useEffect(() => {
  //   if (!isReady) return;
  //   if (user && isEmailVerified) {
  //     router.replace(ROLE_META[user.role].dashboardPath);
  //   }
  // }, [isReady, user, isEmailVerified, router]);

  useEffect(() => {
    if (!isReady || !user) return;
    void getBrowserSupabase()
      .auth.getUser()
      .then(({ data: { user: u } }) => {
        setAuthEmail(u?.email ?? null);
      });
  }, [isReady, user]);

  async function handleResend() {
    setLoading(true);
    setNotice(null);
    const result = await resendSignupVerificationEmail();
    setLoading(false);
    setNotice({ type: result.ok ? "success" : "error", message: t(result.messageKey) });
    if (result.ok) void refreshUser();
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    router.replace(AppRoutes.login);
  }

  if (!isReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fff7fc] via-[#fffaf5] to-[#fff] text-sm text-gray-500">
        {t("gate.loadingSession")}
      </main>
    );
  }

  if (!user) {
    return (
      <AuthShell
        title={t("authVerify.title")}
        subtitle={t("authVerify.subtitle")}
        footerText={t("authVerify.footerLead")}
        footerLink={AppRoutes.login}
        footerLabel={t("common.login")}
      >
        <Notice type="error" message={t("authMessages.noAuthenticatedUser")} />
        <div className="mt-4 flex justify-end">
          <Link href={AppRoutes.login} className="text-sm font-semibold text-pink-500 hover:underline">
            {t("common.login")}
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (isEmailVerified) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fff7fc] via-[#fffaf5] to-[#fff] text-sm text-gray-500">
        {t("gate.loadingSession")}
      </main>
    );
  }

  const displayEmail = user.email?.trim() || authEmail;

  return (
    <AuthShell
      title={t("authVerify.title")}
      subtitle={t("authVerify.subtitle")}
      footerText={t("authVerify.footerLead")}
      footerLink={AppRoutes.login}
      footerLabel={t("common.login")}
    >
      <div className="space-y-4">
        {displayEmail ? (
          <p className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-gray-600">
            <span className="text-gray-500">{t("authForgot.emailLabel")}</span>
            <span className="ml-2 font-medium text-black">{displayEmail}</span>
          </p>
        ) : null}
        <p className="text-sm text-gray-600">{t("authVerify.checkInbox")}</p>
        {notice ? <Notice type={notice.type} message={notice.message} /> : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-sm text-gray-500 hover:text-black">
            {t("common.backHome")}
          </Link>
          <div className="flex flex-wrap justify-end gap-3">
            <AppButton variant="secondary" type="button" loading={loggingOut} onClick={handleLogout}>
              {t("authSuspended.logout")}
            </AppButton>
            <AppButton type="button" loading={loading} onClick={handleResend}>
              {t("authVerify.resend")}
            </AppButton>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
