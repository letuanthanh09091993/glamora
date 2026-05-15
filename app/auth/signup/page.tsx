"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RoleCard } from "@/components/auth/role-card";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { Notice } from "@/components/ui/notice";
import { UserRole } from "@/lib/auth-types";
import { SIGNUP_ROLES } from "@/lib/role-meta";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { getRoleDescription, getRoleLabel } from "@/lib/i18n";

type FormState = {
  email: string;
  username: string;
  password: string;
  phoneNumber: string;
  role: UserRole;
};

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { t, language } = useLanguage();
  const [form, setForm] = useState<FormState>({
    email: "",
    username: "",
    password: "",
    phoneNumber: "",
    role: "customer",
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  const errors = useMemo(() => {
    const emailTrim = form.email.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim);
    return {
      email: !emailTrim ? t("signup.emailRequired") : !emailOk ? t("signup.emailInvalid") : "",
      username:
        form.username.trim().length < 3 ? t("signup.usernameMin") : "",
      password:
        form.password.trim().length < 6 ? t("signup.passwordMin") : "",
      phoneNumber:
        !/^[0-9+\s-]{9,15}$/.test(form.phoneNumber.trim())
          ? t("signup.phoneInvalid")
          : "",
    };
  }, [form, t]);

  const hasError = Boolean(errors.email || errors.username || errors.password || errors.phoneNumber);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (hasError) {
      setNotice({ type: "error", message: t("signup.fixErrors") });
      return;
    }

    setLoading(true);
    setNotice(null);
    const result = await signUp(form);
    setLoading(false);
    setNotice({
      type: result.ok ? "success" : "error",
      message: t(result.messageKey),
    });

    if (result.ok) {
      setTimeout(() => router.push("/auth/login?registered=1"), 600);
    }
  }

  return (
    <AuthShell
      title={t("signup.title")}
      subtitle={t("signup.subtitle")}
      footerText={t("signup.footerText")}
      footerLink="/auth/login"
      footerLabel={t("signup.footerLinkLabel")}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AppInput
          label={t("signup.email")}
          value={form.email}
          onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
          placeholder={t("signup.emailPlaceholder")}
          error={errors.email}
        />
        <AppInput
          label={t("signup.username")}
          value={form.username}
          onChange={(value) => setForm((prev) => ({ ...prev, username: value }))}
          placeholder={t("signup.usernamePlaceholder")}
          error={errors.username}
        />
        <AppInput
          label={t("signup.password")}
          type="password"
          value={form.password}
          onChange={(value) => setForm((prev) => ({ ...prev, password: value }))}
          placeholder={t("signup.passwordPlaceholder")}
          error={errors.password}
        />
        <AppInput
          label={t("signup.phoneNumber")}
          value={form.phoneNumber}
          onChange={(value) => setForm((prev) => ({ ...prev, phoneNumber: value }))}
          placeholder={t("signup.phonePlaceholder")}
          error={errors.phoneNumber}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">{t("signup.selectRole")}</p>
          <div className="grid gap-3">
            {SIGNUP_ROLES.map((role) => (
              <RoleCard
                key={role}
                role={role}
                title={getRoleLabel(language, role)}
                description={getRoleDescription(language, role)}
                active={form.role === role}
                onSelect={(selected) => setForm((prev) => ({ ...prev, role: selected }))}
              />
            ))}
          </div>
        </div>

        {notice ? <Notice type={notice.type} message={notice.message} /> : null}

        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-sm text-gray-500 hover:text-black">
            {t("common.backHome")}
          </Link>
          <AppButton type="submit" loading={loading}>
            {t("signup.submit")}
          </AppButton>
        </div>
      </form>
    </AuthShell>
  );
}
