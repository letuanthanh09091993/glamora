"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RequireRole } from "@/components/auth/require-role";

export default function CustomerDashboardPage() {
  return (
    <RequireRole role="customer">
      <DashboardShell title="Customer Experience">
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Favorite Artists" value="12 saved" />
          <Card title="Booking History" value="4 completed bookings" />
          <Card title="Upcoming Appointments" value="1 scheduled this week" />
        </div>
        <Section
          title="Quick actions"
          items={[
            "Discover premium makeup artists by style and location",
            "Save favorites for faster re-booking",
            "Manage booking timeline and order details",
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
