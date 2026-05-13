"use client";

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RequireRole } from "@/components/auth/require-role";
import { useLanguage } from "@/components/providers/language-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { PortfolioVideoPreview } from "@/components/portfolio/portfolio-video-preview";
import { AppButton } from "@/components/ui/app-button";
import { Notice } from "@/components/ui/notice";
import type { PortfolioItem } from "@/lib/auth-types";
import { AppRoutes } from "@/lib/app-routes";
import { getStablePortfolioItems, makeStableItemId, uniqueNonEmptyStrings } from "@/lib/portfolio-media";
import { normalizeServicePackages } from "@/lib/service-packages";

/** Tổng số ảnh + video trong portfolio (demo). */
const MAX_PORTFOLIO_ITEMS = 40;
/** Giới hạn chuỗi base64 để tránh tràn localStorage / trình duyệt. */
const MAX_DATA_URL_CHARS = 10_000_000;
/** Video file — đọc nguyên file base64; giới hạn dung lượng nguồn. */
const MAX_VIDEO_FILE_BYTES = 28 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Khung beauty chuẩn portrait 4:5, crop giữ trọng tâm — không resize/chất lượng ảnh gốc khi lưu. */
function BeautyStillPreview({ src }: { src: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[260px] overflow-hidden rounded-2xl bg-neutral-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] ring-1 ring-black/10">
      <div className="aspect-[4/5] w-full overflow-hidden bg-neutral-50">
        <img src={src} alt="" className="h-full w-full object-cover object-center" loading="lazy" />
      </div>
    </div>
  );
}

