"use client";

import { useState } from "react";
import Link from "next/link";

type Language = "VN" | "EN";

const content: Record<
  Language,
  {
    brand: string;
    navExplore: string;
    navBecomeArtist: string;
    marketplace: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    exploreArtists: string;
    becomeArtist: string;
    featuredArtists: string;
    viewAll: string;
    artistLabel: string;
    artistServices: string;
    fromPrice: string;
    bookNow: string;
    ctaTitle: string;
    ctaDescription: string;
    startBooking: string;
  }
> = {
  VN: {
    brand: "Glamora",
    navExplore: "Đăng nhập",
    navBecomeArtist: "Tạo tài khoản",
    marketplace: "Sàn Kết Nối Làm Đẹp Glamora",
    titleLine1: "Tìm Chuyên Viên",
    titleLine2: "Trang Điểm Phù Hợp Nhất",
    description:
      "Kết nối với các makeup artist tài năng gần bạn cho cưới hỏi, sự kiện, chụp ảnh và làm đẹp hằng ngày.",
    exploreArtists: "Khám Phá Chuyên Viên",
    becomeArtist: "Trở Thành Makeup Artist",
    featuredArtists: "Chuyên Viên Nổi Bật",
    viewAll: "Xem Tất Cả",
    artistLabel: "Chuyên viên",
    artistServices: "Cô dâu • Thời trang • Trang điểm tự nhiên",
    fromPrice: "Từ $80",
    bookNow: "Đặt Lịch",
    ctaTitle: "Sẵn sàng cho diện mạo rạng rỡ tiếp theo?",
    ctaDescription: "Khám phá các chuyên viên làm đẹp tài năng trên khắp Việt Nam.",
    startBooking: "Bắt Đầu Đặt Lịch",
  },
  EN: {
    brand: "Glamora",
    navExplore: "Login",
    navBecomeArtist: "Create account",
    marketplace: "Glamora Beauty Marketplace",
    titleLine1: "Find Your Perfect",
    titleLine2: "Makeup Artist",
    description:
      "Connect with talented makeup artists near you for weddings, events, photoshoots, and everyday beauty.",
    exploreArtists: "Explore Artists",
    becomeArtist: "Become an Artist",
    featuredArtists: "Featured Artists",
    viewAll: "View All",
    artistLabel: "Artist",
    artistServices: "Bridal • Fashion • Natural Makeup",
    fromPrice: "From $80",
    bookNow: "Book Now",
    ctaTitle: "Ready for your next glow up?",
    ctaDescription: "Discover talented beauty artists across Vietnam.",
    startBooking: "Start Booking",
  },
};

export default function HomePage() {
  const [language, setLanguage] = useState<Language>("VN");
  const t = content[language];

  return (
    <main className="min-h-screen bg-[#fdf8f6] text-[#2b2b2b]">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-[#fdf8f6]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="text-xl font-semibold tracking-wide">{t.brand}</div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth/login"
              className="hidden rounded-full px-4 py-2 text-sm text-gray-600 transition hover:bg-black/5 sm:inline-flex"
            >
              {t.navExplore}
            </Link>
            <Link
              href="/auth/signup"
              className="hidden rounded-full border border-black/20 px-4 py-2 text-sm transition hover:bg-black hover:text-white sm:inline-flex"
            >
              {t.navBecomeArtist}
            </Link>

            <div className="inline-flex rounded-full border border-black/10 bg-white/90 p-1 shadow-sm">
              {(["VN", "EN"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  aria-pressed={language === lang}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300 sm:px-4 sm:py-2 sm:text-sm ${
                    language === lang
                      ? "bg-black text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-black"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="px-6 py-16 text-center sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-pink-400">
            {t.marketplace}
          </p>

          <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-7xl">
            {t.titleLine1}
            <br />
            {t.titleLine2}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-gray-600 sm:text-lg">
            {t.description}
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/auth/signup"
              className="rounded-full bg-black px-8 py-4 text-white transition duration-300 hover:-translate-y-0.5 hover:opacity-90"
            >
              {t.exploreArtists}
            </Link>

            <Link
              href="/auth/signup"
              className="rounded-full border border-black px-8 py-4 transition duration-300 hover:-translate-y-0.5 hover:bg-black hover:text-white"
            >
              {t.becomeArtist}
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED ARTISTS */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-semibold">{t.featuredArtists}</h2>

            <button className="text-sm underline">{t.viewAll}</button>
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
                      {t.artistLabel} {artist}
                    </h3>

                    <span className="text-sm text-pink-500">
                      ★ 4.9
                    </span>
                  </div>

                  <p className="mt-2 text-gray-500">
                    {t.artistServices}
                  </p>

                  <div className="mt-6 flex items-center justify-between">
                    <p className="font-medium">
                      {t.fromPrice}
                    </p>

                    <button type="button" className="bg-black text-white px-5 py-2 rounded-full text-sm">
                      {t.bookNow}
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
            {t.ctaTitle}
          </h2>

          <p className="mt-4 text-gray-600">
            {t.ctaDescription}
          </p>

          <Link href="/auth/signup" className="mt-8 inline-block bg-black text-white px-8 py-4 rounded-full">
            {t.startBooking}
          </Link>
        </div>
      </section>
    </main>
  );
}