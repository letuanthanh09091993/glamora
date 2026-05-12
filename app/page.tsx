"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { listPublicMakeupArtists } from "@/lib/auth-storage";
import { UserAccount } from "@/lib/auth-types";
import { useAuth } from "@/components/providers/auth-provider";
import { AppButton } from "@/components/ui/app-button";

function artistMatchesQuery(artist: UserAccount, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const parts = [
    artist.username,
    artist.location,
    artist.bio,
    artist.pricing,
    ...(artist.specialties ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return parts.includes(q);
}

export default function HomePage() {
  const { t } = useLanguage();
  const { user, logout, isReady } = useAuth();
  const [artists, setArtists] = useState<UserAccount[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setArtists(listPublicMakeupArtists());
  }, []);

  const filtered = useMemo(
    () => artists.filter((a) => artistMatchesQuery(a, search)),
    [artists, search],
  );

  const featured = filtered.slice(0, 6);
  const rest = filtered.slice(6);

  return (
    <main className="min-h-screen bg-[#fdf8f6] text-[#2b2b2b]">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-[#fdf8f6]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-semibold tracking-wide transition hover:opacity-80">
            {t("common.appName")}
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <div className="flex flex-col items-end gap-1">
              <p className="hidden text-[10px] font-medium uppercase tracking-wider text-gray-400 sm:block">
                {t("home.languageHint")}
              </p>
              <span className="sr-only">{t("home.languageHint")}</span>
              <LanguageSwitcher />
            </div>

            {isReady && user ? (
              <>
                <p className="max-w-[10rem] truncate text-right text-xs text-gray-500 sm:max-w-none">
                  <span className="font-semibold text-black">{t("home.welcomeBack")}</span>, {user.username}
                </p>
                <Link
                  href="/dashboard"
                  className="rounded-full px-4 py-2 text-sm text-gray-700 transition hover:bg-black/5"
                >
                  {t("home.navDashboard")}
                </Link>
                <Link
                  href="/account"
                  className="rounded-full px-4 py-2 text-sm text-gray-700 transition hover:bg-black/5"
                >
                  {t("common.account")}
                </Link>
                <Link
                  href={`/profile/${user.username}`}
                  className="hidden rounded-full px-4 py-2 text-sm text-gray-700 transition hover:bg-black/5 md:inline-flex"
                >
                  {t("common.publicProfile")}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-black hover:text-white"
                >
                  {t("common.logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="rounded-full px-4 py-2 text-sm text-gray-600 transition hover:bg-black/5"
                >
                  {t("common.login")}
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-full border border-black/20 px-4 py-2 text-sm transition hover:bg-black hover:text-white"
                >
                  {t("common.createAccount")}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {isReady && user ? (
        <div className="border-b border-pink-100 bg-gradient-to-r from-pink-50/90 to-white px-4 py-2.5 sm:px-6">
          <p className="mx-auto max-w-7xl text-center text-xs text-gray-700 sm:text-sm">{t("home.signedInHint")}</p>
        </div>
      ) : null}

      {/* HERO */}
      <section className="px-4 py-12 text-center sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-pink-400 sm:text-sm">
            {t("home.marketplace")}
          </p>

          <h1 className="text-3xl font-bold leading-tight sm:text-5xl md:text-7xl">
            {t("home.titleLine1")}
            <br />
            {t("home.titleLine2")}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm text-gray-600 sm:text-base md:text-lg">
            {t("home.description")}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
            <a
              href="#explore"
              className="rounded-full bg-black px-8 py-3.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:opacity-90 sm:py-4 sm:text-base"
            >
              {t("home.heroPrimary")}
            </a>

            <Link
              href="/auth/signup"
              className="rounded-full border border-black px-8 py-3.5 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 hover:bg-black hover:text-white sm:py-4 sm:text-base"
            >
              {t("home.heroSecondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* SEARCH */}
      <section className="px-4 pb-10 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <label className="block">
            <span className="mb-2 block text-center text-sm font-medium text-gray-700 sm:text-left">
              {t("home.searchLabel")}
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("home.searchPlaceholder")}
              className="w-full rounded-full border border-black/10 bg-white px-5 py-3.5 text-sm shadow-sm outline-none ring-pink-100 transition placeholder:text-gray-400 focus:border-pink-300 focus:ring-4"
              autoComplete="off"
            />
          </label>
        </div>
      </section>

      {/* QUICK BOOKING */}
      <section className="px-4 pb-12 sm:px-6">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-black/5 bg-gradient-to-br from-white to-pink-50/50 p-8 shadow-sm sm:p-10 md:flex md:items-center md:justify-between md:gap-10">
          <div className="text-center md:text-left">
            <p className="text-xs uppercase tracking-[0.25em] text-pink-500">{t("home.feedEyebrow")}</p>
            <h2 className="mt-2 text-2xl font-bold text-black sm:text-3xl">{t("home.quickBookTitle")}</h2>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">{t("home.quickBookBody")}</p>
          </div>
          <div className="mt-6 flex justify-center md:mt-0 md:shrink-0">
            <a href="#explore">
              <AppButton>{t("home.bookNow")}</AppButton>
            </a>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="px-4 pb-12 sm:px-6" id="explore">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-pink-400">{t("home.feedEyebrow")}</p>
              <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{t("home.featuredArtists")}</h2>
              <p className="mt-1 max-w-xl text-sm text-gray-600">{t("home.exploreSubtitle")}</p>
            </div>
            <a
              href="#explore-more"
              className="self-start text-sm font-medium text-pink-600 underline-offset-4 hover:underline sm:self-auto"
            >
              {t("home.viewAll")}
            </a>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((artist) => (
              <article
                key={artist.id}
                className="flex flex-col overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div
                  className="aspect-[4/3] bg-pink-100 sm:aspect-[16/11]"
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

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold sm:text-xl">{artist.username}</h3>
                    <span className="shrink-0 text-sm text-pink-500">★ {artist.rating?.toFixed(1) ?? "—"}</span>
                  </div>

                  <p className="mt-2 line-clamp-2 flex-1 text-sm text-gray-500">
                    {(artist.specialties ?? []).join(" · ") || t("home.artistServices")}
                  </p>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <p className="text-sm font-medium">{artist.pricing || t("home.fromPrice")}</p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/profile/${artist.username}`}
                        className="rounded-full border border-black/15 px-4 py-2 text-center text-xs font-semibold transition hover:bg-black hover:text-white sm:text-sm"
                      >
                        {t("common.publicProfile")}
                      </Link>
                      <Link
                        href={`/book/${artist.username}`}
                        className="rounded-full bg-black px-4 py-2 text-center text-xs font-semibold text-white transition hover:opacity-90 sm:text-sm"
                      >
                        {t("home.bookNow")}
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {featured.length === 0 ? (
            <div className="rounded-[30px] border border-dashed border-black/15 bg-white/80 p-10 text-center text-gray-600">
              <p className="text-lg font-semibold text-black">{t("home.featuredArtists")}</p>
              <p className="mt-2 text-sm">
                {search.trim() ? t("home.exploreSubtitle") : t("home.ctaDescription")}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/auth/signup"
                  className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
                >
                  {t("common.createAccount")}
                </Link>
                <Link
                  href="/auth/login"
                  className="rounded-full border border-black/20 px-6 py-3 text-sm font-semibold hover:bg-black hover:text-white"
                >
                  {t("common.login")}
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* EXPLORE MORE */}
      {rest.length > 0 ? (
        <section className="px-4 pb-20 sm:px-6" id="explore-more">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-6 text-2xl font-semibold sm:text-3xl">{t("home.exploreTitle")}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((artist) => (
                <Link
                  key={artist.id}
                  href={`/profile/${artist.username}`}
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
          </div>
        </section>
      ) : null}

      {/* CTA */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-[32px] bg-[#f8e8e4] p-8 text-center sm:rounded-[40px] sm:p-12">
          <h2 className="text-2xl font-bold sm:text-4xl">{t("home.ctaTitle")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 sm:mt-4 sm:text-base">{t("home.ctaDescription")}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#explore">
              <AppButton variant="secondary">{t("home.heroPrimary")}</AppButton>
            </a>
            <Link href="/auth/signup">
              <AppButton>{t("home.startBooking")}</AppButton>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
