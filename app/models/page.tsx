"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listPublicModels } from "@/lib/auth-storage";
import { UserAccount } from "@/lib/auth-types";
import { AppRoutes } from "@/lib/app-routes";
import { AppLogoLink } from "@/components/ui/app-logo-link";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useLanguage } from "@/components/providers/language-provider";

export default function ModelsIndexPage() {
  const { t } = useLanguage();
  const [models, setModels] = useState<UserAccount[]>([]);

  useEffect(() => {
    setModels(listPublicModels());
  }, []);

  return (
    <main className="min-h-screen bg-[#fdf8f6] text-[#2b2b2b]">
      <header className="border-b border-black/5 bg-[#fdf8f6]/95 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <AppLogoLink href={AppRoutes.home} />
          <div className="flex shrink-0 items-center">
            <span className="sr-only">{t("home.languageHint")}</span>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <p className="text-xs uppercase tracking-[0.2em] text-pink-400">{t("home.feedEyebrow")}</p>
        <h1 className="mt-2 text-2xl font-semibold text-black sm:text-3xl">{t("modelsPage.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">{t("modelsPage.subtitle")}</p>

        {models.length === 0 ? (
          <div className="mt-12 rounded-[28px] border border-dashed border-black/15 bg-white/80 px-6 py-14 text-center text-gray-600">
            <p className="font-medium text-black">{t("modelsPage.empty")}</p>
            <Link href={AppRoutes.home} className="mt-4 inline-block text-sm font-medium text-pink-600 underline-offset-4 hover:underline">
              {t("common.backHome")}
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((model) => (
              <Link
                key={model.id}
                href={AppRoutes.legacyProfile(model.username)}
                className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:border-pink-200 hover:shadow-md"
              >
                <div
                  className="h-16 w-16 shrink-0 rounded-2xl bg-violet-100"
                  style={
                    model.avatarUrl
                      ? {
                          backgroundImage: `url(${model.avatarUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-black">{model.username}</p>
                  <p className="truncate text-xs text-gray-500">
                    {model.collaborationPreferences || model.bio || t("home.modelCardFallback")}
                  </p>
                  <p className="mt-1 text-xs font-medium text-pink-600">{t("common.publicProfile")} →</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
