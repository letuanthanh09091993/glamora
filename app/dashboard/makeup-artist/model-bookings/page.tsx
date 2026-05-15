"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RequireRole } from "@/components/auth/require-role";
import { useLanguage } from "@/components/providers/language-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { BookingCalendar } from "@/components/booking/booking-calendar";
import { BookingStatusBadge } from "@/components/booking/booking-status-badge";
import { AppButton } from "@/components/ui/app-button";
import { Notice } from "@/components/ui/notice";
import { getBookingsForArtist, updateBookingStatus } from "@/lib/booking-storage";
import { getBrowserSupabase } from "@/lib/supabase/browser-client";
import { fetchUsernameMap } from "@/lib/supabase/users-repository";
import type { Booking, BookingStatus } from "@/lib/booking-types";
import { BookingRequestMeta } from "@/components/booking/booking-request-meta";
import { AppRoutes } from "@/lib/app-routes";

function isArtistModelBooking(b: Booking, artistId: string): boolean {
  return Boolean(b.modelId) && b.artistId === artistId && b.customerId === artistId;
}

export default function ArtistModelBookingsPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [version, setVersion] = useState(0);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [nameMap, setNameMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const sb = getBrowserSupabase();
      const all = await getBookingsForArtist(user.id);
      const filtered = all.filter((b) => isArtistModelBooking(b, user.id));
      setBookings(filtered);
      const ids = [...new Set(filtered.flatMap((b) => [b.customerId, b.artistId, b.modelId].filter(Boolean) as string[]))];
      setNameMap(await fetchUsernameMap(sb, ids));
    })();
  }, [user, version]);

  const resolveName = useMemo(() => (id: string) => nameMap.get(id) ?? id, [nameMap]);

  async function handleStatus(bookingId: string, next: BookingStatus) {
    if (!user) return;
    const result = await updateBookingStatus(bookingId, next, { id: user.id, role: user.role });
    if (!result.ok) {
      setNotice({ type: "error", message: t(result.messageKey) });
      return;
    }
    setNotice(null);
    setVersion((v) => v + 1);
  }

  return (
    <RequireRole role="makeup_artist">
      <DashboardShell title={t("booking.artistDashboardTitle")}>
        {notice ? (
          <div className="mb-4">
            <Notice type={notice.type} message={notice.message} />
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href={AppRoutes.dashboardMakeupArtistBookings}
            className="rounded-full border border-black/15 bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-black hover:text-white"
          >
            {t("home.notifications.viewArtistBookings")}
          </Link>
          <span className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">
            {t("booking.withModel")}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <BookingCalendar bookings={bookings} resolveName={resolveName} variant="artist" />
          <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-black">{t("booking.listTitle")}</h2>
            {bookings.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">{t("booking.empty")}</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {bookings.map((b) => (
                  <li key={b.id} className="rounded-2xl border border-black/10 bg-[#fdf8f6] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <BookingStatusBadge status={b.status} />
                      <span className="text-xs text-gray-500">
                        {new Date(b.startAt).toLocaleString(language === "VN" ? "vi-VN" : "en-US", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-black">
                      {t("booking.withModel")}: {b.modelId ? resolveName(b.modelId) : "—"}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {t("booking.startTime")}:{" "}
                      {new Date(b.startAt).toLocaleTimeString(language === "VN" ? "vi-VN" : "en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {t("booking.endTime")}:{" "}
                      {new Date(b.endAt).toLocaleTimeString(language === "VN" ? "vi-VN" : "en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <BookingRequestMeta booking={b} />
                    {b.notes ? <p className="mt-2 text-xs text-gray-600">{b.notes}</p> : null}

                    {(b.status === "pending" || b.status === "confirmed") && user ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <AppButton variant="secondary" onClick={() => handleStatus(b.id, "cancelled")}>
                          {t("booking.actions.cancel")}
                        </AppButton>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <Link
              className="mt-6 inline-flex text-sm font-semibold text-pink-600 hover:underline"
              href={AppRoutes.modelsIndex}
            >
              {t("home.discoveryModelsCta")}
            </Link>
          </div>
        </div>
      </DashboardShell>
    </RequireRole>
  );
}

