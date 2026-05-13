"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RequireRole } from "@/components/auth/require-role";
import { useLanguage } from "@/components/providers/language-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { BookingStatusBadge } from "@/components/booking/booking-status-badge";
import { AppButton } from "@/components/ui/app-button";
import { Notice } from "@/components/ui/notice";
import {
  getArtistCompletedClientBookings,
  getBookingsForArtist,
  updateBookingStatus,
} from "@/lib/booking-storage";
import { getUsers } from "@/lib/auth-storage";
import { BOOKING_SERVICE_TYPES, Booking, BookingStatus } from "@/lib/booking-types";
import { BookingRequestMeta } from "@/components/booking/booking-request-meta";
import { AppRoutes } from "@/lib/app-routes";

export default function ArtistBookingsPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const pathname = usePathname();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [version, setVersion] = useState(0);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    setBookings(getBookingsForArtist(user.id).filter((b) => !(b.modelId && b.customerId === user.id)));
  }, [user, version]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const scrollToSection = () => {
      if (window.location.hash !== "#service-reviews") return;
      const el = document.getElementById("service-reviews");
      if (!el) return;
      const run = () => {
        if (!cancelled) el.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      requestAnimationFrame(() => requestAnimationFrame(run));
      window.setTimeout(run, 220);
    };
    scrollToSection();
    window.addEventListener("hashchange", scrollToSection);
    return () => {
      cancelled = true;
      window.removeEventListener("hashchange", scrollToSection);
    };
  }, [pathname, version]);

  const completedHistory = useMemo(() => {
    if (!user) return [];
    return getArtistCompletedClientBookings(user.id);
  }, [user, version]);

  const resolveName = useMemo(() => {
    const users = getUsers();
    const map = new Map(users.map((u) => [u.id, u.username]));
    return (id: string) => map.get(id) ?? id;
  }, [bookings, version]);

  const serviceTypeLabel = (b: Booking) => {
    const st = b.serviceType?.trim();
    if (!st) return null;
    return (BOOKING_SERVICE_TYPES as readonly string[]).includes(st) ? t(`booking.serviceTypes.${st}`) : st;
  };

  const formatSessionWhen = (iso: string) =>
    new Date(iso).toLocaleString(language === "VN" ? "vi-VN" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatReviewedAt = (iso: string | undefined) => {
    if (!iso) return null;
    return new Date(iso).toLocaleString(language === "VN" ? "vi-VN" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
    <RequireRole role="makeup_artist">
      <DashboardShell title={t("booking.artistDashboardTitle")} hideProfileCard>
        {notice ? (
          <div className="mb-4">
            <Notice type={notice.type} message={notice.message} />
          </div>
        ) : null}

        <section
          id="service-reviews"
          className="scroll-mt-28 rounded-3xl border border-black/10 bg-white p-4 shadow-sm sm:p-6"
        >
          <h2 className="text-lg font-semibold text-black">{t("booking.serviceHistoryTitle")}</h2>
          <p className="mt-1 text-sm text-gray-600">{t("booking.serviceHistorySubtitle")}</p>
          {completedHistory.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">{t("booking.serviceHistoryEmpty")}</p>
          ) : (
            <>
              <h3 className="mt-8 text-sm font-semibold text-black">{t("booking.serviceHistoryTableHeading")}</h3>
              <div className="mt-4 overflow-x-auto rounded-xl border border-black/5 bg-white">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/10 bg-[#fdf8f6] text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-2.5">{t("booking.serviceHistoryColWhen")}</th>
                      <th className="px-3 py-2.5">{t("booking.serviceHistoryColCustomer")}</th>
                      <th className="px-3 py-2.5">{t("booking.serviceHistoryColService")}</th>
                      <th className="px-3 py-2.5">{t("booking.serviceHistoryColLocation")}</th>
                      <th className="px-3 py-2.5">{t("booking.serviceHistoryColModel")}</th>
                      <th className="px-3 py-2.5">{t("booking.serviceHistoryColRating")}</th>
                      <th className="min-w-[160px] px-3 py-2.5">{t("booking.serviceHistoryColFeedback")}</th>
                      <th className="min-w-[120px] px-3 py-2.5">{t("booking.serviceHistoryColNotes")}</th>
                      <th className="px-3 py-2.5">{t("booking.serviceHistoryColReviewedAt")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedHistory.map((b) => (
                      <tr key={b.id} className="border-b border-black/5 last:border-0">
                        <td className="px-3 py-3 align-top text-gray-800">{formatSessionWhen(b.startAt)}</td>
                        <td className="px-3 py-3 align-top font-medium text-black">{resolveName(b.customerId)}</td>
                        <td className="px-3 py-3 align-top text-gray-800">
                          {serviceTypeLabel(b) ?? <span className="text-gray-400">—</span>}
                        </td>
                        <td className="max-w-[140px] px-3 py-3 align-top text-gray-700">
                          {b.address?.trim() ? (
                            <span className="line-clamp-3">{b.address.trim()}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top text-gray-800">
                          {b.modelId ? resolveName(b.modelId) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-3 py-3 align-top text-black">
                          {b.customerRating != null && b.customerRating > 0 ? (
                            <>★ {b.customerRating}/5</>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="max-w-[220px] px-3 py-3 align-top text-gray-700">
                          {b.customerFeedback?.trim() ? (
                            <span className="line-clamp-4 whitespace-pre-wrap">{b.customerFeedback.trim()}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="max-w-[160px] px-3 py-3 align-top text-gray-600">
                          {b.notes?.trim() ? (
                            <span className="line-clamp-3">{b.notes.trim()}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top text-xs text-gray-600">
                          {formatReviewedAt(b.reviewedAt) ?? <span className="text-gray-400">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <div className="mt-6">
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
                      {t("booking.withCustomer")}: {resolveName(b.customerId)}
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
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href={AppRoutes.dashboardMakeupArtist}
            className="inline-flex min-h-9 items-center justify-center rounded-full border border-black/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-black transition hover:bg-black hover:text-white"
          >
            {t("account.backDashboard")}
          </Link>
        </div>
      </DashboardShell>
    </RequireRole>
  );
}
