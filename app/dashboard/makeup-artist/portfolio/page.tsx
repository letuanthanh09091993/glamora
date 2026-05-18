"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PortfolioAlbumGrid, groupPortfolioByAlbum } from "@/components/portfolio/portfolio-album-grid";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { AppButton } from "@/components/ui/app-button";
import { Notice } from "@/components/ui/notice";
import { UploadFeedbackToast } from "@/components/upload/upload-feedback-toast";
import { AppRoutes } from "@/lib/app-routes";
import {
  FILTER_ALL,
  FILTER_UNCAT,
  itemMatchesFilter,
  uniqueNonEmptyStrings,
} from "@/lib/portfolio-media";
import { useArtistPortfolioItems } from "@/lib/portfolio/use-artist-portfolio-items";
import { normalizeServicePackages } from "@/lib/service-packages";

export default function ArtistPortfolioPreviewPage() {
  const { t } = useLanguage();
  const { user, updateProfile } = useAuth();
  const { items, setItems, reloadFromDb } = useArtistPortfolioItems({ userId: user?.id });
  const [albumFilter, setAlbumFilter] = useState(FILTER_ALL);
  const [styleFilter, setStyleFilter] = useState(FILTER_ALL);
  const [packageFilter, setPackageFilter] = useState(FILTER_ALL);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => items.some((i) => i.id === id)));
  }, [items]);

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

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds([]);
  }

  function toggleSelectMode() {
    if (selectMode) exitSelectMode();
    else {
      setSelectMode(true);
      setNotice(null);
    }
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleDeleteSelected() {
    if (!user || selectedIds.length === 0) return;
    const remove = new Set(selectedIds);
    const nextItems = items.filter((i) => !remove.has(i.id));
    const msg = t("dashboard.portfolioPreviewPage.deleteSelectedConfirm").replace(
      "{count}",
      String(selectedIds.length),
    );
    if (typeof window !== "undefined" && !window.confirm(msg)) return;

    setDeleting(true);
    setNotice(null);
    setToast(null);
    const count = selectedIds.length;
    const images = nextItems.filter((i) => i.kind === "image").map((i) => i.url);
    const videos = nextItems.filter((i) => i.kind === "video").map((i) => i.url);
    try {
      const result = await updateProfile({
        portfolioItems: nextItems,
        portfolioImageUrls: images,
        portfolioVideoUrls: videos,
      });
      if (result.ok) {
        await reloadFromDb();
        exitSelectMode();
        setToast({
          type: "success",
          message: t("dashboard.portfolioPreviewPage.deleteSuccess").replace("{count}", String(count)),
        });
        setNotice(null);
      } else {
        setNotice({ type: "error", message: t(result.messageKey) });
        setToast({ type: "error", message: t("dashboard.portfolioPreviewPage.deleteFailed") });
      }
    } catch {
      setToast({ type: "error", message: t("dashboard.portfolioPreviewPage.deleteFailed") });
    } finally {
      setDeleting(false);
    }
  }

  const filterRow = (
    <div className="grid gap-4 md:grid-cols-3">
      <label className="block text-sm font-semibold text-black">
        {t("dashboard.portfolioPreviewPage.filterAlbum")}
        <select
          value={albumFilter}
          onChange={(e) => setAlbumFilter(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fdf8f6] px-3 py-2 text-xs outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
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
          className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fdf8f6] px-3 py-2 text-xs outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
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
          className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fdf8f6] px-3 py-2 text-xs outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
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
          <DashboardShell title={t("dashboard.portfolioPreviewPage.title")} hideProfileCard>
        <UploadFeedbackToast
          open={Boolean(toast)}
          type={toast?.type ?? "info"}
          message={toast?.message ?? ""}
          onClose={() => setToast(null)}
        />
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-black">{t("dashboard.portfolioPreviewPage.albumViewTitle")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            {t("dashboard.portfolioPreviewPage.albumViewSubtitle")}
          </p>

          <div className="mt-6">{filterRow}</div>

          {items.length > 0 ? (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <AppButton type="button" size="sm" variant="secondary" onClick={toggleSelectMode}>
                {selectMode
                  ? t("dashboard.portfolioPreviewPage.selectModeOff")
                  : t("dashboard.portfolioPreviewPage.selectModeOn")}
              </AppButton>
              <AppButton
                type="button"
                size="sm"
                variant="secondary"
                loading={deleting}
                loadingLabel={t("dashboard.portfolioPreviewPage.deleting")}
                disabled={!selectMode || selectedIds.length === 0 || deleting}
                onClick={() => void handleDeleteSelected()}
                className="border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800"
              >
                {t("dashboard.portfolioPreviewPage.deleteSelected").replace(
                  "{count}",
                  String(selectedIds.length),
                )}
              </AppButton>
            </div>
          ) : null}

          {notice ? (
            <div className="mt-4">
              <Notice type={notice.type} message={notice.message} />
            </div>
          ) : null}

          <p className="mt-4 text-xs text-gray-400" aria-live="polite">
            Portfolio items: {items.length}
          </p>

          <div className="mt-8">
            {items.length === 0 ? (
              <p className="text-sm text-gray-500">{t("profile.portfolioEmpty")}</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-gray-500">{t("dashboard.portfolioPreviewPage.emptyFiltered")}</p>
            ) : (
              <PortfolioAlbumGrid
                groups={albumGroups}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={selectMode ? handleToggleSelect : undefined}
              />
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-2 border-t border-black/5 pt-8">
            <Link
              href={AppRoutes.dashboardMakeupArtist}
              className="inline-flex min-h-9 items-center justify-center rounded-full border border-black/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-black transition hover:bg-black hover:text-white"
            >
              {t("account.backDashboard")}
            </Link>
          </div>
        </div>
      </DashboardShell>
  );
}
