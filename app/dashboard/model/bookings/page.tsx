"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { BookingCalendar } from "@/components/booking/booking-calendar";
import { BookingStatusBadge } from "@/components/booking/booking-status-badge";
import { AppButton } from "@/components/ui/app-button";
import { Notice } from "@/components/ui/notice";
import { getBookingsForModel, updateBookingStatus } from "@/lib/booking-storage";
import { getBrowserSupabase } from "@/lib/supabase/browser-client";
import { fetchUsernameMap } from "@/lib/supabase/users-repository";
import { Booking, BookingStatus } from "@/lib/booking-types";
import { BookingRequestMeta } from "@/components/booking/booking-request-meta";

export default function ModelBookingsPage() {
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
      const list = await getBookingsForModel(user.id);
      setBookings(list);
      const ids = [...new Set(list.flatMap((b) => [b.customerId, b.artistId, b.modelId].filter(Boolean) as string[]))];
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
          <DashboardShell title={t("booking.modelDashboardTitle")}>
        {notice ? (
          <div className="mb-4">
            <Notice type={notice.type} message={notice.message} />
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <BookingCalendar bookings={bookings} resolveName={resolveName} variant="model" />
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
                      {t("booking.withCustomer")}: {b.customerId === b.artistId ? resolveName(b.artistId) : resolveName(b.customerId)}
                    </p>
                    <p className="mt-1 text-xs text-gray-700">
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

                    {b.status === "pending" && user ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <AppButton onClick={() => handleStatus(b.id, "confirmed")}>
                          {t("booking.actions.confirm")}
                        </AppButton>
                        <AppButton variant="secondary" onClick={() => handleStatus(b.id, "declined")}>
                          {t("booking.actions.decline")}
                        </AppButton>
                        <AppButton variant="secondary" onClick={() => handleStatus(b.id, "cancelled")}>
                          {t("booking.actions.cancel")}
                        </AppButton>
                      </div>
                    ) : null}

                    {b.status === "confirmed" && user ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <AppButton onClick={() => handleStatus(b.id, "service_done")}>
                          {t("booking.actions.markServiceDone")}
                        </AppButton>
                        <AppButton variant="secondary" onClick={() => handleStatus(b.id, "cancelled")}>
                          {t("booking.actions.cancel")}
                        </AppButton>
                      </div>
                    ) : null}

                    {b.status === "service_done" || b.status === "awaiting_feedback" ? (
                      <p className="mt-3 text-xs text-gray-600">{t("booking.artistFlowWaitingCustomer")}</p>
                    ) : null}

                    {b.status === "completed" ? (
                      <div className="mt-3 rounded-xl border border-black/5 bg-white p-3 text-xs text-gray-700">
                        <p className="font-semibold text-black">{t("booking.customerReviewOnCard")}</p>
                        {b.customerRating != null ? (
                          <p className="mt-1">
                            ★ {b.customerRating}/5
                            {b.customerFeedback ? ` — ${b.customerFeedback}` : ""}
                          </p>
                        ) : (
                          <p className="mt-1 text-gray-500">—</p>
                        )}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <Link className="mt-6 inline-flex text-sm font-semibold text-pink-600 hover:underline" href="/account">
              {t("common.account")}
            </Link>
          </div>
        </div>
      </DashboardShell>
  );
}
