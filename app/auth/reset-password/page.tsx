"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { Notice } from "@/components/ui/notice";
import { useLanguage } from "@/components/providers/language-provider";
import { updatePasswordAfterRecovery } from "@/lib/auth/client-actions";
import { establishRecoverySessionFromUrl } from "@/lib/auth/recovery-session";
import { AppRoutes } from "@/lib/app-routes";
import { getBrowserSupabase } from "@/lib/supabase/browser-client";

type SessionPhase = "establishing" | "ready" | "invalid";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phase, setPhase] = useState<SessionPhase>("establishing");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setPhase("establishing");
      setNotice(null);

      try {
        const result = await establishRecoverySessionFromUrl();
        if (cancelled) return;

        if (result.ok) {
          setPhase("ready");
          return;
        }

        if (result.reason === "invalid_link") {
          setPhase("invalid");
          setNotice({ type: "error", message: t("authReset.invalidSession") });
          return;
        }

        if (result.reason === "network") {
          setPhase("invalid");
          setNotice({ type: "error", message: t("authMessages.networkError") });
          return;
        }

        setPhase("invalid");
      } catch {
        if (!cancelled) {
          setPhase("invalid");
          setNotice({ type: "error", message: t("authMessages.networkError") });
        }
      }
    }

    void bootstrap();

    const sb = getBrowserSupabase();
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" && session?.user) {
        setPhase("ready");
        setNotice(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [t]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (phase !== "ready") return;

    setNotice(null);

    if (password !== confirm) {
      setNotice({ type: "error", message: t("authMessages.adminPasswordMismatch") });
      return;
    }

    setSubmitting(true);
    const result = await updatePasswordAfterRecovery(password);
    setSubmitting(false);
    setNotice({ type: result.ok ? "success" : "error", message: t(result.messageKey) });

    if (!result.ok && result.messageKey === "authReset.invalidSession") {
      setPhase("invalid");
    }

    if (result.ok) {
      setTimeout(async () => {
        try {
          await getBrowserSupabase().auth.signOut({ scope: "local" });
        } catch {
          /* ignore */
        }
        router.replace(AppRoutes.login);
      }, 800);
    }
  }

  if (phase === "establishing") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#fff7fc] via-[#fffaf5] to-[#fff] px-4 text-center text-sm text-gray-500">
        <p>{t("authReset.establishingSession")}</p>
        <p className="text-xs text-gray-400">{t("gate.loadingSession")}</p>
      </main>
    );
  }

  if (phase === "invalid") {
    return (
      <AuthShell
        title={t("authReset.title")}
        subtitle={t("authReset.invalidSession")}
        footerText={t("authReset.footerLead")}
        footerLink={AppRoutes.forgotPassword}
        footerLabel={t("authForgot.submit")}
      >
        <div className="space-y-4">
          {notice ? <Notice type={notice.type} message={notice.message} /> : null}
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
          <AppButton type="submit" loading={submitting}>
            {t("authReset.submit")}
          </AppButton>
        </div>
      </form>
    </AuthShell>
  );
}
