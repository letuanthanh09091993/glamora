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
import { getBookingsForCustomer, updateBookingStatus } from "@/lib/booking-storage";
import { getUsers } from "@/lib/auth-storage";
import { Booking, BookingStatus } from "@/lib/booking-types";
import { AppRoutes } from "@/lib/app-routes";
import { BookingRequestMeta } from "@/components/booking/booking-request-meta";
import { BookingReviewForm } from "@/components/booking/booking-review-form";

export default function CustomerBookingsPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [version, setVersion] = useState(0);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    setBookings(getBookingsForCustomer(user.id));
  }, [user, version]);

  const resolveName = useMemo(() => {
    const users = getUsers();
    const map = new Map(users.map((u) => [u.id, u.username]));
    return (id: string) => map.get(id) ?? id;
  }, [bookings, version]);

  function handleStatus(bookingId: string, next: BookingStatus) {
    if (!user) return;
    const result = updateBookingStatus(bookingId, next, { id: user.id, role: user.role });
    if (!result.ok) {
      setNotice({ type: "error", message: t(result.messageKey) });
      return;
    }
    setNotice(null);
    setVersion((v) => v + 1);
  }

  return (
    <RequireRole role="customer">
      <DashboardShell title={t("booking.customerDashboardTitle")}>
        {notice ? (
          <div className="mb-4">
            <Notice type={notice.type} message={notice.message} />
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <BookingCalendar bookings={bookings} resolveName={resolveName} variant="customer" />
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
                      {t("booking.withArtist")}: {resolveName(b.artistId)}
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
                      <div className="mt-3">
                        <AppButton variant="secondary" onClick={() => handleStatus(b.id, "cancelled")}>
                          {t("booking.actions.cancel")}
                        </AppButton>
                      </div>
                    ) : null}

                    {b.status === "service_done" && user ? (
                      <div className="mt-3">
                        <AppButton onClick={() => handleStatus(b.id, "awaiting_feedback")}>
                          {t("booking.actions.customerConfirmSession")}
                        </AppButton>
                      </div>
                    ) : null}

                    {b.status === "awaiting_feedback" && user ? (
                      <BookingReviewForm bookingId={b.id} onSubmitted={() => setVersion((v) => v + 1)} />
                    ) : null}

                    {b.status === "completed" && b.customerRating != null ? (
                      <div className="mt-3 rounded-xl border border-black/5 bg-white p-3 text-xs text-gray-700">
                        <p className="font-semibold text-black">{t("booking.customerReviewOnCard")}</p>
                        <p className="mt-1">
                          ★ {b.customerRating}/5
                          {b.customerFeedback ? ` — ${b.customerFeedback}` : ""}
                        </p>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <Link
              className="mt-6 inline-flex text-sm font-semibold text-pink-600 hover:underline"
              href={AppRoutes.artistsIndex}
            >
              {t("booking.goToArtistDirectory")}
            </Link>
          </div>
        </div>
      </DashboardShell>
    </RequireRole>
  );
}
