"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { AppRoutes } from "@/lib/app-routes";
import {
  avatarUrlForSlug,
  getFeaturedDemoIndex,
  isFeaturedDemoSlug,
  portfolioImageUrlsForSlug,
} from "@/lib/featured-demo-profiles";
import { getRoleLabel } from "@/lib/i18n";

export default function SpotlightDemoPage() {
  const params = useParams<{ slug: string }>();
  const { t, language } = useLanguage();
  const slug = typeof params.slug === "string" ? params.slug : "";

  if (!isFeaturedDemoSlug(slug)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fdf8f6] p-6">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-black">{t("spotlight.notFound")}</p>
          <Link
            className="mt-4 inline-flex rounded-full border border-black/20 bg-white px-6 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-black hover:text-white"
            href={AppRoutes.artistsIndex}
          >
            ← {t("spotlight.backToArtistsList")}
          </Link>
        </div>
      </main>
    );
  }

  const idx = getFeaturedDemoIndex(slug)!;
  const avatarUrl = avatarUrlForSlug(slug);
  const portfolioUrls = portfolioImageUrlsForSlug(slug);

  return (
    <main className="min-h-screen bg-[#fdf8f6] p-4 pb-16 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href={AppRoutes.artistsIndex}
          className="inline-flex items-center gap-2 rounded-full border border-black/20 bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:bg-black hover:text-white"
        >
          <span aria-hidden>←</span>
          {t("spotlight.backToArtistsList")}
        </Link>

        <div className="mt-6 rounded-2xl border border-pink-100 bg-pink-50/80 px-4 py-3 text-sm text-gray-800">
          {t("spotlight.demoNotice")}
        </div>

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm">
          <div className="relative aspect-[21/9] min-h-[200px] w-full bg-gradient-to-br from-pink-100 to-rose-50 sm:aspect-[3/1]">
            <img
              src={avatarUrl}
              alt={t(`home.featuredDemo${idx}Name`)}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>

          <div className="p-6 sm:p-10">
            <p className="text-xs uppercase tracking-[0.2em] text-pink-500">{t("spotlight.eyebrow")}</p>
            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold text-black sm:text-4xl">{t(`home.featuredDemo${idx}Name`)}</h1>
                <p className="mt-1 text-sm text-gray-600">{getRoleLabel(language, "makeup_artist")}</p>
                <p className="mt-2 text-sm text-gray-500">{t(`home.featuredDemo${idx}Tagline`)}</p>
              </div>
              <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:shrink-0 sm:items-end sm:text-right">
                <div>
                  <p className="text-sm font-medium text-pink-600">★ 4.9</p>
                  <p className="mt-1 text-sm font-semibold text-black">{t(`home.featuredDemo${idx}Price`)}</p>
                </div>
                <Link
                  href={AppRoutes.bookArtist(slug)}
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:w-auto sm:min-w-[10.5rem]"
                >
                  {t("spotlight.bookNowCta")}
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/10 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t("profile.location")}</p>
                <p className="mt-1 text-sm font-medium text-black">{t(`spotlight.demo${idx}Location`)}</p>
              </div>
              <div className="rounded-2xl border border-black/10 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t("profile.pricing")}</p>
                <p className="mt-1 text-sm font-medium text-black">{t(`home.featuredDemo${idx}Price`)}</p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-black/10 p-6">
              <h2 className="text-lg font-semibold text-black">{t("profile.bio")}</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{t(`spotlight.demo${idx}BioLong`)}</p>
            </div>

            <div className="mt-10">
              <h2 className="text-lg font-semibold text-black">{t("spotlight.portfolioHeading")}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {portfolioUrls.map((url) => (
                  <div
                    key={url}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-pink-50 ring-1 ring-black/5"
                  >
                    <img
                      src={url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10">
              <h2 className="text-lg font-semibold text-black">{t("spotlight.videoHeading")}</h2>
              <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 shadow-inner ring-1 ring-black/10">
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
                  <span className="text-3xl opacity-40" aria-hidden>
                    ▶
                  </span>
                  <p className="max-w-md text-sm text-white/85">{t("spotlight.videoCaption")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
