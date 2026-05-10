"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RequireRole } from "@/components/auth/require-role";
import { useLanguage } from "@/components/providers/language-provider";

export default function ArtistLookingModelDashboardPage() {
  const { t } = useLanguage();

  return (
    <RequireRole role="artist_looking_model">
      <DashboardShell title={t("dashboard.castingTitle")}>
        <div className="grid gap-4 md:grid-cols-3">
          <Card title={t("dashboard.castingCards.openTitle")} value={t("dashboard.castingCards.openValue")} />
          <Card title={t("dashboard.castingCards.savedTitle")} value={t("dashboard.castingCards.savedValue")} />
          <Card title={t("dashboard.castingCards.messagesTitle")} value={t("dashboard.castingCards.messagesValue")} />
        </div>
        <Section
          title={t("dashboard.sectionCastingCapabilities")}
          items={[
            t("dashboard.castingItems.one"),
            t("dashboard.castingItems.two"),
            t("dashboard.castingItems.three"),
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
