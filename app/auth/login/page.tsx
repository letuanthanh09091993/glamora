"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/auth-types";
import { postLoginPathForRole } from "@/lib/auth/post-login-path";
import { AppRoutes } from "@/lib/app-routes";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { resolveLoginRedirect } from "@/lib/auth/resolve-login-redirect";
import { AuthShell } from "@/components/auth/auth-shell";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { Notice } from "@/components/ui/notice";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
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

    const result = await login(email, password);
    setLoading(false);

    if (!result.ok) {
      setNotice({ type: "error", message: t(result.messageKey) });
      return;
    }

    setNotice({ type: "success", message: t(result.messageKey) });

    let redirectTo = result.redirectTo;
    let role: UserRole | null | undefined = result.role;

    if (!redirectTo) {
      const sb = getSupabaseBrowserClient();
      const {
        data: { user: authUser },
      } = await sb.auth.getUser();
      if (authUser) {
        const resolved = await resolveLoginRedirect(sb, authUser.id);
        redirectTo = resolved.redirectTo;
        role = resolved.role;
      }
    }

    redirectTo = redirectTo ?? postLoginPathForRole(role);
    console.log("[LOGIN REDIRECT]", { role, redirectTo });

    router.replace(redirectTo);
    router.refresh();
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
