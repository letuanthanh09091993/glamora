"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AppRoutes } from "@/lib/app-routes";
import { AuthShell } from "@/components/auth/auth-shell";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { Notice } from "@/components/ui/notice";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { mapSupabaseAuthError } from "@/lib/supabase/auth-errors";

export default function LoginPage() {
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);

    const { data, error } = await signIn(email, password);

    console.log("[LOGIN RESULT]", {
      userId: data.user?.id ?? null,
      session: data.session
        ? {
            expires_at: data.session.expires_at,
            hasAccessToken: Boolean(data.session.access_token),
          }
        : null,
      error: error?.message ?? null,
    });

    if (error) {
      setLoading(false);
      setNotice({ type: "error", message: t(mapSupabaseAuthError(error)) });
      return;
    }

    console.log("[LOGIN RESULT] access token exists:", Boolean(data.session?.access_token));
    console.log("[LOGIN HARD REDIRECT]");

    window.location.href = AppRoutes.dashboard;
  }

  return (
    <AuthShell
      title={t("login.title")}
      subtitle={t("login.subtitle")}
      footerText={t("login.footerText")}
      footerLink="/auth/signup"
      footerLabel={t("login.footerLinkLabel")}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AppInput
          label={t("login.email")}
          value={email}
          onChange={setEmail}
          placeholder={t("login.emailPlaceholder")}
        />
        <AppInput
          label={t("login.password")}
          type="password"
          value={password}
          onChange={setPassword}
          placeholder={t("login.passwordPlaceholder")}
        />
        <div className="flex justify-end">
          <Link
            href={AppRoutes.forgotPassword}
            className="text-sm font-medium text-pink-500 transition hover:underline"
          >
            {t("login.forgotPassword")}
          </Link>
        </div>
        {notice ? <Notice type={notice.type} message={notice.message} /> : null}
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-sm text-gray-500 hover:text-black">
            {t("common.backHome")}
          </Link>
          <AppButton type="submit" loading={loading}>
            {t("login.submit")}
          </AppButton>
        </div>
      </form>
    </AuthShell>
  );
}
