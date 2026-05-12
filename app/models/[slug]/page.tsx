"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import {
  getModelDemoIndex,
  isModelDemoSlug,
  modelAvatarUrl,
  modelPortfolioImageUrls,
} from "@/lib/model-demo-profiles";
import { getRoleLabel } from "@/lib/i18n";

export default function ModelShowcasePage() {
  const params = useParams<{ slug: string }>();
  const { t, language } = useLanguage();
  const slug = typeof params.slug === "string" ? params.slug : "";

  if (!isModelDemoSlug(slug)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fdf8f6] p-6">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-black">{t("modelSpotlight.notFound")}</p>
          <Link className="mt-4 inline-block text-pink-600 hover:underline" href="/#explore-models">
            {t("modelSpotlight.backToModels")}
          </Link>
        </div>
      </main>
    );
  }

  const idx = getModelDemoIndex(slug)!;
  const avatarUrl = modelAvatarUrl(slug);
  const portfolioUrls = modelPortfolioImageUrls(slug);

  return (
    <main className="min-h-screen bg-[#fdf8f6] p-4 pb-16 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/#explore-models"
          className="inline-flex text-sm font-medium text-pink-600 underline-offset-4 hover:underline"
        >
          ← {t("modelSpotlight.backToModels")}
        </Link>

        <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/80 px-4 py-3 text-sm text-gray-800">
          {t("modelSpotlight.demoNotice")}
        </div>

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm">
          <div className="relative aspect-[21/9] min-h-[200px] w-full bg-gradient-to-br from-violet-100 to-pink-50 sm:aspect-[3/1]">
            <img
              src={avatarUrl}
              alt={t(`home.modelDemo${idx}Name`)}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>

          <div className="p-6 sm:p-10">
            <p className="text-xs uppercase tracking-[0.2em] text-violet-500">{t("modelSpotlight.eyebrow")}</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-black sm:text-4xl">{t(`home.modelDemo${idx}Name`)}</h1>
                <p className="mt-1 text-sm text-gray-600">{getRoleLabel(language, "model")}</p>
                <p className="mt-2 text-sm text-gray-500">{t(`home.modelDemo${idx}Tagline`)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-black">{t(`home.modelDemo${idx}Rate`)}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/10 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t("profile.location")}</p>
                <p className="mt-1 text-sm font-medium text-black">{t(`modelSpotlight.demo${idx}Location`)}</p>
              </div>
              <div className="rounded-2xl border border-black/10 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t("modelSpotlight.measurementsLabel")}</p>
                <p className="mt-1 text-sm font-medium text-black">{t(`home.modelDemo${idx}Measurements`)}</p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-black/10 p-6">
              <h2 className="text-lg font-semibold text-black">{t("profile.bio")}</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{t(`modelSpotlight.demo${idx}BioLong`)}</p>
            </div>

            <div className="mt-10">
              <h2 className="text-lg font-semibold text-black">{t("modelSpotlight.portfolioHeading")}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {portfolioUrls.map((url) => (
                  <div
                    key={url}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-violet-50 ring-1 ring-black/5"
                  >
                    <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10">
              <h2 className="text-lg font-semibold text-black">{t("modelSpotlight.videoHeading")}</h2>
              <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 shadow-inner ring-1 ring-black/10">
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
                  <span className="text-3xl opacity-40" aria-hidden>
                    ▶
                  </span>
                  <p className="max-w-md text-sm text-white/85">{t("modelSpotlight.videoCaption")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
