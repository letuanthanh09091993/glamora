"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listPublicMakeupArtists } from "@/lib/auth-storage";
import { UserAccount } from "@/lib/auth-types";
import { AppRoutes } from "@/lib/app-routes";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useLanguage } from "@/components/providers/language-provider";

export default function ArtistsIndexPage() {
  const { t } = useLanguage();
  const [artists, setArtists] = useState<UserAccount[]>([]);

  useEffect(() => {
    setArtists(listPublicMakeupArtists());
  }, []);

  return (
    <main className="min-h-screen bg-[#fdf8f6] text-[#2b2b2b]">
      <header className="border-b border-black/5 bg-[#fdf8f6]/95 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Link href={AppRoutes.home} className="shrink-0 text-xl font-semibold tracking-wide transition hover:opacity-80">
            {t("common.appName")}
          </Link>
          <div className="flex shrink-0 items-center">
            <span className="sr-only">{t("home.languageHint")}</span>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <p className="text-xs uppercase tracking-[0.2em] text-pink-400">{t("home.feedEyebrow")}</p>
        <h1 className="mt-2 text-2xl font-semibold text-black sm:text-3xl">{t("artistsPage.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">{t("artistsPage.subtitle")}</p>

        {artists.length === 0 ? (
          <div className="mt-12 rounded-[28px] border border-dashed border-black/15 bg-white/80 px-6 py-14 text-center text-gray-600">
            <p className="font-medium text-black">{t("artistsPage.empty")}</p>
            <Link href={AppRoutes.home} className="mt-4 inline-block text-sm font-medium text-pink-600 underline-offset-4 hover:underline">
              {t("common.backHome")}
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={AppRoutes.legacyProfile(artist.username)}
                className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:border-pink-200 hover:shadow-md"
              >
                <div
                  className="h-16 w-16 shrink-0 rounded-2xl bg-pink-100"
                  style={
                    artist.avatarUrl
                      ? {
                          backgroundImage: `url(${artist.avatarUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-black">{artist.username}</p>
                  <p className="truncate text-xs text-gray-500">
                    {(artist.specialties ?? []).join(" · ") || t("home.artistServices")}
                  </p>
                  <p className="mt-1 text-xs font-medium text-pink-600">{t("home.bookNow")} →</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
