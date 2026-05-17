"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { AppButton } from "@/components/ui/app-button";
import { BookingStatusBadge } from "@/components/booking/booking-status-badge";
import { getBookingsForCustomer } from "@/lib/booking-storage";
import { getBrowserSupabase } from "@/lib/supabase/browser-client";
import { fetchUsernameMap } from "@/lib/supabase/users-repository";
import { BOOKING_STATUSES, type Booking, type BookingStatus } from "@/lib/booking-types";

export default function CustomerDashboardPage() {
  const { t } = useLanguage();

  return (
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
        <CustomerBookingStats />
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

function CustomerBookingStats() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [nameMap, setNameMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const sb = getBrowserSupabase();
      const list = await getBookingsForCustomer(user.id);
      setBookings(list);
      const ids = [...new Set(list.map((b) => b.artistId))];
      setNameMap(await fetchUsernameMap(sb, ids));
    })();
  }, [user]);

  const counts = useMemo(() => {
    const c = {} as Record<BookingStatus, number>;
    for (const s of BOOKING_STATUSES) c[s] = 0;
    for (const b of bookings) {
      c[b.status] += 1;
    }
    return c;
  }, [bookings]);

  const resolveArtist = useMemo(() => (id: string) => nameMap.get(id) ?? id, [nameMap]);

  const recent = useMemo(() => bookings.slice(0, 10), [bookings]);
  const locale = language === "VN" ? "vi-VN" : "en-US";

  return (
    <div className="mt-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-black">{t("dashboard.customerBookingStats.title")}</h2>
        <p className="mt-1 text-sm text-gray-600">{t("dashboard.customerBookingStats.subtitle")}</p>
      </div>

      {bookings.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">{t("dashboard.customerBookingStats.empty")}</p>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-black/10">
            <table className="w-full min-w-[280px] text-left text-sm">
              <caption className="border-b border-black/10 bg-[#fdf8f6] px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                {t("dashboard.customerBookingStats.byStatusTitle")}
              </caption>
              <thead className="border-b border-black/10 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3">{t("dashboard.customerBookingStats.statusCol")}</th>
                  <th className="px-4 py-3 text-right">{t("dashboard.customerBookingStats.countCol")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {BOOKING_STATUSES.map((status) => (
                  <tr key={status} className="bg-white">
                    <td className="px-4 py-2.5 text-gray-800">{t(`booking.status.${status}`)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">{counts[status]}</td>
                  </tr>
                ))}
                <tr className="bg-[#fdf8f6] font-semibold text-black">
                  <td className="px-4 py-3">{t("dashboard.customerBookingStats.totalLabel")}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{bookings.length}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {recent.length > 0 ? (
            <div className="mt-8 overflow-x-auto rounded-2xl border border-black/10">
              <table className="w-full min-w-[360px] text-left text-sm">
                <caption className="border-b border-black/10 bg-[#fdf8f6] px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {t("dashboard.customerBookingStats.recentTitle")}
                </caption>
                <thead className="border-b border-black/10 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="px-4 py-3">{t("dashboard.customerBookingStats.whenCol")}</th>
                    <th className="px-4 py-3">{t("dashboard.customerBookingStats.artistCol")}</th>
                    <th className="px-4 py-3">{t("dashboard.customerBookingStats.statusColShort")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {recent.map((b) => (
                    <tr key={b.id} className="bg-white">
                      <td className="whitespace-nowrap px-4 py-2.5 text-gray-800">
                        {new Date(b.startAt).toLocaleString(locale, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="max-w-[12rem] truncate px-4 py-2.5 text-gray-800">{resolveArtist(b.artistId)}</td>
                      <td className="px-4 py-2">
                        <BookingStatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
