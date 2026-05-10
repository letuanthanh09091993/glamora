"use client";

import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-[#fdf8f6] text-[#2b2b2b]">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-[#fdf8f6]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="text-xl font-semibold tracking-wide">{t("common.appName")}</div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth/login"
              className="hidden rounded-full px-4 py-2 text-sm text-gray-600 transition hover:bg-black/5 sm:inline-flex"
            >
              {t("common.login")}
            </Link>
            <Link
              href="/auth/signup"
              className="hidden rounded-full border border-black/20 px-4 py-2 text-sm transition hover:bg-black hover:text-white sm:inline-flex"
            >
              {t("common.createAccount")}
            </Link>

            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="px-6 py-16 text-center sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-pink-400">
            {t("home.marketplace")}
          </p>

          <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-7xl">
            {t("home.titleLine1")}
            <br />
            {t("home.titleLine2")}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-gray-600 sm:text-lg">
            {t("home.description")}
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/auth/signup"
              className="rounded-full bg-black px-8 py-4 text-white transition duration-300 hover:-translate-y-0.5 hover:opacity-90"
            >
              {t("home.heroPrimary")}
            </Link>

            <Link
              href="/auth/signup"
              className="rounded-full border border-black px-8 py-4 transition duration-300 hover:-translate-y-0.5 hover:bg-black hover:text-white"
            >
              {t("home.heroSecondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED ARTISTS */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-semibold">{t("home.featuredArtists")}</h2>

            <button className="text-sm underline">{t("home.viewAll")}</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((artist) => (
              <div
                key={artist}
                className="bg-white rounded-[30px] overflow-hidden shadow-sm hover:shadow-xl transition"
              >
                <div className="h-[350px] bg-pink-100"></div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-semibold">
                      {t("home.artistLabel")} {artist}
                    </h3>

                    <span className="text-sm text-pink-500">
                      ★ 4.9
                    </span>
                  </div>

                  <p className="mt-2 text-gray-500">
                    {t("home.artistServices")}
                  </p>

                  <div className="mt-6 flex items-center justify-between">
                    <p className="font-medium">
                      {t("home.fromPrice")}
                    </p>

                    <button type="button" className="bg-black text-white px-5 py-2 rounded-full text-sm">
                      {t("home.bookNow")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto bg-[#f8e8e4] rounded-[40px] p-12 text-center">
          <h2 className="text-4xl font-bold">
            {t("home.ctaTitle")}
          </h2>

          <p className="mt-4 text-gray-600">
            {t("home.ctaDescription")}
          </p>

          <Link href="/auth/signup" className="mt-8 inline-block bg-black text-white px-8 py-4 rounded-full">
            {t("home.startBooking")}
          </Link>
        </div>
      </section>
    </main>
  );
}