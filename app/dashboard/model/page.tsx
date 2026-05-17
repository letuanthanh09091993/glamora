"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useLanguage } from "@/components/providers/language-provider";

export default function ModelDashboardPage() {
  const { t } = useLanguage();

  return (
          <DashboardShell title={t("dashboard.modelTitle")}>
        <div className="grid gap-4 md:grid-cols-3">
          <Card title={t("dashboard.modelCards.portfolioTitle")} value={t("dashboard.modelCards.portfolioValue")} />
          <Card title={t("dashboard.modelCards.measurementsTitle")} value={t("dashboard.modelCards.measurementsValue")} />
          <Card title={t("dashboard.modelCards.preferenceTitle")} value={t("dashboard.modelCards.preferenceValue")} />
        </div>
        <Section
          title={t("dashboard.sectionModelCapabilities")}
          items={[
            t("dashboard.modelItems.one"),
            t("dashboard.modelItems.two"),
            t("dashboard.modelItems.three"),
          ]}
        />
      </DashboardShell>
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
