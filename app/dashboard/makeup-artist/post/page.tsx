"use client";

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { PortfolioVideoPreview } from "@/components/portfolio/portfolio-video-preview";
import { AppButton } from "@/components/ui/app-button";
import { Notice } from "@/components/ui/notice";
import { PortfolioMediaPreviewCard } from "@/components/upload/portfolio-media-preview-card";
import { UploadFeedbackToast } from "@/components/upload/upload-feedback-toast";
import { UploadZone } from "@/components/upload/upload-zone";
import { glamora } from "@/lib/ui/design-tokens";
import type { PortfolioItem } from "@/lib/auth-types";
import { AppRoutes } from "@/lib/app-routes";
import {
  getStablePortfolioItems,
  mergePortfolioItemsUnique,
  uniqueNonEmptyStrings,
} from "@/lib/portfolio-media";
import { MAX_PORTFOLIO_VIDEO_BYTES, portfolioItemsToUrlLists } from "@/lib/portfolio/portfolio-media-upload";
import {
  mapPortfolioApiError,
  preparePortfolioItemsForSaveViaApi,
  uploadPortfolioImageViaApi,
  uploadPortfolioVideoViaApi,
} from "@/lib/portfolio/portfolio-upload-client";
import { loadArtistPortfolioItemsForUser } from "@/lib/portfolio/fetch-artist-portfolio";
import { normalizeServicePackages } from "@/lib/service-packages";

/** Tổng số ảnh + video trong portfolio. */
const MAX_PORTFOLIO_ITEMS = 40;

