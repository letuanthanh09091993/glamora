"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { Notice } from "@/components/ui/notice";
import { useLanguage } from "@/components/providers/language-provider";
import { requestPasswordResetEmail } from "@/lib/auth/client-actions";
import { AppRoutes } from "@/lib/app-routes";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    const result = await requestPasswordResetEmail(email);
    setLoading(false);
    setNotice({ type: result.ok ? "success" : "error", message: t(result.messageKey) });
    if (result.ok) setSent(true);
  }

  return (
    <AuthShell
      title={t("authForgot.title")}
      subtitle={t("authForgot.subtitle")}
      footerText={t("authForgot.footerLead")}
      footerLink={AppRoutes.login}
      footerLabel={t("common.login")}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AppInput
          label={t("authForgot.emailLabel")}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder={t("authForgot.emailPlaceholder")}
        />
        {notice ? <Notice type={notice.type} message={notice.message} /> : null}
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-sm text-gray-500 hover:text-black">
            {t("common.backHome")}
          </Link>
          <AppButton type="submit" loading={loading} disabled={sent}>
            {t("authForgot.submit")}
          </AppButton>
        </div>
      </form>
    </AuthShell>
  );
}
