"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RequireRole } from "@/components/auth/require-role";
import { useLanguage } from "@/components/providers/language-provider";
import { AppButton } from "@/components/ui/app-button";

export default function MakeupArtistDashboardPage() {
  const { t } = useLanguage();

  return (
    <RequireRole role="makeup_artist">
      <DashboardShell title={t("dashboard.artistTitle")}>
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-pink-100 bg-gradient-to-r from-pink-50 to-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black">{t("dashboard.artistBookingPanel.title")}</h2>
            <p className="mt-1 text-sm text-gray-600">{t("dashboard.artistBookingPanel.body")}</p>
          </div>
          <Link href="/dashboard/makeup-artist/bookings">
            <AppButton>{t("dashboard.artistBookingPanel.cta")}</AppButton>
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Card title={t("dashboard.artistCards.completionTitle")} value={t("dashboard.artistCards.completionValue")} />
          <Card title={t("dashboard.artistCards.assetsTitle")} value={t("dashboard.artistCards.assetsValue")} />
          <Card title={t("dashboard.artistCards.ratingTitle")} value={t("dashboard.artistCards.ratingValue")} />
          <Card title={t("dashboard.artistCards.servicesTitle")} value={t("dashboard.artistCards.servicesValue")} />
        </div>
        <Section
          title={t("dashboard.sectionArtistCapabilities")}
          items={[
            t("dashboard.artistItems.one"),
            t("dashboard.artistItems.two"),
            t("dashboard.artistItems.three"),
          ]}
        />
      </DashboardShell>
    </RequireRole>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-lg font-semibold text-black">{value}</p>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-black">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-gray-600">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
