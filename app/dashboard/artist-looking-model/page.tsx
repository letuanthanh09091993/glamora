"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RequireRole } from "@/components/auth/require-role";

export default function ArtistLookingModelDashboardPage() {
  return (
    <RequireRole role="artist_looking_model">
      <DashboardShell title="Casting Collaboration Center">
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Open Casting Requests" value="3 live posts" />
          <Card title="Saved Models" value="9 potential collaborators" />
          <Card title="New Conversations" value="2 unread threads" />
        </div>
        <Section
          title="Casting capabilities"
          items={[
            "Post casting requests with style, schedule, and location requirements",
            "Browse model portfolios and shortlist ideal collaboration matches",
            "Start direct conversations for campaign and editorial projects",
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
