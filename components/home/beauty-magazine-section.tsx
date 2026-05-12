"use client";

import { useMemo } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { getBeautyArticlesForDay, getVietnamDayIndex } from "@/lib/beauty-articles";

function SourceLinks({
  sources,
  heading,
}: {
  sources: { url: string; label: string }[];
  heading: string;
}) {
  return (
    <div className="mt-5 border-t border-black/10 pt-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-700">{heading}</p>
      <ul className="mt-2 space-y-1.5">
        {sources.map((src) => (
          <li key={src.url} className="text-sm">
            <a
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-words text-pink-700 underline-offset-4 hover:text-pink-900 hover:underline"
            >
              {src.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BeautyMagazineSection() {
  const { t, language } = useLanguage();

  const { spotlight, others, resolve } = useMemo(
    () => getBeautyArticlesForDay(language, getVietnamDayIndex()),
    [language],
  );

  const s = resolve(spotlight);

  return (
    <section className="px-4 pb-24 sm:px-6" id="beauty-magazine">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center sm:mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-pink-400">{t("home.articlesEyebrow")}</p>
          <h2 className="mt-2 text-2xl font-bold text-black sm:text-4xl">{t("home.articlesTitle")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">{t("home.articlesSubtitle")}</p>
          <p className="mx-auto mt-2 max-w-2xl text-xs text-gray-500">{t("home.articlesDisclaimer")}</p>
        </div>

        <article className="rounded-[28px] border border-black/5 bg-gradient-to-br from-white to-pink-50/40 p-6 shadow-sm ring-1 ring-black/[0.03] sm:p-10">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-pink-600">
            <span>{t("home.articlesSpotlight")}</span>
          </div>
          <h3 className="mt-3 text-xl font-semibold leading-snug text-black sm:text-2xl">{s.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">{s.excerpt}</p>
          <SourceLinks sources={s.sources} heading={t("home.articlesSourcesHeading")} />
        </article>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {others.map((article) => {
            const o = resolve(article);
            return (
              <article
                key={article.id}
                className="flex flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:border-pink-200 hover:shadow-md"
              >
                <h4 className="line-clamp-4 text-sm font-semibold leading-snug text-black sm:text-[15px]">{o.title}</h4>
                <p className="mt-2 line-clamp-5 flex-1 text-xs leading-relaxed text-gray-600">{o.excerpt}</p>
                <SourceLinks sources={o.sources} heading={t("home.articlesSourcesHeading")} />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
