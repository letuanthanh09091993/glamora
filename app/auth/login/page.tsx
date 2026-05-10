"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { Notice } from "@/components/ui/notice";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";

export default function LoginPage() {
  const router = useRouter();
  const { login, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    const result = await login(username, password);
    setLoading(false);
    setNotice({ type: result.ok ? "success" : "error", message: t(result.messageKey) });

    if (result.ok) {
      refreshUser();
      setTimeout(() => router.push("/dashboard"), 500);
    }
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
          label={t("login.username")}
          value={username}
          onChange={setUsername}
          placeholder={t("login.usernamePlaceholder")}
        />
        <AppInput
          label={t("login.password")}
          type="password"
          value={password}
          onChange={setPassword}
          placeholder={t("login.passwordPlaceholder")}
        />
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
