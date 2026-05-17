"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BookingForm } from "@/components/booking/booking-form";
import { BookingPageLayout } from "@/components/booking/booking-page-layout";
import { Notice } from "@/components/ui/notice";
import { AppButton } from "@/components/ui/app-button";
import { LoadingState } from "@/components/ui/loading-state";
import { SectionHeader } from "@/components/ui/section-header";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { isPublicDiscoverableMakeupArtist } from "@/lib/artist/public-artists";
import { getUserByUsername } from "@/lib/auth-storage";
import { UserAccount } from "@/lib/auth-types";
import {
  featuredDemoArtistDisplayName,
  isFeaturedDemoSlug,
  resolveFeaturedDemoArtist,
} from "@/lib/featured-demo-profiles";

export default function BookArtistPage() {
  const params = useParams<{ username: string }>();
  const { user, isReady } = useAuth();
  const { t, language } = useLanguage();
  const [artist, setArtist] = useState<UserAccount | null | undefined>(undefined);

  useEffect(() => {
    if (!params.username) {
      setArtist(null);
      return;
    }
    const raw = decodeURIComponent(params.username);
    void (async () => {
      const found = await getUserByUsername(raw);
      setArtist(found ?? resolveFeaturedDemoArtist(raw, language));
    })();
  }, [params.username, language]);

  if (!isReady) {
    return <LoadingState message={t("common.loading")} fullScreen />;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#fdf8f6] p-4 sm:p-6">
        <div className="mx-auto max-w-lg rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-black">{t("booking.title")}</h1>
          <Notice type="error" message={t("booking.loginRequired")} />
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href={`/auth/login?next=/book/${params.username}`} className="inline-flex">
              <AppButton>{t("common.login")}</AppButton>
            </Link>
            <Link href="/" className="inline-flex">
              <AppButton variant="secondary">{t("common.backHome")}</AppButton>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (user.role !== "customer") {
    return (
      <main className="min-h-screen bg-[#fdf8f6] p-4 sm:p-6">
        <div className="mx-auto max-w-lg rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-black">{t("booking.title")}</h1>
          <Notice type="error" message={t("booking.wrongRole")} />
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/">
              <AppButton variant="secondary">{t("home.navExplore")}</AppButton>
            </Link>
            <Link href="/dashboard">
              <AppButton variant="secondary">{t("home.navDashboard")}</AppButton>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (artist === undefined) {
    return <LoadingState message={t("common.loading")} fullScreen />;
  }

  if (!artist) {
    return (
      <main className="min-h-screen bg-[#fdf8f6] p-4 sm:p-6">
        <div className="mx-auto max-w-lg rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <Notice type="error" message={t("booking.artistNotFound")} />
          <Link className="mt-4 inline-flex text-pink-600 hover:underline" href="/">
            {t("common.backHome")}
          </Link>
        </div>
      </main>
    );
  }

  if (artist.role !== "makeup_artist") {
    return (
      <main className="min-h-screen bg-[#fdf8f6] p-4 sm:p-6">
        <div className="mx-auto max-w-lg rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <Notice type="error" message={t("booking.notArtist")} />
          <Link className="mt-4 inline-flex" href={`/profile/${artist.username}`}>
            <AppButton variant="secondary">{t("booking.backToProfile")}</AppButton>
          </Link>
        </div>
      </main>
    );
  }

  if (!isFeaturedDemoSlug(artist.username) && !isPublicDiscoverableMakeupArtist(artist)) {
    return (
      <main className="min-h-screen bg-[#fdf8f6] p-4 sm:p-6">
        <div className="mx-auto max-w-lg rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <Notice
            type="error"
            message={
              !artist.isPublicProfile
                ? t("booking.privateArtist")
                : t("booking.unverifiedArtist")
            }
          />
          <Link className="mt-4 inline-flex" href={`/profile/${artist.username}`}>
            <AppButton variant="secondary">{t("booking.backToProfile")}</AppButton>
          </Link>
        </div>
      </main>
    );
  }

  if (artist.id === user.id) {
    return (
      <main className="min-h-screen bg-[#fdf8f6] p-4 sm:p-6">
        <div className="mx-auto max-w-lg rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <Notice type="error" message={t("booking.cannotBookSelf")} />
          <Link className="mt-4 inline-flex" href="/dashboard">
            <AppButton variant="secondary">{t("account.backDashboard")}</AppButton>
          </Link>
        </div>
      </main>
    );
  }

  const artistDisplayName =
    artist && isFeaturedDemoSlug(artist.username)
      ? featuredDemoArtistDisplayName(artist.username, language) ?? artist.username
      : artist?.username ?? "";

  const artistProfileHref =
    artist && isFeaturedDemoSlug(artist.username)
      ? `/spotlight/${encodeURIComponent(artist.username)}`
      : artist
        ? `/profile/${encodeURIComponent(artist.username)}`
        : "/";

  return (
    <BookingPageLayout>
      <SectionHeader
        eyebrow={t("booking.title")}
        title={artistDisplayName}
        subtitle={t("booking.subtitle")}
      />

      <div className="mt-8 border-t border-[var(--glamora-border)] pt-8">
        <BookingForm customerId={user.id} artistId={artist.id} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3 border-t border-[var(--glamora-border)] pt-6">
        <Link href={artistProfileHref}>
          <AppButton variant="secondary">{t("booking.backToProfile")}</AppButton>
        </Link>
        <Link href="/dashboard/customer/bookings">
          <AppButton variant="secondary">{t("booking.customerDashboardTitle")}</AppButton>
        </Link>
      </div>
    </BookingPageLayout>
  );
}
