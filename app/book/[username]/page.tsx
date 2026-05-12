"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BookingForm } from "@/components/booking/booking-form";
import { Notice } from "@/components/ui/notice";
import { AppButton } from "@/components/ui/app-button";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { getUserByUsername } from "@/lib/auth-storage";
import { UserAccount } from "@/lib/auth-types";

export default function BookArtistPage() {
  const params = useParams<{ username: string }>();
  const { user, isReady } = useAuth();
  const { t } = useLanguage();
  const [artist, setArtist] = useState<UserAccount | null | undefined>(undefined);

  useEffect(() => {
    if (!params.username) {
      setArtist(null);
      return;
    }
    setArtist(getUserByUsername(params.username));
  }, [params.username]);

  if (!isReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fdf8f6] p-6 text-sm text-gray-500">
        {t("common.loading")}
      </main>
    );
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
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fdf8f6] p-6 text-sm text-gray-500">
        {t("common.loading")}
      </main>
    );
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

  if (!artist.isPublicProfile) {
    return (
      <main className="min-h-screen bg-[#fdf8f6] p-4 sm:p-6">
        <div className="mx-auto max-w-lg rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <Notice type="error" message={t("booking.privateArtist")} />
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

  return (
    <main className="min-h-screen bg-[#fdf8f6] p-4 sm:p-6">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-pink-500">{t("booking.title")}</p>
            <h1 className="text-3xl font-bold text-black">{artist.username}</h1>
            <p className="mt-2 text-sm text-gray-600">{t("booking.subtitle")}</p>
          </div>
        </div>

        <div className="mt-8">
          <BookingForm customerId={user.id} artistId={artist.id} />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/profile/${artist.username}`}>
            <AppButton variant="secondary">{t("booking.backToProfile")}</AppButton>
          </Link>
          <Link href="/dashboard/customer/bookings">
            <AppButton variant="secondary">{t("booking.customerDashboardTitle")}</AppButton>
          </Link>
        </div>
      </div>
    </main>
  );
}