/** Khung beauty chuẩn portrait 4:5, crop giữ trọng tâm — không resize/chất lượng ảnh gốc khi lưu. */
function BeautyStillPreview({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative mx-auto w-full max-w-[260px] overflow-hidden rounded-2xl bg-neutral-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] ring-1 ring-black/10">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-50">
        {!loaded ? (
          <div
            className="absolute inset-0 animate-pulse bg-gradient-to-br from-[var(--glamora-rose-soft)] via-white to-neutral-100"
            aria-hidden
          />
        ) : null}
        <img
          src={src}
          alt=""
          className={`h-full w-full object-cover object-center transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}

function MakeupArtistPostPageInner() {
  const { t } = useLanguage();
  const { user, authUser, updateProfile, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const freshEntry = searchParams.get("fresh") === "1";
  const fileRef = useRef<HTMLInputElement>(null);
  const skipHydrateAfterFreshRef = useRef(false);
  const draftDirtyRef = useRef(false);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [pickedFiles, setPickedFiles] = useState<File[]>([]);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const serverPortfolioKey = useMemo(
    () => (user?.portfolioItems ?? []).map((i) => i.id).join("|"),
    [user?.portfolioItems],
  );

  /**
   * Đồng bộ draft từ hồ sơ khi đổi tài khoản (`username`), không hydrate lại sau khi chỉ portfolio đổi (sau "Lưu portfolio").
   * `?fresh=1`: vào từ nút "Đăng bài" — form trống; sau `replace` URL bỏ query, bỏ qua một lần hydrate để không fill lại từ user.
   */
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    if (freshEntry) {
      skipHydrateAfterFreshRef.current = true;
      draftDirtyRef.current = false;
      setItems([]);
      setPickedFiles([]);
      setNotice(null);
      if (fileRef.current) fileRef.current.value = "";
      router.replace(AppRoutes.dashboardMakeupArtistPost, { scroll: false });
      return;
    }
    if (skipHydrateAfterFreshRef.current) {
      skipHydrateAfterFreshRef.current = false;
      return;
    }
    if (draftDirtyRef.current) return;

    const uid = user.id;
    let cancelled = false;
    void loadArtistPortfolioItemsForUser(uid).then((rows) => {
      if (cancelled) return;
      const next = rows.length > 0 ? rows : getStablePortfolioItems(user);
      console.log("[PORTFOLIO DEBUG] state length", next.length);
      setItems(next);
    });
    return () => {
      cancelled = true;
    };
  }, [user, user?.id, user?.username, serverPortfolioKey, freshEntry, router]);

  useEffect(() => {
    console.log("[PORTFOLIO DEBUG] rendering ids", items.map((x) => x.id));
    console.log("[PORTFOLIO DEBUG] state length", items.length);
  }, [items]);

  const imageItems = useMemo(() => items.filter((i) => i.kind === "image"), [items]);
  const videoItems = useMemo(() => items.filter((i) => i.kind === "video"), [items]);

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

  function patchItem(id: string, patch: Partial<Pick<PortfolioItem, "album" | "styleTag" | "packageName">>) {
    draftDirtyRef.current = true;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function removeItem(id: string) {
    draftDirtyRef.current = true;
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function renderClassificationMeta(item: PortfolioItem) {
    return (
      <div className="grid min-w-0 gap-3 md:grid-cols-3">
        <label className="block text-xs font-semibold text-gray-600">
          {t("dashboard.portfolioPreviewPage.colAlbum")}
          <input
            value={item.album ?? ""}
            onChange={(e) => patchItem(item.id, { album: e.target.value })}
            list="post-page-album-suggestions"
            className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
            placeholder="—"
          />
        </label>
        <label className="block text-xs font-semibold text-gray-600">
          {t("dashboard.portfolioPreviewPage.colStyle")}
          <input
            value={item.styleTag ?? ""}
            onChange={(e) => patchItem(item.id, { styleTag: e.target.value })}
            list="post-page-style-suggestions"
            className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
            placeholder="—"
          />
        </label>
        <label className="block text-xs font-semibold text-gray-600">
          {t("dashboard.portfolioPreviewPage.colPackage")}
          <select
            value={item.packageName ?? ""}
            onChange={(e) => patchItem(item.id, { packageName: e.target.value || undefined })}
            className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
          >
            <option value="">—</option>
            {packageNameOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  function onFileInputChange(files: FileList | null) {
    if (!files?.length) {
      setPickedFiles([]);
      return;
    }
    setPickedFiles(Array.from(files));
    setNotice(null);
  }

  async function handleUploadFromPicker() {
    if (!pickedFiles.length || uploading) return;
    const userId = user?.id ?? authUser?.id;
    if (!userId) {
      setNotice({ type: "error", message: t("authMessages.noAuthenticatedUser") });
      return;
    }

    setNotice(null);
    setToast(null);
    setUploading(true);
    setUploadProgress(0);

    const newEntries: PortfolioItem[] = [];
    let added = 0;
    const files = [...pickedFiles];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        setUploadProgress(Math.round(((i + 0.5) / files.length) * 100));

        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          continue;
        }

        if (isVideo && file.size > MAX_PORTFOLIO_VIDEO_BYTES) {
          setNotice({ type: "error", message: t("dashboard.artistPostPage.videoFileTooLarge") });
          continue;
        }

        try {
          const entry = isImage
            ? await uploadPortfolioImageViaApi(userId, file)
            : await uploadPortfolioVideoViaApi(userId, file);
          newEntries.push(entry);
          added += 1;
        } catch (err) {
          console.error("[portfolio upload]", err);
          const key = mapPortfolioApiError(err);
          setNotice({ type: "error", message: t(key) });
        }
      }

      if (newEntries.length > 0) {
        draftDirtyRef.current = true;
        setItems((prev) => {
          const merged = mergePortfolioItemsUnique(newEntries, prev);
          if (merged.length > MAX_PORTFOLIO_ITEMS) {
            setNotice({
              type: "error",
              message: t("dashboard.artistPostPage.maxImages").replace("{max}", String(MAX_PORTFOLIO_ITEMS)),
            });
            return prev;
          }
          return merged;
        });

        const rows = await loadArtistPortfolioItemsForUser(userId);
        if (rows.length > 0) {
          setItems(rows);
          console.log("[PORTFOLIO DEBUG] state length", rows.length);
        }
        await refreshUser();
      }
      setPickedFiles([]);
      if (fileRef.current) fileRef.current.value = "";

      setUploadProgress(100);
      if (added > 0) {
        setToast({
          type: "success",
          message: t("dashboard.artistPostPage.uploadSuccess").replace("{count}", String(added)),
        });
      }
    } catch (err) {
      console.error("[portfolio upload]", err);
      setToast({ type: "error", message: t(mapPortfolioApiError(err)) });
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (loading || uploading) return;
    const userId = user?.id ?? authUser?.id;
    if (!userId) {
      setNotice({ type: "error", message: t("authMessages.noAuthenticatedUser") });
      return;
    }

    setLoading(true);
    setNotice(null);
    setToast(null);

    try {
      const prepared = await preparePortfolioItemsForSaveViaApi(items, (index, total) => {
        setUploadProgress(Math.round(((index + 0.5) / Math.max(total, 1)) * 100));
      });
      const { images, videos } = portfolioItemsToUrlLists(prepared);

      const result = await updateProfile({
        portfolioImageUrls: images,
        portfolioVideoUrls: videos,
        portfolioItems: prepared,
      });

      if (result.ok) {
        draftDirtyRef.current = false;
        await refreshUser();
        const savedRows = await loadArtistPortfolioItemsForUser(userId);
        setItems(savedRows.length > 0 ? savedRows : prepared);
        console.log("[PORTFOLIO DEBUG] state length", savedRows.length || prepared.length);
        setToast({ type: "success", message: t("dashboard.artistPostPage.saveSuccess") });
        setNotice(null);
        setPickedFiles([]);
        if (fileRef.current) fileRef.current.value = "";
      } else {
        const msg = t(result.messageKey);
        setNotice({ type: "error", message: msg });
        setToast({ type: "error", message: msg });
      }
    } catch (err) {
      console.error("[portfolio save]", err);
      const msg = t(mapPortfolioApiError(err));
      setNotice({ type: "error", message: msg });
      setToast({ type: "error", message: msg });
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  }

  const pickedLabel =
    pickedFiles.length > 0
      ? t("dashboard.artistPostPage.filesPicked").replace("{count}", String(pickedFiles.length))
      : t("dashboard.artistPostPage.filesPickedNone");

  const uploadBusyLabel =
    uploadProgress != null && uploadProgress < 70
      ? t("dashboard.artistPostPage.uploadReading")
      : t("dashboard.artistPostPage.uploadProcessing");

  return (
          <DashboardShell title={t("dashboard.artistPostPage.title")} hideProfileCard>
        <UploadFeedbackToast
          open={Boolean(toast)}
          type={toast?.type ?? "info"}
          message={toast?.message ?? ""}
          onClose={() => setToast(null)}
        />
        <div className={`mb-6 ${glamora.cardElevated} sm:p-8`}>
          <p className={glamora.subtitle}>{t("dashboard.artistPostPage.subtitle")}</p>
          <p className="mt-2 text-xs text-gray-500">{t("dashboard.artistPostPage.hint")}</p>

          <UploadZone
            title={t("dashboard.artistPostPage.uploadZoneTitle")}
            busy={uploading}
            progress={uploadProgress}
            progressLabel={t("dashboard.artistPostPage.uploadProgressLabel")}
            busyLabel={uploadBusyLabel}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="sr-only"
              aria-label={t("dashboard.artistPostPage.chooseFiles")}
              onChange={(e) => onFileInputChange(e.target.files)}
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <AppButton
                type="button"
                variant="secondary"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {t("dashboard.artistPostPage.chooseFiles")}
              </AppButton>
              <AppButton
                type="button"
                loading={uploading}
                loadingLabel={uploadBusyLabel}
                disabled={pickedFiles.length === 0 || uploading}
                onClick={() => void handleUploadFromPicker()}
              >
                {t("dashboard.artistPostPage.uploadAdd")}
              </AppButton>
            </div>
            <p className="mt-3 text-xs text-gray-600">{pickedLabel}</p>
          </UploadZone>

          <form className="mt-10 space-y-8" onSubmit={handleSave}>
            <div>
              <h3 className="text-sm font-semibold text-black">{t("dashboard.artistPostPage.currentMedia")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">{t("dashboard.artistPostPage.classificationIntro")}</p>

              {items.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">{t("dashboard.artistPostPage.noMedia")}</p>
              ) : (
                <div className="mt-6 space-y-10">
                  {imageItems.length > 0 ? (
                    <div>
                      <ul className="space-y-8">
                        {imageItems.map((item) => (
                          <PortfolioMediaPreviewCard
                            key={item.id}
                            preview={<BeautyStillPreview src={item.url} />}
                            onRemove={() => removeItem(item.id)}
                            removeLabel={t("dashboard.artistPostPage.remove")}
                            meta={renderClassificationMeta(item)}
                          />
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {videoItems.length > 0 ? (
                    <div>
                      <ul className="space-y-8">
                        {videoItems.map((item) => (
                          <PortfolioMediaPreviewCard
                            key={item.id}
                            className="sm:items-start"
                            preview={
                              <div className="w-full min-w-0 sm:max-w-md">
                                <PortfolioVideoPreview url={item.url} />
                              </div>
                            }
                            onRemove={() => removeItem(item.id)}
                            removeLabel={t("dashboard.artistPostPage.remove")}
                            meta={renderClassificationMeta(item)}
                          />
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <datalist id="post-page-album-suggestions">
              {albumOptions.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
            <datalist id="post-page-style-suggestions">
              {styleOptions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>

            {notice ? <Notice type={notice.type} message={notice.message} /> : null}

            <div className="flex flex-wrap gap-2">
              <AppButton
                type="submit"
                loading={loading}
                loadingLabel={t("dashboard.artistPostPage.savePublishing")}
                disabled={loading || uploading}
              >
                {t("dashboard.artistPostPage.savePortfolio")}
              </AppButton>
              <Link
                href={AppRoutes.dashboardMakeupArtist}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-black/15 bg-white px-5 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
              >
                {t("account.backDashboard")}
              </Link>
            </div>
          </form>
        </div>
      </DashboardShell>
  );
}

function MakeupArtistPostPageFallback() {
  const { t } = useLanguage();
  return (
          <DashboardShell title={t("dashboard.artistPostPage.title")} hideProfileCard>
        <div
          className="mb-6 min-h-[40vh] rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8"
          aria-busy
        />
      </DashboardShell>
  );
}

export default function MakeupArtistPostPage() {
  return (
    <Suspense fallback={<MakeupArtistPostPageFallback />}>
      <MakeupArtistPostPageInner />
    </Suspense>
  );
}
