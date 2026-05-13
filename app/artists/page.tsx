"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listPublicMakeupArtists } from "@/lib/auth-storage";
import { UserAccount } from "@/lib/auth-types";
import { AppRoutes } from "@/lib/app-routes";
import { FEATURED_DEMO_SLUGS } from "@/lib/featured-demo-profiles";
import { AppLogoLink } from "@/components/ui/app-logo-link";
import { AppButton } from "@/components/ui/app-button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useLanguage } from "@/components/providers/language-provider";
import { t as translateT, type Language } from "@/lib/i18n";
import {
  artistMatchesHcmDistrict,
  artistMatchesStyle,
  HCM_DISTRICT_IDS,
  type HcmDistrictId,
  STYLE_FILTER_IDS,
  type StyleFilterId,
} from "@/lib/artists-directory-filters";

const PAGE_SIZE = 12;

const DEMO_LOCATIONS: Record<Language, string[]> = {
  VN: [
    "Quận 1, TP.HCM",
    "Quận 3, TP.HCM",
    "Quận 7, TP.HCM",
    "Bình Thạnh, TP.HCM",
    "Tân Bình, TP.HCM",
    "Thủ Đức, TP.HCM",
    "Phú Nhuận, TP.HCM",
    "Gò Vấp, TP.HCM",
    "Quận 10, TP.HCM",
    "Bình Tân, TP.HCM",
    "Quận 5, TP.HCM",
    "Tân Phú, TP.HCM",
  ],
  EN: [
    "District 1, Ho Chi Minh City",
    "District 3, Ho Chi Minh City",
    "District 7, Ho Chi Minh City",
    "Binh Thanh, Ho Chi Minh City",
    "Tan Binh, Ho Chi Minh City",
    "Thu Duc City",
    "Phu Nhuan, Ho Chi Minh City",
    "Go Vap, Ho Chi Minh City",
    "District 10, Ho Chi Minh City",
    "Binh Tan, Ho Chi Minh City",
    "District 5, Ho Chi Minh City",
    "Tan Phu, Ho Chi Minh City",
  ],
};

const demoGradients = [
  "bg-gradient-to-br from-pink-200 via-rose-100 to-pink-50",
  "bg-gradient-to-br from-fuchsia-100 via-pink-50 to-rose-100",
  "bg-gradient-to-br from-rose-200 via-orange-50 to-pink-100",
] as const;

const DEMO_CYCLE = [1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3] as const;

function buildDemoArtists(language: Language): UserAccount[] {
  return DEMO_CYCLE.map((n, i) => {
    const tag = translateT(language, `home.featuredDemo${n}Tagline`);
    const specParts = tag.includes(" · ") ? tag.split(" · ") : [tag];
    return {
      id: `demo-${i}`,
      username: translateT(language, `home.featuredDemo${n}Name`),
      password: "demo",
      phoneNumber: "0000000000",
      role: "makeup_artist",
      rating: 4.9,
      reviews: 120,
      specialties: specParts,
      pricing: translateT(language, `home.featuredDemo${n}Price`),
      bio: tag,
      location: DEMO_LOCATIONS[language][i % DEMO_LOCATIONS[language].length],
      isPublicProfile: true,
    };
  });
}

type SortKey = "rating_desc" | "rating_asc" | "name_asc" | "name_desc";
type MinRating = "all" | "4" | "45";

function artistSearchBlob(a: UserAccount): string {
  const parts = [
    a.username,
    (a.specialties ?? []).join(" "),
    a.location ?? "",
    a.bio ?? "",
    a.pricing ?? "",
  ];
  return parts.join(" ").toLowerCase();
}

function formatPaginationSummary(raw: string, page: number, totalPages: number, count: number): string {
  return raw.replace("{page}", String(page)).replace("{total}", String(totalPages)).replace("{count}", String(count));
}

function demoSlotFromId(id: string): 1 | 2 | 3 {
  const i = Number.parseInt(id.slice("demo-".length), 10);
  const mod = Number.isFinite(i) ? i % 3 : 0;
  return (mod + 1) as 1 | 2 | 3;
}

