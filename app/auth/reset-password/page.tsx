"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { AuthShell } from "@/components/auth/auth-shell";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { Notice } from "@/components/ui/notice";
import { useLanguage } from "@/components/providers/language-provider";
import { updatePasswordAfterRecovery } from "@/lib/auth/client-actions";
import { AppRoutes } from "@/lib/app-routes";
import { getBrowserSupabase } from "@/lib/supabase/browser-client";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const sb = getBrowserSupabase();
    let cancelled = false;

    const sync = (session: Session | null) => {
      setHasSession(Boolean(session?.user));
      setChecking(false);
    };

    void sb.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) sync(session);
    });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) sync(session);
    });

    const timer = window.setTimeout(() => {
      if (!cancelled) setChecking(false);
    }, 2000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setNotice(null);
    if (password !== confirm) {
      setNotice({ type: "error", message: t("authMessages.adminPasswordMismatch") });
      return;
    }
    setLoading(true);
    const result = await updatePasswordAfterRecovery(password);
    setLoading(false);
    setNotice({ type: result.ok ? "success" : "error", message: t(result.messageKey) });
    if (result.ok) {
      setTimeout(async () => {
        try {
          await getBrowserSupabase().auth.signOut();
        } catch {
          /* ignore */
        }
        router.replace(AppRoutes.login);
      }, 800);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fff7fc] via-[#fffaf5] to-[#fff] text-sm text-gray-500">
        {t("gate.loadingSession")}
      </main>
    );
  }

  if (!hasSession) {
    return (
      <AuthShell
        title={t("authReset.title")}
        subtitle={t("authReset.invalidSession")}
        footerText={t("authReset.footerLead")}
        footerLink={AppRoutes.forgotPassword}
        footerLabel={t("authForgot.submit")}
      >
        <div className="space-y-4">
          <Notice type="error" message={t("authReset.invalidSession")} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="text-sm text-gray-500 hover:text-black">
              {t("common.backHome")}
            </Link>
            <Link href={AppRoutes.login} className="text-sm font-semibold text-pink-500 hover:underline">
              {t("authReset.goLogin")}
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("authReset.title")}
      subtitle={t("authReset.subtitle")}
      footerText={t("authReset.footerLead")}
      footerLink={AppRoutes.forgotPassword}
      footerLabel={t("authForgot.submit")}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AppInput
          label={t("authReset.passwordLabel")}
          type="password"
          value={password}
          onChange={setPassword}
          placeholder={t("authReset.passwordPlaceholder")}
        />
        <AppInput
          label={t("authReset.confirmLabel")}
          type="password"
          value={confirm}
          onChange={setConfirm}
          placeholder={t("authReset.passwordPlaceholder")}
        />
        {notice ? <Notice type={notice.type} message={notice.message} /> : null}
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-sm text-gray-500 hover:text-black">
            {t("common.backHome")}
          </Link>
          <AppButton type="submit" loading={loading}>
            {t("authReset.submit")}
          </AppButton>
        </div>
      </form>
    </AuthShell>
  );
}
