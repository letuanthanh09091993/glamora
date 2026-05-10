"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { getUserByUsername } from "@/lib/auth-storage";
import { UserAccount } from "@/lib/auth-types";
import { getRoleLabel } from "@/lib/i18n";
import { useLanguage } from "@/components/providers/language-provider";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserAccount | null>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (!params.username) return;
    const user = getUserByUsername(params.username);
    setProfile(user);
  }, [params.username]);

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fdf8f6] p-6">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-black">{t("profile.notFound")}</p>
          <Link className="mt-4 inline-block text-pink-500 hover:underline" href="/">
            {t("common.backHome")}
          </Link>
        </div>
      </main>
    );
  }

  if (!profile.isPublicProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fdf8f6] p-6">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-black">{t("profile.privateProfile")}</p>
          <Link className="mt-4 inline-block text-pink-500 hover:underline" href="/">
            {t("common.backHome")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fdf8f6] p-4 sm:p-6">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-pink-500">{t("profile.publicProfile")}</p>
            <h1 className="text-3xl font-bold text-black">{profile.username}</h1>
            <p className="text-sm text-gray-600">{getRoleLabel(language, profile.role)}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href="/auth/login">
              <AppButton variant="secondary">{t("profile.loginToConnect")}</AppButton>
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-black/10 p-5">
            <p className="text-sm text-gray-500">{t("profile.location")}</p>
            <p className="mt-1 font-medium text-black">{profile.location || t("profile.updatingSoon")}</p>
          </div>
          <div className="rounded-3xl border border-black/10 p-5">
            <p className="text-sm text-gray-500">{t("profile.pricing")}</p>
            <p className="mt-1 font-medium text-black">{profile.pricing || t("profile.contactForQuote")}</p>
          </div>
          <div className="rounded-3xl border border-black/10 p-5">
            <p className="text-sm text-gray-500">{t("profile.rating")}</p>
            <p className="mt-1 font-medium text-black">
              {profile.rating
                ? `${profile.rating} ★ (${profile.reviews ?? 0} ${t("profile.reviewsSuffix")})`
                : t("profile.noReviews")}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-black/10 p-6">
          <h2 className="text-lg font-semibold text-black">{t("profile.bio")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {profile.bio || t("profile.fallbackBio")}
          </p>
        </div>
      </div>
    </main>
  );
}