export default function ArtistsIndexPage() {
  const { t, language } = useLanguage();
  const [artists, setArtists] = useState<UserAccount[]>([]);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rating_desc");
  const [minRating, setMinRating] = useState<MinRating>("all");
  const [styleFilter, setStyleFilter] = useState<StyleFilterId>("all");
  const [districtFilter, setDistrictFilter] = useState<HcmDistrictId>("all");
  const [page, setPage] = useState(0);

  const isDemoMode = artists.length === 0;
  const demoSynthArtists = useMemo(() => buildDemoArtists(language), [language]);
  const catalog = isDemoMode ? demoSynthArtists : artists;

  useEffect(() => {
    setArtists(listPublicMakeupArtists());
  }, []);

  useEffect(() => {
    setPage(0);
  }, [query, sortKey, minRating, styleFilter, districtFilter]);

  const filteredSorted = useMemo(() => {
    let list = [...catalog];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((a) => artistSearchBlob(a).includes(q));
    }
    if (minRating !== "all") {
      const floor = minRating === "4" ? 4 : 4.5;
      list = list.filter((a) => a.rating != null && a.rating >= floor);
    }
    list = list.filter((a) => artistMatchesStyle(a, styleFilter));
    list = list.filter((a) => artistMatchesHcmDistrict(a, districtFilter));
    list.sort((a, b) => {
      switch (sortKey) {
        case "name_asc":
          return a.username.localeCompare(b.username, undefined, { sensitivity: "base" });
        case "name_desc":
          return b.username.localeCompare(a.username, undefined, { sensitivity: "base" });
        case "rating_asc": {
          const ra = a.rating ?? -1;
          const rb = b.rating ?? -1;
          return ra - rb;
        }
        case "rating_desc":
        default: {
          const rd = b.rating ?? -1;
          const rc = a.rating ?? -1;
          return rd - rc;
        }
      }
    });
    return list;
  }, [catalog, query, sortKey, minRating, styleFilter, districtFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filteredSorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const selectClass =
    "w-full min-h-[44px] rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm text-black outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-200/60";

  const paginationSummaryKey = isDemoMode ? "artistsPage.paginationDemoSummary" : "artistsPage.paginationSummary";

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
        <h1 className="mt-2 text-2xl font-semibold text-black sm:text-3xl">{t("artistsPage.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">{t("artistsPage.subtitle")}</p>

        {isDemoMode ? (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50/95 to-orange-50/40 px-4 py-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <p className="min-w-0 flex-1 leading-relaxed">{t("artistsPage.demoModeHint")}</p>
            <Link
              href={AppRoutes.home}
              className="shrink-0 text-center text-sm font-semibold text-pink-700 underline-offset-4 hover:underline sm:text-right"
            >
              {t("common.backHome")}
            </Link>
          </div>
        ) : null}

        <div className="mt-8 rounded-3xl border border-black/5 bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500">{t("artistsPage.filtersEyebrow")}</p>
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end md:gap-5">
              <div className="md:col-span-5">
                <label htmlFor="artist-search" className="mb-1.5 block text-xs font-medium text-gray-600">
                  {t("artistsPage.searchLabel")}
                </label>
                <input
                  id="artist-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("artistsPage.searchPlaceholder")}
                  className="w-full min-h-[44px] rounded-2xl border border-black/10 bg-[#fdf8f6]/50 px-4 py-2.5 text-sm text-black outline-none transition placeholder:text-gray-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-200/60"
                  autoComplete="off"
                />
              </div>
              <div className="md:col-span-3">
                <label htmlFor="artist-sort" className="mb-1.5 block text-xs font-medium text-gray-600">
                  {t("artistsPage.sortLabel")}
                </label>
                <select
                  id="artist-sort"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className={selectClass}
                >
                  <option value="rating_desc">{t("artistsPage.sortRatingHigh")}</option>
                  <option value="rating_asc">{t("artistsPage.sortRatingLow")}</option>
                  <option value="name_asc">{t("artistsPage.sortNameAZ")}</option>
                  <option value="name_desc">{t("artistsPage.sortNameZA")}</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label htmlFor="artist-min-rating" className="mb-1.5 block text-xs font-medium text-gray-600">
                  {t("artistsPage.minRatingLabel")}
                </label>
                <select
                  id="artist-min-rating"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value as MinRating)}
                  className={selectClass}
                >
                  <option value="all">{t("artistsPage.minRatingAll")}</option>
                  <option value="4">{t("artistsPage.minRating4")}</option>
                  <option value="45">{t("artistsPage.minRating45")}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end md:gap-5">
              <div className="md:col-span-4">
                <label htmlFor="artist-style" className="mb-1.5 block text-xs font-medium text-gray-600">
                  {t("artistsPage.filterStyleLabel")}
                </label>
                <select
                  id="artist-style"
                  value={styleFilter}
                  onChange={(e) => setStyleFilter(e.target.value as StyleFilterId)}
                  className={selectClass}
                >
                  {STYLE_FILTER_IDS.map((id) => (
                    <option key={id} value={id}>
                      {t(`artistsPage.styleOptions.${id}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-5">
                <label htmlFor="artist-district" className="mb-1.5 block text-xs font-medium text-gray-600">
                  {t("artistsPage.filterDistrictLabel")}
                </label>
                <select
                  id="artist-district"
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value as HcmDistrictId)}
                  className={selectClass}
                >
                  {HCM_DISTRICT_IDS.map((id) => (
                    <option key={id} value={id}>
                      {t(`artistsPage.districtOptions.${id}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3 md:flex md:items-end md:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSortKey("rating_desc");
                    setMinRating("all");
                    setStyleFilter("all");
                    setDistrictFilter("all");
                  }}
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-black/5 md:mt-0 md:max-w-[11rem]"
                >
                  {t("artistsPage.clearFilters")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {filteredSorted.length === 0 ? (
          <div className="mt-10 rounded-[28px] border border-dashed border-black/15 bg-white/80 px-6 py-14 text-center text-gray-600">
            <p className="font-medium text-black">{t("artistsPage.noResults")}</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSortKey("rating_desc");
                setMinRating("all");
                setStyleFilter("all");
                setDistrictFilter("all");
              }}
              className="mt-4 text-sm font-medium text-pink-600 underline-offset-4 hover:underline"
            >
              {t("artistsPage.clearFilters")}
            </button>
          </div>
        ) : (
          <>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {pageItems.map((artist) => {
                const isDemoCard = artist.id.startsWith("demo-");
                const demoSlot = isDemoCard ? demoSlotFromId(artist.id) : null;
                return (
                  <article
                    key={artist.id}
                    className="flex flex-col overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    {isDemoCard && demoSlot ? (
                      <div
                        className={`relative aspect-[4/3] sm:aspect-[16/11] ${demoGradients[demoSlot - 1] ?? demoGradients[0]}`}
                      >
                        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-700 shadow-sm">
                          {t("home.featuredDemoBadge")}
                        </span>
                      </div>
                    ) : (
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
                    )}

                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-lg font-semibold sm:text-xl">{artist.username}</h2>
                        <span className="shrink-0 text-sm text-pink-500">★ {artist.rating?.toFixed(1) ?? "—"}</span>
                      </div>

                      <p className="mt-2 line-clamp-2 flex-1 text-sm text-gray-500">
                        {(artist.specialties ?? []).join(" · ") || t("home.artistServices")}
                      </p>
                      {artist.location ? (
                        <p className="mt-1.5 line-clamp-1 text-xs text-gray-400">{artist.location}</p>
                      ) : null}

                      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                        <p className="text-sm font-medium">{artist.pricing || t("home.fromPrice")}</p>
                        <div className="flex flex-wrap gap-2">
                          {isDemoCard && demoSlot ? (
                            <Link
                              href={`/spotlight/${FEATURED_DEMO_SLUGS[demoSlot - 1]}`}
                              className="rounded-full border border-black/15 px-4 py-2 text-center text-xs font-semibold transition hover:bg-black hover:text-white sm:text-sm"
                            >
                              {t("common.publicProfile")}
                            </Link>
                          ) : (
                            <>
                              <Link
                                href={AppRoutes.legacyProfile(artist.username)}
                                className="rounded-full border border-black/15 px-4 py-2 text-center text-xs font-semibold transition hover:bg-black hover:text-white sm:text-sm"
                              >
                                {t("common.publicProfile")}
                              </Link>
                              <Link
                                href={AppRoutes.bookArtist(artist.username)}
                                className="rounded-full bg-black px-4 py-2 text-center text-xs font-semibold text-white transition hover:opacity-90 sm:text-sm"
                              >
                                {t("home.bookNow")}
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-10 flex flex-col items-stretch gap-4 border-t border-black/5 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <AppButton
                type="button"
                variant="secondary"
                className="order-2 w-full sm:order-1 sm:w-auto"
                disabled={safePage <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                {t("artistsPage.paginationPrev")}
              </AppButton>
              <p className="order-1 text-center text-sm text-gray-600 sm:order-2 sm:flex-1">
                {formatPaginationSummary(t(paginationSummaryKey), safePage + 1, totalPages, filteredSorted.length)}
              </p>
              <AppButton
                type="button"
                variant="secondary"
                className="order-3 w-full sm:w-auto"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                {t("artistsPage.paginationNext")}
              </AppButton>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
