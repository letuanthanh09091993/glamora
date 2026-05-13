"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookingRequestMeta } from "@/components/booking/booking-request-meta";
import { BookingStatusBadge } from "@/components/booking/booking-status-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { AppButton } from "@/components/ui/app-button";
import { getUsers } from "@/lib/auth-storage";
import { AppRoutes } from "@/lib/app-routes";
import { getBookingsForArtist, updateBookingStatus } from "@/lib/booking-storage";
import type { Booking, BookingStatus } from "@/lib/booking-types";

export function HomeArtistPendingSection() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!user || user.role !== "makeup_artist") return;
    setBookings(getBookingsForArtist(user.id));
  }, [user, version]);

  const resolveName = useMemo(() => {
    const users = getUsers();
    const map = new Map(users.map((u) => [u.id, u.username]));
    return (id: string) => map.get(id) ?? id;
  }, [bookings, version]);

  const pending = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "pending")
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
        .slice(0, 3),
    [bookings],
  );

  function handleStatus(bookingId: string, next: BookingStatus) {
    if (!user) return;
    const result = updateBookingStatus(bookingId, next, { id: user.id, role: user.role });
    if (result.ok) setVersion((v) => v + 1);
  }

  const locale = language === "VN" ? "vi-VN" : "en-US";

  return (
    <section className="px-4 pb-12 sm:px-6" id="explore">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-pink-400">{t("home.feedEyebrow")}</p>
            <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{t("home.artistHomePendingHeading")}</h2>
            <Link
              href={AppRoutes.dashboardMakeupArtistBookings}
              className="mt-1 inline-block max-w-xl text-sm font-medium text-pink-600 underline-offset-4 hover:underline"
            >
              {t("home.artistHomePendingSeeAll")}
            </Link>
          </div>
          <Link
            href={AppRoutes.dashboardMakeupArtistBookings}
            className="self-start text-sm font-medium text-pink-600 underline-offset-4 hover:underline sm:self-auto"
          >
            {t("home.viewAll")}
          </Link>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-black/15 bg-white/80 p-8 text-center shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-gray-600">{t("home.artistHomePendingEmpty")}</p>
            <Link
              href={AppRoutes.dashboardMakeupArtistBookings}
              className="mt-4 inline-block text-sm font-semibold text-pink-600 hover:underline"
            >
              {t("home.artistHomePendingOpenDashboard")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            {pending.map((b) => (
              <article
                key={b.id}
                className="flex flex-col overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-pink-100 via-rose-50 to-pink-50 sm:aspect-[16/11]" />
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-black">{resolveName(b.customerId)}</h3>
                    <BookingStatusBadge status={b.status} />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {new Date(b.startAt).toLocaleString(locale, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <BookingRequestMeta booking={b} />
                  {b.notes ? (
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-gray-500">{b.notes}</p>
                  ) : (
                    <div className="min-h-[2.5rem] flex-1" />
                  )}
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
                    <AppButton className="min-h-[44px] flex-1 sm:min-w-0" onClick={() => handleStatus(b.id, "confirmed")}>
                      {t("booking.actions.confirm")}
                    </AppButton>
                    <AppButton
                      variant="secondary"
                      className="min-h-[44px] flex-1 sm:min-w-0"
                      onClick={() => handleStatus(b.id, "declined")}
                    >
                      {t("booking.actions.decline")}
                    </AppButton>
                    <Link
                      href={AppRoutes.dashboardMakeupArtistBookings}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-black/15 px-4 py-2 text-center text-xs font-semibold transition hover:bg-black hover:text-white sm:text-sm"
                    >
                      {t("home.artistHomePendingDetails")}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