function MakeupArtistPostPageInner() {
  const { t } = useLanguage();
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const freshEntry = searchParams.get("fresh") === "1";
  const fileRef = useRef<HTMLInputElement>(null);
  const skipHydrateAfterFreshRef = useRef(false);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [pickedFiles, setPickedFiles] = useState<File[]>([]);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    setItems(getStablePortfolioItems(user));
  }, [user?.username, freshEntry, router]);

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
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
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
    if (!pickedFiles.length) return;
    setNotice(null);
    setUploading(true);

    const imgs = items.filter((i) => i.kind === "image");
    const vids = items.filter((i) => i.kind === "video");
    let nextImgs = [...imgs];
    let nextVids = [...vids];

    try {
      for (const file of pickedFiles) {
        const total = nextImgs.length + nextVids.length;
        if (total >= MAX_PORTFOLIO_ITEMS) {
          setNotice({
            type: "error",
            message: t("dashboard.artistPostPage.maxImages").replace("{max}", String(MAX_PORTFOLIO_ITEMS)),
          });
          break;
        }

        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          continue;
        }

        if (isVideo && file.size > MAX_VIDEO_FILE_BYTES) {
          setNotice({ type: "error", message: t("dashboard.artistPostPage.videoFileTooLarge") });
          continue;
        }

        try {
          const dataUrl = await readFileAsDataUrl(file);
          if (dataUrl.length > MAX_DATA_URL_CHARS) {
            setNotice({ type: "error", message: t("dashboard.artistPostPage.imageTooLarge") });
            continue;
          }

          if (isImage) {
            nextImgs.push({
              id: makeStableItemId(dataUrl, "image"),
              url: dataUrl,
              kind: "image",
            });
          } else {
            nextVids.push({
              id: makeStableItemId(dataUrl, "video"),
              url: dataUrl,
              kind: "video",
            });
          }
        } catch {
          setNotice({ type: "error", message: t("dashboard.artistPostPage.imageTooLarge") });
        }
      }

      setItems([...nextImgs, ...nextVids]);
      setPickedFiles([]);
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    const images = items.filter((i) => i.kind === "image").map((i) => i.url);
    const videos = items.filter((i) => i.kind === "video").map((i) => i.url);
    const result = await updateProfile({
      portfolioImageUrls: images,
      portfolioVideoUrls: videos,
      portfolioItems: items,
    });
    setLoading(false);
    setNotice({
      type: result.ok ? "success" : "error",
      message: t(result.messageKey),
    });
    if (result.ok) {
      setItems([]);
      setPickedFiles([]);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const pickedLabel =
    pickedFiles.length > 0
      ? t("dashboard.artistPostPage.filesPicked").replace("{count}", String(pickedFiles.length))
      : t("dashboard.artistPostPage.filesPickedNone");

  return (
    <RequireRole role="makeup_artist">
      <DashboardShell title={t("dashboard.artistPostPage.title")} hideProfileCard>
        <div className="mb-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm text-gray-600">{t("dashboard.artistPostPage.subtitle")}</p>
          <p className="mt-2 text-xs text-gray-500">{t("dashboard.artistPostPage.hint")}</p>

          <div className="mt-8 rounded-2xl border border-dashed border-black/15 bg-[#fdf8f6] p-6">
            <p className="text-sm font-semibold text-black">{t("dashboard.artistPostPage.uploadZoneTitle")}</p>
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
              <AppButton type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
                {t("dashboard.artistPostPage.chooseFiles")}
              </AppButton>
              <AppButton type="button" loading={uploading} disabled={pickedFiles.length === 0} onClick={() => void handleUploadFromPicker()}>
                {t("dashboard.artistPostPage.uploadAdd")}
              </AppButton>
            </div>
            <p className="mt-3 text-xs text-gray-600">{pickedLabel}</p>
          </div>

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
                          <li
                            key={item.id}
                            className="rounded-3xl border border-black/10 bg-[#fdf8f6] p-4 sm:flex sm:gap-6 sm:p-5"
                          >
                            <div className="relative mx-auto shrink-0 sm:mx-0">
                              <BeautyStillPreview src={item.url} />
                              <button
                                type="button"
                                className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white"
                                onClick={() => removeItem(item.id)}
                              >
                                {t("dashboard.artistPostPage.remove")}
                              </button>
                            </div>
                            <div className="mt-4 grid min-w-0 flex-1 gap-3 sm:mt-0 md:grid-cols-3">
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
                                  onChange={(e) =>
                                    patchItem(item.id, { packageName: e.target.value || undefined })
                                  }
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
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {videoItems.length > 0 ? (
                    <div>
                      <ul className="space-y-8">
                        {videoItems.map((item) => (
                          <li
                            key={item.id}
                            className="rounded-3xl border border-black/10 bg-[#fdf8f6] p-4 sm:flex sm:gap-6 sm:p-5"
                          >
                            <div className="w-full min-w-0 shrink-0 sm:max-w-md">
                              <PortfolioVideoPreview url={item.url} />
                              <button
                                type="button"
                                className="mt-3 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-black/5 sm:w-auto"
                                onClick={() => removeItem(item.id)}
                              >
                                {t("dashboard.artistPostPage.remove")}
                              </button>
                            </div>
                            <div className="mt-4 grid min-w-0 flex-1 gap-3 sm:mt-0 md:grid-cols-3">
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
                                  onChange={(e) =>
                                    patchItem(item.id, { packageName: e.target.value || undefined })
                                  }
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
                          </li>
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
              <AppButton type="submit" loading={loading}>
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
    </RequireRole>
  );
}

function MakeupArtistPostPageFallback() {
  const { t } = useLanguage();
  return (
    <RequireRole role="makeup_artist">
      <DashboardShell title={t("dashboard.artistPostPage.title")} hideProfileCard>
        <div
          className="mb-6 min-h-[40vh] rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8"
          aria-busy
        />
      </DashboardShell>
    </RequireRole>
  );
}

export default function MakeupArtistPostPage() {
  return (
    <Suspense fallback={<MakeupArtistPostPageFallback />}>
      <MakeupArtistPostPageInner />
    </Suspense>
  );
}
