"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RequireRole } from "@/components/auth/require-role";

export default function ModelDashboardPage() {
  return (
    <RequireRole role="model">
      <DashboardShell title="Model Profile Hub">
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Portfolio" value="14 photos uploaded" />
          <Card title="Measurements" value="Profile details available" />
          <Card title="Collaboration Style" value="Open for beauty shoots" />
        </div>
        <Section
          title="Model capabilities"
          items={[
            "Maintain polished model profile and visuals",
            "Edit body measurements, style tags, and collaboration preferences",
            "Share private/public visibility controls for profile content",
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
