"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RequireRole } from "@/components/auth/require-role";

export default function MakeupArtistDashboardPage() {
  return (
    <RequireRole role="makeup_artist">
      <DashboardShell title="Makeup Artist Studio">
        <div className="grid gap-4 md:grid-cols-4">
          <Card title="Profile Completion" value="82%" />
          <Card title="Portfolio Assets" value="24 images · 3 videos" />
          <Card title="Average Rating" value="4.9 ★" />
          <Card title="Active Services" value="6 packages" />
        </div>
        <Section
          title="Artist capabilities"
          items={[
            "Manage avatar, portfolio photos, and short-form beauty reels",
            "Update makeup specialties, pricing, service details, and location",
            "Display public ratings and client reviews in profile page",
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
