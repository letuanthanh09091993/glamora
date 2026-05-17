"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { AdminSectionHeader } from "@/components/admin/admin-section-header";
import { BookingStatusBadge } from "@/components/booking/booking-status-badge";
import { BookingTimeline } from "@/components/booking/booking-timeline";
import { getAllBookingsForAdmin } from "@/lib/booking-storage";
import type { Booking } from "@/lib/booking-types";
import { useLanguage } from "@/components/providers/language-provider";

export function AdminBookingsManager() {
  const { t, language } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    void getAllBookingsForAdmin().then((rows) => {
      setBookings(rows);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  const selected = filtered.find((b) => b.id === selectedId) ?? filtered[0] ?? null;

  const statusCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookings) {
      map.set(b.status, (map.get(b.status) ?? 0) + 1);
    }
    return map;
  }, [bookings]);

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title={t("dashboard.adminBookings.title")}
        subtitle={t("dashboard.adminBookings.subtitle")}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("dashboard.adminBookings.total")} value={bookings.length} />
        <StatCard label={t("booking.status.pending")} value={statusCounts.get("pending") ?? 0} />
        <StatCard label={t("booking.status.confirmed")} value={statusCounts.get("confirmed") ?? 0} />
        <StatCard label={t("booking.status.completed")} value={statusCounts.get("completed") ?? 0} />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
          {t("dashboard.adminUsers.filterAll")}
        </FilterChip>
        {["pending", "confirmed", "awaiting_feedback", "completed", "cancelled", "rejected"].map(
          (s) => (
            <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
              {t(`booking.status.${s}` as never)}
              <span className="ml-1 text-slate-400">({statusCounts.get(s) ?? 0})</span>
            </FilterChip>
          ),
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">{t("gate.loadingSession")}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 overflow-hidden rounded-[1.75rem] border border-rose-100/80 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-rose-50 bg-rose-50/40 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">{t("dashboard.adminBookings.ref")}</th>
                    <th className="px-4 py-3">{t("booking.dateLabel")}</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedId(b.id)}
                      className={`cursor-pointer border-b border-slate-50 transition hover:bg-rose-50/30 ${
                        selected?.id === b.id ? "bg-rose-50/50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        {b.bookingReferenceCode ?? b.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Intl.DateTimeFormat(language === "VN" ? "vi-VN" : "en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(b.startAt))}
                      </td>
                      <td className="px-4 py-3">
                        <BookingStatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!filtered.length ? (
              <p className="p-6 text-sm text-slate-500">{t("booking.empty")}</p>
            ) : null}
          </div>

          <aside className="lg:col-span-2 rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm">
            {selected ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400">
                    {t("dashboard.adminBookings.detail")}
                  </p>
                  <p className="mt-1 font-mono text-sm text-slate-800">
                    {selected.bookingReferenceCode ?? selected.id}
                  </p>
                </div>
                <BookingStatusBadge status={selected.status} />
                <BookingTimeline booking={selected} compact />
                {selected.totalPrice != null ? (
                  <p className="text-sm text-slate-600">
                    {t("dashboard.adminBookings.total")}:{" "}
                    <span className="font-semibold text-slate-900">
                      {selected.totalPrice.toLocaleString()} {selected.currency ?? "VND"}
                    </span>
                  </p>
                ) : null}
                {selected.cancellationReason ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {selected.cancellationReason}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-500">{t("booking.selectDayPrompt")}</p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-rose-100/80 bg-white px-4 py-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active ? "bg-slate-900 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
