"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RequireRole } from "@/components/auth/require-role";
import { useLanguage } from "@/components/providers/language-provider";

export default function CustomerDashboardPage() {
  const { t } = useLanguage();

  return (
    <RequireRole role="customer">
      <DashboardShell title={t("dashboard.customerTitle")}>
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
