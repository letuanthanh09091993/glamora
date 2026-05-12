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
import {
  distanceKmToAccount,
  formatApproxDistanceKm,
  sortByDistanceKm,
} from "@/lib/geo-distance";
import type { Language } from "@/lib/i18n";
import { profileMatchesNearbyHints } from "@/lib/nearby-match";

function publicProfileMatchesQuery(account: UserAccount, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const parts = [
    account.username,
    account.location,
    account.bio,
    account.pricing,
    account.measurements,
    account.collaborationPreferences,
    ...(account.specialties ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return parts.includes(q);
}

function ApproxDistanceBadge({ km, language }: { km: number | null; language: Language }) {
  if (km == null || !Number.isFinite(km)) return null;
  return (
    <span className="whitespace-nowrap text-xs font-medium tabular-nums text-gray-500">
      {formatApproxDistanceKm(km, language)}
    </span>
  );
}

export default function HomePage() {
  const { t, language } = useLanguage();
  const { user, logout, isReady } = useAuth();
  const [artists, setArtists] = useState<UserAccount[]>([]);
  const [models, setModels] = useState<UserAccount[]>([]);
  const [search, setSearch] = useState("");

  type NearbyFilterState =
    | { status: "off" }
    | { status: "loading" }
    | { status: "ready"; hints: string[]; label: string; viewerLat: number; viewerLon: number }
    | { status: "error"; messageKey: string };

  const [nearbyFilter, setNearbyFilter] = useState<NearbyFilterState>({ status: "off" });

  useEffect(() => {
    setArtists(listPublicMakeupArtists());
    setModels(listPublicModels());
  }, []);

  const nearbyHintsForFilter =
    nearbyFilter.status === "ready" && nearbyFilter.hints.length > 0 ? nearbyFilter.hints : null;

  const viewerLat = nearbyFilter.status === "ready" ? nearbyFilter.viewerLat : null;
  const viewerLon = nearbyFilter.status === "ready" ? nearbyFilter.viewerLon : null;

  const filtered = useMemo(() => {
    let list = artists.filter((a) => publicProfileMatchesQuery(a, search));
    if (nearbyHintsForFilter) {
      list = list.filter((a) => profileMatchesNearbyHints(a.location, nearbyHintsForFilter));
    }
    if (viewerLat != null && viewerLon != null) {
      list = sortByDistanceKm(list, { lat: viewerLat, lon: viewerLon });
    }
    return list;
  }, [artists, search, nearbyHintsForFilter, viewerLat, viewerLon]);

  const filteredModels = useMemo(() => {
    let list = models.filter((m) => publicProfileMatchesQuery(m, search));
    if (nearbyHintsForFilter) {
      list = list.filter((m) => profileMatchesNearbyHints(m.location, nearbyHintsForFilter));
    }
    if (viewerLat != null && viewerLon != null) {
      list = sortByDistanceKm(list, { lat: viewerLat, lon: viewerLon });
    }
    return list;
  }, [models, search, nearbyHintsForFilter, viewerLat, viewerLon]);

  async function requestNearbyFilter() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setNearbyFilter({ status: "error", messageKey: "home.nearbyUnavailable" });
      return;
    }
    setNearbyFilter({ status: "loading" });
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 120_000,
        });
      });
      const res = await fetch(`/api/geocode/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
      const data = (await res.json()) as { hints?: string[]; label?: string };
      if (!res.ok || !Array.isArray(data.hints)) {
        setNearbyFilter({ status: "error", messageKey: "home.nearbyError" });
        return;
      }
      const hints = data.hints;
      const label = (typeof data.label === "string" && data.label.trim()) ? data.label.trim() : hints[0] || "";
      if (!hints.length) {
        setNearbyFilter({ status: "error", messageKey: "home.nearbyError" });
        return;
      }
      setNearbyFilter({
        status: "ready",
        hints,
        label,
        viewerLat: pos.coords.latitude,
        viewerLon: pos.coords.longitude,
      });
    } catch (err: unknown) {
      const geo = err as GeolocationPositionError;
      if (geo?.code === 1) {
        setNearbyFilter({ status: "error", messageKey: "home.nearbyDenied" });
        return;
      }
      setNearbyFilter({ status: "error", messageKey: "home.nearbyError" });
    }
  }

  function clearNearbyFilter() {
    setNearbyFilter({ status: "off" });
  }

  const rest = filtered.slice(3);

  const featuredShowcase = useMemo(() => {
    const top = filtered.slice(0, 3);
    if (top.length > 0) return { mode: "real" as const, artists: top };
    if (search.trim()) return { mode: "none" as const };
    if (nearbyHintsForFilter) return { mode: "nearby-empty" as const };
    return { mode: "demo" as const };
  }, [filtered, search, nearbyHintsForFilter]);

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

  const modelsRest = filteredModels.slice(3);

  const modelsShowcase = useMemo(() => {
    const top = filteredModels.slice(0, 3);
    if (top.length > 0) return { mode: "real" as const, models: top };
    if (search.trim()) return { mode: "none" as const };
    if (nearbyHintsForFilter) return { mode: "nearby-empty" as const };
    return { mode: "demo" as const };
  }, [filteredModels, search, nearbyHintsForFilter]);

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
          <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={requestNearbyFilter}
              disabled={nearbyFilter.status === "loading"}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {nearbyFilter.status === "loading" ? t("home.nearbyLoading") : t("home.nearbyButton")}
            </button>
            {nearbyFilter.status === "ready" ? (
              <span className="inline-flex items-center gap-2 self-center rounded-full bg-pink-50 px-4 py-2 text-xs font-medium text-gray-800 ring-1 ring-pink-100 sm:self-auto">
                <span className="text-pink-700">
                  {t("home.nearbyActivePrefix")}: {nearbyFilter.label}
                </span>
                <button
                  type="button"
                  onClick={clearNearbyFilter}
                  className="rounded-full px-2 py-0.5 text-lg leading-none text-gray-500 hover:bg-black/5 hover:text-black"
                  aria-label={t("home.nearbyClearAria")}
                >
                  ×
                </button>
              </span>
            ) : null}
          </div>
          {nearbyFilter.status === "error" ? (
            <p className="mt-3 text-center text-sm text-red-600 sm:text-left">{t(nearbyFilter.messageKey)}</p>
          ) : null}
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
              href="#explore-models"
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
            {filtered.length > 3 ? (
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
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <ApproxDistanceBadge
                          km={
                            nearbyFilter.status === "ready"
                              ? distanceKmToAccount(
                                  {
                                    lat: nearbyFilter.viewerLat,
                                    lon: nearbyFilter.viewerLon,
                                  },
                                  artist,
                                )
                              : null
                          }
                          language={language}
                        />
                        <span className="text-sm text-pink-500">★ {artist.rating?.toFixed(1) ?? "—"}</span>
                      </div>
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
          ) : featuredShowcase.mode === "demo" ? (
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
          ) : featuredShowcase.mode === "nearby-empty" ? (
            <div className="rounded-[28px] border border-dashed border-black/15 bg-white/80 px-6 py-14 text-center text-gray-600">
              <p className="text-base font-medium text-black">{t("home.nearbyEmptyArtists")}</p>
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-black/15 bg-white/80 px-6 py-14 text-center text-gray-600">
              <p className="text-base font-medium text-black">{t("home.featuredNoSearchResults")}</p>
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
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-black">{artist.username}</p>
                      <ApproxDistanceBadge
                        km={
                          nearbyFilter.status === "ready"
                            ? distanceKmToAccount(
                                {
                                  lat: nearbyFilter.viewerLat,
                                  lon: nearbyFilter.viewerLon,
                                },
                                artist,
                              )
                            : null
                        }
                        language={language}
                      />
                    </div>
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
            {filteredModels.length > 3 ? (
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
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <ApproxDistanceBadge
                          km={
                            nearbyFilter.status === "ready"
                              ? distanceKmToAccount(
                                  {
                                    lat: nearbyFilter.viewerLat,
                                    lon: nearbyFilter.viewerLon,
                                  },
                                  model,
                                )
                              : null
                          }
                          language={language}
                        />
                        {model.rating != null ? (
                          <span className="text-sm text-pink-500">★ {model.rating.toFixed(1)}</span>
                        ) : null}
                      </div>
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
          ) : modelsShowcase.mode === "demo" ? (
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
          ) : modelsShowcase.mode === "nearby-empty" ? (
            <div className="rounded-[28px] border border-dashed border-black/15 bg-white/80 px-6 py-14 text-center text-gray-600">
              <p className="text-base font-medium text-black">{t("home.nearbyEmptyModels")}</p>
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-black/15 bg-white/80 px-6 py-14 text-center text-gray-600">
              <p className="text-base font-medium text-black">{t("home.modelsNoMatch")}</p>
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
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-black">{model.username}</p>
                      <ApproxDistanceBadge
                        km={
                          nearbyFilter.status === "ready"
                            ? distanceKmToAccount(
                                {
                                  lat: nearbyFilter.viewerLat,
                                  lon: nearbyFilter.viewerLon,
                                },
                                model,
                              )
                            : null
                        }
                        language={language}
                      />
                    </div>
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
