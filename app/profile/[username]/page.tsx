"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { useAuth } from "@/components/providers/auth-provider";
import { getUserByUsername } from "@/lib/auth-storage";
import { UserAccount } from "@/lib/auth-types";
import { getRoleLabel } from "@/lib/i18n";
import { useLanguage } from "@/components/providers/language-provider";
import { formatPriceCell } from "@/lib/vnd-format";
import { PortfolioVideoPreview } from "@/components/portfolio/portfolio-video-preview";
import { getStablePortfolioItems } from "@/lib/portfolio-media";

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserAccount | null>(null);
  const { user } = useAuth();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (!params.username) return;
    const user = getUserByUsername(params.username);
    setProfile(user);
  }, [params.username]);

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fdf8f6] p-6">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-black">{t("profile.notFound")}</p>
          <Link className="mt-4 inline-block text-pink-500 hover:underline" href="/">
            {t("common.backHome")}
          </Link>
        </div>
      </main>
    );
  }

  const portfolioItems =
    profile.role === "makeup_artist" ? getStablePortfolioItems(profile) : [];
  const portfolioImages = portfolioItems.filter((i) => i.kind === "image");
  const portfolioVideos = portfolioItems.filter((i) => i.kind === "video");

  if (!profile.isPublicProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fdf8f6] p-6">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-black">{t("profile.privateProfile")}</p>
          <Link className="mt-4 inline-block text-pink-500 hover:underline" href="/">
            {t("common.backHome")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fdf8f6] p-4 sm:p-6">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-pink-500">{t("profile.publicProfile")}</p>
            <h1 className="text-3xl font-bold text-black">
              {profile.displayName?.trim() || profile.username}
            </h1>
            <p className="text-sm text-gray-600">{getRoleLabel(language, profile.role)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user?.role === "customer" && profile.role === "makeup_artist" && profile.isPublicProfile ? (
              <Link href={`/book/${profile.username}`}>
                <AppButton>{t("profile.bookSession")}</AppButton>
              </Link>
            ) : null}
            {!user ? (
              <Link href="/auth/login">
                <AppButton variant="secondary">{t("profile.loginToConnect")}</AppButton>
              </Link>
            ) : (
              <Link href="/dashboard">
                <AppButton variant="secondary">{t("account.backDashboard")}</AppButton>
              </Link>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-black/10 p-5">
            <p className="text-sm text-gray-500">{t("profile.location")}</p>
            <p className="mt-1 font-medium text-black">{profile.location || t("profile.updatingSoon")}</p>
          </div>
          <div className="rounded-3xl border border-black/10 p-5">
            <p className="text-sm text-gray-500">{t("profile.pricing")}</p>
            {(() => {
              const packages =
                profile.servicePackages?.filter(
                  (p) => p.name.trim() || p.price.trim() || p.detail.trim(),
                ) ?? [];
              if (packages.length > 0) {
                return (
                  <ul className="mt-2 space-y-3">
                    {packages.map((p, i) => (
                      <li key={i} className="text-sm">
                        <span className="font-semibold text-black">
                          {p.name.trim() || "—"}
                          {p.price.trim() ? (
                            <span className="font-medium text-pink-600">
                              {" "}
                              · {formatPriceCell(p.price)}
                            </span>
                          ) : null}
                        </span>
                        {p.detail.trim() ? (
                          <p className="mt-1 leading-relaxed text-gray-600">{p.detail.trim()}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <p className="mt-1 font-medium text-black">
                  {profile.pricing || t("profile.contactForQuote")}
                </p>
              );
            })()}
          </div>
          <div className="rounded-3xl border border-black/10 p-5">
            <p className="text-sm text-gray-500">{t("profile.rating")}</p>
            <p className="mt-1 font-medium text-black">
              {profile.rating
                ? `${profile.rating} ★ (${profile.reviews ?? 0} ${t("profile.reviewsSuffix")})`
                : t("profile.noReviews")}
            </p>
          </div>
        </div>

        {profile.studioAddress?.trim() ? (
          <div className="mt-6 rounded-3xl border border-black/10 p-6">
            <p className="text-sm text-gray-500">{t("profile.studioAddress")}</p>
            <p className="mt-1 font-medium leading-relaxed text-black">{profile.studioAddress.trim()}</p>
          </div>
        ) : null}

        {(profile.specialties?.length || profile.cosmeticBrands?.length) ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {profile.specialties?.length ? (
              <div className="rounded-3xl border border-black/10 p-5">
                <p className="text-sm text-gray-500">{t("profile.styleFocus")}</p>
                <p className="mt-1 font-medium leading-relaxed text-black">
                  {(profile.specialties ?? []).join(" · ")}
                </p>
              </div>
            ) : null}
            {profile.cosmeticBrands?.length ? (
              <div className="rounded-3xl border border-black/10 p-5">
                <p className="text-sm text-gray-500">{t("profile.brandsUsed")}</p>
                <p className="mt-1 font-medium leading-relaxed text-black">
                  {(profile.cosmeticBrands ?? []).join(" · ")}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {portfolioImages.length > 0 ? (
          <div className="mt-6 rounded-3xl border border-black/10 p-6">
            <h2 className="text-lg font-semibold text-black">{t("profile.portfolioPhotos")}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {portfolioImages.map((item) => (
                <div
                  key={item.id}
                  className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#fdf8f6] ring-1 ring-black/5"
                >
                  <img src={item.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {portfolioVideos.length > 0 ? (
          <div className="mt-6 rounded-3xl border border-black/10 p-6">
            <h2 className="text-lg font-semibold text-black">{t("profile.portfolioVideos")}</h2>
            <ul className="mt-4 space-y-8">
              {portfolioVideos.map((item) => (
                <li key={item.id}>
                  <PortfolioVideoPreview url={item.url} className="max-w-3xl" />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 rounded-3xl border border-black/10 p-6">
          <h2 className="text-lg font-semibold text-black">{t("profile.bio")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {profile.bio || t("profile.fallbackBio")}
          </p>
        </div>
      </div>
    </main>
  );
}
