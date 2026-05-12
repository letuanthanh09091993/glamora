"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { listPublicMakeupArtists, listPublicModels } from "@/lib/auth-storage";
import { UserAccount } from "@/lib/auth-types";
import { useAuth } from "@/components/providers/auth-provider";
import { BeautyMagazineSection } from "@/components/home/beauty-magazine-section";
import { AppRoutes } from "@/lib/app-routes";
import { FEATURED_DEMO_SLUGS } from "@/lib/featured-demo-profiles";
import { MODEL_DEMO_SLUGS } from "@/lib/model-demo-profiles";

export default function HomePage() {
  const { t } = useLanguage();
  const { user, logout, isReady } = useAuth();
  const [artists, setArtists] = useState<UserAccount[]>([]);
  const [models, setModels] = useState<UserAccount[]>([]);

  useEffect(() => {
    setArtists(listPublicMakeupArtists());
    setModels(listPublicModels());
  }, []);

  const rest = artists.slice(3);

  const featuredShowcase = useMemo(() => {
    const top = artists.slice(0, 3);
    if (top.length > 0) return { mode: "real" as const, artists: top };
    return { mode: "demo" as const };
  }, [artists]);

  const demoGradients = [
    "bg-gradient-to-br from-pink-200 via-rose-100 to-pink-50",
    "bg-gradient-to-br from-fuchsia-100 via-pink-50 to-rose-100",
    "bg-gradient-to-br from-rose-200 via-orange-50 to-pink-100",
  ];

  const modelDemoGradients = [
    "bg-gradient-to-br from-violet-200 via-purple-50 to-pink-50",
    "bg-gradient-to-br from-sky-100 via-violet-50 to-pink-50",
    "bg-gradient-to-br from-fuchsia-100 via-rose-50 to-violet-50",
  ];

  const modelsRest = models.slice(3);

  const modelsShowcase = useMemo(() => {
    const top = models.slice(0, 3);
    if (top.length > 0) return { mode: "real" as const, models: top };
    return { mode: "demo" as const };
  }, [models]);

  return (
    <main className="min-h-screen bg-[#fdf8f6] text-[#2b2b2b]">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-[#fdf8f6]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            href="/"
            className="shrink-0 text-xl font-semibold tracking-wide transition hover:opacity-80"
          >
            {t("common.appName")}
          </Link>

          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-2 gap-y-2 sm:flex-initial sm:gap-x-3">
            {isReady && user ? (
              <>
                <p className="w-full max-w-full truncate text-right text-xs text-gray-500 sm:w-auto sm:max-w-[11rem] md:max-w-none">
                  <span className="font-semibold text-black">{t("home.welcomeBack")}</span>, {user.username}
                </p>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Link
                    href="/dashboard"
                    className="shrink-0 rounded-full px-3 py-2 text-sm text-gray-700 transition hover:bg-black/5 sm:px-4"
                  >
                    {t("home.navDashboard")}
                  </Link>
                  <Link
                    href="/account"
                    className="shrink-0 rounded-full px-3 py-2 text-sm text-gray-700 transition hover:bg-black/5 sm:px-4"
                  >
                    {t("common.account")}
                  </Link>
                  <Link
                    href={`/profile/${user.username}`}
                    className="hidden shrink-0 rounded-full px-3 py-2 text-sm text-gray-700 transition hover:bg-black/5 md:inline-flex sm:px-4"
                  >
                    {t("common.publicProfile")}
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="shrink-0 rounded-full border border-black/15 px-3 py-2 text-sm font-medium text-gray-800 transition hover:bg-black hover:text-white sm:px-4"
                  >
                    {t("common.logout")}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Link
                  href="/auth/login"
                  className="shrink-0 rounded-full px-3 py-2 text-sm text-gray-600 transition hover:bg-black/5 sm:px-4"
                >
                  {t("common.login")}
                </Link>
                <Link
                  href="/auth/signup"
                  className="shrink-0 rounded-full border border-black/20 px-3 py-2 text-sm transition hover:bg-black hover:text-white sm:px-4"
                >
                  {t("common.createAccount")}
                </Link>
              </div>
            )}

            <div className="flex shrink-0 items-center border-l border-black/10 pl-2 sm:pl-3">
              <span className="sr-only">{t("home.languageHint")}</span>
              <LanguageSwitcher />
            </div>
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
            {t("home.titleLine2").trim() ? (
              <>
                <br />
                {t("home.titleLine2")}
              </>
            ) : null}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm text-gray-600 sm:text-base md:text-lg">
            {t("home.description")}
          </p>
        </div>
      </section>

      {/* DISCOVERY */}
      <section className="px-4 pb-12 sm:px-6">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-black/5 bg-gradient-to-br from-white to-pink-50/50 p-8 text-center shadow-sm sm:p-10">
          <p className="text-xs uppercase tracking-[0.25em] text-pink-500">{t("home.feedEyebrow")}</p>
          <h2 className="mt-2 text-2xl font-bold text-black sm:text-3xl">{t("home.discoveryTitle")}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">{t("home.discoveryBody")}</p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:mx-auto sm:max-w-xl sm:flex-row sm:gap-4">
            <Link
              href={AppRoutes.artistsIndex}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-black/20 bg-white px-6 py-3 text-sm font-semibold text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-black hover:text-white"
            >
              {t("home.discoveryArtistsCta")}
            </Link>
            <Link
              href={AppRoutes.modelsIndex}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90"
            >
              {t("home.discoveryModelsCta")}
            </Link>
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
              <Link
                href={AppRoutes.artistsIndex}
                className="mt-1 inline-block max-w-xl text-sm font-medium text-pink-600 underline-offset-4 hover:underline"
              >
                {t("home.exploreSubtitle")}
              </Link>
            </div>
            {artists.length > 3 ? (
              <a
                href="#explore-more"
                className="self-start text-sm font-medium text-pink-600 underline-offset-4 hover:underline sm:self-auto"
              >
                {t("home.viewAll")}
              </a>
            ) : (
              <span className="hidden sm:block sm:w-[6rem]" aria-hidden />
            )}
          </div>

          {featuredShowcase.mode === "real" ? (
            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
              {featuredShowcase.artists.map((artist) => (
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
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
              {[1, 2, 3].map((n, i) => (
                <article
                  key={`featured-demo-${n}`}
                  className="flex flex-col overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div className={`relative aspect-[4/3] sm:aspect-[16/11] ${demoGradients[i] ?? demoGradients[0]}`}>
                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-700 shadow-sm">
                      {t("home.featuredDemoBadge")}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-semibold sm:text-xl">{t(`home.featuredDemo${n}Name`)}</h3>
                      <span className="shrink-0 text-sm text-pink-500">★ 4.9</span>
                    </div>
                    <p className="mt-2 line-clamp-2 flex-1 text-sm text-gray-500">{t(`home.featuredDemo${n}Tagline`)}</p>
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                      <p className="text-sm font-medium">{t(`home.featuredDemo${n}Price`)}</p>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/spotlight/${FEATURED_DEMO_SLUGS[n - 1]}`}
                          className="rounded-full border border-black/15 px-4 py-2 text-center text-xs font-semibold transition hover:bg-black hover:text-white sm:text-sm"
                        >
                          {t("home.featuredDemoLearnMore")}
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
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

      {/* MODELS — featured (3) */}
      <section className="px-4 pb-12 sm:px-6" id="explore-models">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-pink-400">{t("home.feedEyebrow")}</p>
              <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{t("home.modelsTitle")}</h2>
              <Link
                href={AppRoutes.modelsIndex}
                className="mt-1 inline-block max-w-xl text-sm font-medium text-pink-600 underline-offset-4 hover:underline"
              >
                {t("home.modelsSubtitle")}
              </Link>
            </div>
            {models.length > 3 ? (
              <a
                href="#explore-models-more"
                className="self-start text-sm font-medium text-pink-600 underline-offset-4 hover:underline sm:self-auto"
              >
                {t("home.viewAll")}
              </a>
            ) : (
              <span className="hidden sm:block sm:w-[6rem]" aria-hidden />
            )}
          </div>

          {modelsShowcase.mode === "real" ? (
            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
              {modelsShowcase.models.map((model) => (
                <article
                  key={model.id}
                  className="flex flex-col overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div
                    className="aspect-[4/3] bg-violet-100 sm:aspect-[16/11]"
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
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-semibold sm:text-xl">{model.username}</h3>
                      {model.rating != null ? (
                        <span className="shrink-0 text-sm text-pink-500">★ {model.rating.toFixed(1)}</span>
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-2 flex-1 text-sm text-gray-500">
                      {model.collaborationPreferences || model.bio || t("home.modelCardFallback")}
                    </p>
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-gray-700">
                        {model.measurements || model.location || "—"}
                      </p>
                      <Link
                        href={`/profile/${model.username}`}
                        className="rounded-full border border-black/15 px-4 py-2 text-center text-xs font-semibold transition hover:bg-black hover:text-white sm:text-sm"
                      >
                        {t("common.publicProfile")}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
              {[1, 2, 3].map((n, i) => (
                <article
                  key={`model-demo-${n}`}
                  className="flex flex-col overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div className={`relative aspect-[4/3] sm:aspect-[16/11] ${modelDemoGradients[i] ?? modelDemoGradients[0]}`}>
                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-700 shadow-sm">
                      {t("home.modelDemoBadge")}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-semibold sm:text-xl">{t(`home.modelDemo${n}Name`)}</h3>
                      <span className="shrink-0 text-sm text-violet-600">★ 4.9</span>
                    </div>
                    <p className="mt-2 line-clamp-2 flex-1 text-sm text-gray-500">{t(`home.modelDemo${n}Tagline`)}</p>
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-gray-700">{t(`home.modelDemo${n}Rate`)}</p>
                      <Link
                        href={`/models/${MODEL_DEMO_SLUGS[n - 1]}`}
                        className="rounded-full border border-black/15 px-4 py-2 text-center text-xs font-semibold transition hover:bg-black hover:text-white sm:text-sm"
                      >
                        {t("home.featuredDemoLearnMore")}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {modelsRest.length > 0 ? (
        <section className="px-4 pb-20 sm:px-6" id="explore-models-more">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-6 text-2xl font-semibold sm:text-3xl">{t("home.modelsExploreMoreTitle")}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modelsRest.map((model) => (
                <Link
                  key={model.id}
                  href={`/profile/${model.username}`}
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
          </div>
        </section>
      ) : null}

      <BeautyMagazineSection />
    </main>
  );
}
