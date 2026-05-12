"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RequireRole } from "@/components/auth/require-role";
import { useLanguage } from "@/components/providers/language-provider";
import { AppButton } from "@/components/ui/app-button";

export default function CustomerDashboardPage() {
  const { t } = useLanguage();

  return (
    <RequireRole role="customer">
      <DashboardShell title={t("dashboard.customerTitle")}>
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-pink-100 bg-gradient-to-r from-pink-50 to-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black">{t("dashboard.customerBookingPanel.title")}</h2>
            <p className="mt-1 text-sm text-gray-600">{t("dashboard.customerBookingPanel.body")}</p>
          </div>
          <Link href="/dashboard/customer/bookings">
            <AppButton>{t("dashboard.customerBookingPanel.cta")}</AppButton>
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card title={t("dashboard.customerCards.favoritesTitle")} value={t("dashboard.customerCards.favoritesValue")} />
          <Card title={t("dashboard.customerCards.historyTitle")} value={t("dashboard.customerCards.historyValue")} />
          <Card title={t("dashboard.customerCards.upcomingTitle")} value={t("dashboard.customerCards.upcomingValue")} />
        </div>
        <Section
          title={t("dashboard.sectionQuickActions")}
          items={[
            t("dashboard.customerItems.one"),
            t("dashboard.customerItems.two"),
            t("dashboard.customerItems.three"),
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
