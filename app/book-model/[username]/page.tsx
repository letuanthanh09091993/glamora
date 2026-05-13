"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Notice } from "@/components/ui/notice";
import { AppButton } from "@/components/ui/app-button";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { getUserByUsername } from "@/lib/auth-storage";
import type { UserAccount } from "@/lib/auth-types";
import { ModelBookingForm } from "@/components/booking/model-booking-form";
import { AppRoutes } from "@/lib/app-routes";

export default function BookModelPage() {
  const params = useParams<{ username: string }>();
  const { user, isReady } = useAuth();
  const { t } = useLanguage();
  const [model, setModel] = useState<UserAccount | null | undefined>(undefined);

  useEffect(() => {
    if (!params.username) {
      setModel(null);
      return;
    }
    const raw = decodeURIComponent(params.username);
    setModel(getUserByUsername(raw) ?? null);
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
            <Link href={`${AppRoutes.login}?next=/book-model/${params.username}`} className="inline-flex">
              <AppButton>{t("common.login")}</AppButton>
            </Link>
            <Link href={AppRoutes.home} className="inline-flex">
              <AppButton variant="secondary">{t("common.backHome")}</AppButton>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (user.role !== "makeup_artist") {
    return (
      <main className="min-h-screen bg-[#fdf8f6] p-4 sm:p-6">
        <div className="mx-auto max-w-lg rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-black">{t("booking.title")}</h1>
          <Notice type="error" message={t("booking.wrongRole")} />
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={AppRoutes.home}>
              <AppButton variant="secondary">{t("home.navExplore")}</AppButton>
            </Link>
            <Link href={AppRoutes.dashboard}>
              <AppButton variant="secondary">{t("home.navDashboard")}</AppButton>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (model === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fdf8f6] p-6 text-sm text-gray-500">
        {t("common.loading")}
      </main>
    );
  }

  if (!model) {
    return (
      <main className="min-h-screen bg-[#fdf8f6] p-4 sm:p-6">
        <div className="mx-auto max-w-lg rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-black">{t("booking.title")}</h1>
          <Notice type="error" message={t("profile.notFound")} />
          <div className="mt-6">
            <Link href={AppRoutes.modelsIndex}>
              <AppButton variant="secondary">{t("modelsPage.title")}</AppButton>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fdf8f6] p-4 sm:p-6">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr,1.2fr]">
        <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">{t("booking.optionalModelLabel")}</p>
          <h1 className="mt-2 text-2xl font-bold text-black">{model.username}</h1>
          <p className="mt-2 text-sm text-gray-600">{model.collaborationPreferences || model.bio || t("home.modelCardFallback")}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={AppRoutes.modelsIndex}>
              <AppButton variant="secondary">{t("modelsPage.title")}</AppButton>
            </Link>
            <Link href={AppRoutes.dashboardMakeupArtistModelBookings}>
              <AppButton variant="secondary">{t("booking.withModel")}</AppButton>
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-black">{t("booking.title")}</h2>
          <p className="mt-2 text-sm text-gray-600">{t("booking.subtitle")}</p>
          <div className="mt-6">
            <ModelBookingForm artistId={user.id} modelId={model.id} />
          </div>
        </div>
      </div>
    </main>
  );
}

