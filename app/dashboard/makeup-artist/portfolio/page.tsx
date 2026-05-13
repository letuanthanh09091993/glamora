"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PortfolioAlbumGrid, groupPortfolioByAlbum } from "@/components/portfolio/portfolio-album-grid";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RequireRole } from "@/components/auth/require-role";
import { useLanguage } from "@/components/providers/language-provider";
import { useAuth } from "@/components/providers/auth-provider";
import type { PortfolioItem } from "@/lib/auth-types";
import { AppRoutes } from "@/lib/app-routes";
import {
  FILTER_ALL,
  FILTER_UNCAT,
  getStablePortfolioItems,
  itemMatchesFilter,
  uniqueNonEmptyStrings,
} from "@/lib/portfolio-media";
import { normalizeServicePackages } from "@/lib/service-packages";

export default function ArtistPortfolioPreviewPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [albumFilter, setAlbumFilter] = useState(FILTER_ALL);
  const [styleFilter, setStyleFilter] = useState(FILTER_ALL);
  const [packageFilter, setPackageFilter] = useState(FILTER_ALL);

  useEffect(() => {
    if (!user) return;
    setItems(getStablePortfolioItems(user));
  }, [user]);

  const packagesNorm = useMemo(
    () => (user ? normalizeServicePackages(user.servicePackages ?? []) : []),
    [user?.servicePackages],
  );

  const packageNameOptions = useMemo(() => {
    const fromProfile = packagesNorm.map((p) => p.name.trim()).filter(Boolean);
    const fromItems = uniqueNonEmptyStrings(items.map((i) => i.packageName));
    return uniqueNonEmptyStrings([...fromProfile, ...fromItems]);
  }, [packagesNorm, items]);

  const styleOptions = useMemo(() => {
    const specs = user?.specialties ?? [];
    const fromItems = uniqueNonEmptyStrings(items.map((i) => i.styleTag));
    return uniqueNonEmptyStrings([...specs, ...fromItems]);
  }, [user?.specialties, items]);

  const albumOptions = useMemo(() => uniqueNonEmptyStrings(items.map((i) => i.album)), [items]);

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          itemMatchesFilter(i.album, albumFilter) &&
          itemMatchesFilter(i.styleTag, styleFilter) &&
          itemMatchesFilter(i.packageName, packageFilter),
      ),
    [items, albumFilter, styleFilter, packageFilter],
  );

  const albumGroups = useMemo(
    () => groupPortfolioByAlbum(filtered, t("dashboard.portfolioPreviewPage.albumUncategorized")),
    [filtered, t],
  );

  const filterRow = (
    <div className="grid gap-4 md:grid-cols-3">
      <label className="block text-sm font-semibold text-black">
        {t("dashboard.portfolioPreviewPage.filterAlbum")}
        <select
          value={albumFilter}
          onChange={(e) => setAlbumFilter(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fdf8f6] px-4 py-3 text-sm outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
        >
          <option value={FILTER_ALL}>{t("dashboard.portfolioPreviewPage.filterAll")}</option>
          <option value={FILTER_UNCAT}>{t("dashboard.portfolioPreviewPage.filterUnclassified")}</option>
          {albumOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-black">
        {t("dashboard.portfolioPreviewPage.filterStyle")}
        <select
          value={styleFilter}
          onChange={(e) => setStyleFilter(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fdf8f6] px-4 py-3 text-sm outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
        >
          <option value={FILTER_ALL}>{t("dashboard.portfolioPreviewPage.filterAll")}</option>
          <option value={FILTER_UNCAT}>{t("dashboard.portfolioPreviewPage.filterUnclassified")}</option>
          {styleOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-black">
        {t("dashboard.portfolioPreviewPage.filterPackage")}
        <select
          value={packageFilter}
          onChange={(e) => setPackageFilter(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fdf8f6] px-4 py-3 text-sm outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
        >
          <option value={FILTER_ALL}>{t("dashboard.portfolioPreviewPage.filterAll")}</option>
          <option value={FILTER_UNCAT}>{t("dashboard.portfolioPreviewPage.filterUnclassified")}</option>
          {packageNameOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  return (
    <RequireRole role="makeup_artist">
      <DashboardShell title={t("dashboard.portfolioPreviewPage.title")}>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          {user ? (
            <Link
              href={AppRoutes.legacyProfile(user.username)}
              className="inline-flex w-fit rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-pink-700 ring-1 ring-pink-100 transition hover:bg-pink-100 hover:ring-pink-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2"
              aria-label={t("dashboard.portfolioPreviewPage.previewBadgeAria")}
            >
              {t("dashboard.portfolioPreviewPage.previewBadge")}
            </Link>
          ) : (
            <p className="inline-flex w-fit rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-pink-700 ring-1 ring-pink-100">
              {t("dashboard.portfolioPreviewPage.previewBadge")}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Link
              href={AppRoutes.dashboardMakeupArtistPost}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-black/15 bg-white px-5 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
            >
              {t("dashboard.portfolioPreviewPage.editMedia")}
            </Link>
            {user ? (
              <Link
                href={AppRoutes.legacyProfile(user.username)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-pink-600"
              >
                {t("dashboard.profileCard.viewProfile")}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-black">{t("dashboard.portfolioPreviewPage.albumViewTitle")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            {t("dashboard.portfolioPreviewPage.albumViewSubtitle")}
          </p>

          <div className="mt-6">{filterRow}</div>

          <div className="mt-8">
            {items.length === 0 ? (
              <p className="text-sm text-gray-500">{t("profile.portfolioEmpty")}</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-gray-500">{t("dashboard.portfolioPreviewPage.emptyFiltered")}</p>
            ) : (
              <PortfolioAlbumGrid groups={albumGroups} />
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-2 border-t border-black/5 pt-8">
            <Link
              href={AppRoutes.dashboardMakeupArtist}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-black/15 bg-white px-5 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
            >
              {t("account.backDashboard")}
            </Link>
          </div>
        </div>
      </DashboardShell>
    </RequireRole>
  );
}
