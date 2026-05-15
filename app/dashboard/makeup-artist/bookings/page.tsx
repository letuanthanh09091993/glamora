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
import { getBrowserSupabase } from "@/lib/supabase/browser-client";
import { fetchUsernameMap } from "@/lib/supabase/users-repository";
import { BOOKING_SERVICE_TYPES, Booking, BookingStatus } from "@/lib/booking-types";
import { BookingRequestMeta } from "@/components/booking/booking-request-meta";
import { AppRoutes } from "@/lib/app-routes";
import type { Language } from "@/lib/i18n";

function sortByStartAsc(a: Booking, b: Booking) {
  return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
}

function sortByStartDesc(a: Booking, b: Booking) {
  return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
}

type PipelineDemoVariant = "pending" | "confirmed" | "waitDone" | "waitReview" | "declined" | "cancelled" | "completed";

function ArtistPipelineDemoCard({
  variant,
  t,
  language,
}: {
  variant: PipelineDemoVariant;
  t: (key: string) => string;
  language: Language;
}) {
  const status: BookingStatus =
    variant === "pending"
      ? "pending"
      : variant === "confirmed"
        ? "confirmed"
        : variant === "waitDone"
          ? "service_done"
          : variant === "waitReview"
            ? "awaiting_feedback"
            : variant === "declined"
              ? "declined"
              : variant === "cancelled"
                ? "cancelled"
                : "completed";

  const booking: Booking = {
    id: `demo-${variant}`,
    customerId: "demo",
    artistId: "demo-artist",
    startAt: "2026-06-21T03:00:00.000Z",
    endAt: "2026-06-21T04:30:00.000Z",
    notes: t("booking.artistDemoNotes"),
    address: t("booking.artistDemoAddress"),
    contactPhone: t("booking.artistDemoPhone"),
    serviceType: "bridal",
    status,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...(variant === "completed"
      ? {
          customerRating: 5,
          customerFeedback: t("booking.artistDemoCompletedFeedback"),
          reviewedAt: "2026-06-22T10:00:00.000Z",
        }
      : {}),
  };

  const waitHint =
    status === "service_done"
      ? t("booking.artistStepWaitReviewHintServiceDone")
      : status === "awaiting_feedback"
        ? t("booking.artistStepWaitReviewHintAwaiting")
        : null;

  const dateStr = new Date(booking.startAt).toLocaleString(language === "VN" ? "vi-VN" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const ghost =
    "pointer-events-none inline-flex min-h-9 items-center justify-center rounded-full border border-black/20 bg-white px-3.5 py-1.5 text-xs font-semibold text-black opacity-55";
  const primary =
    "pointer-events-none inline-flex min-h-9 items-center justify-center rounded-full bg-black px-3.5 py-1.5 text-xs font-semibold text-white opacity-55";

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-black/25 bg-gradient-to-b from-white to-[#faf8f6] p-4 ring-1 ring-black/[0.04]">
      <p className="mb-3 inline-flex rounded-full bg-amber-100/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 ring-1 ring-amber-200/80">
        {t("booking.artistDemoBadge")}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <BookingStatusBadge status={booking.status} />
        <span className="text-xs text-gray-500">{dateStr}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-black">
        {t("booking.withCustomer")}: {t("booking.artistDemoCustomer")}
      </p>
      <p className="mt-1 text-xs text-gray-600">
        {t("booking.startTime")}:{" "}
        {new Date(booking.startAt).toLocaleTimeString(language === "VN" ? "vi-VN" : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        · {t("booking.endTime")}:{" "}
        {new Date(booking.endAt).toLocaleTimeString(language === "VN" ? "vi-VN" : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <BookingRequestMeta booking={booking} />
      <p className="mt-2 text-xs text-gray-600">{booking.notes}</p>

      {variant === "pending" ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={primary}>{t("booking.actions.confirm")}</span>
            <span className={ghost}>{t("booking.actions.decline")}</span>
            <span className={ghost}>{t("booking.actions.cancel")}</span>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-gray-500">{t("booking.artistDemoActionsNote")}</p>
        </>
      ) : null}

      {variant === "confirmed" ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={primary}>{t("booking.actions.markServiceDone")}</span>
            <span className={ghost}>{t("booking.actions.cancel")}</span>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-gray-500">{t("booking.artistDemoActionsNote")}</p>
        </>
      ) : null}

      {(variant === "waitDone" || variant === "waitReview") && waitHint ? (
        <p className="mt-3 rounded-xl border border-violet-100 bg-violet-50/80 px-3 py-2 text-xs leading-relaxed text-violet-950">
          {waitHint}
        </p>
      ) : null}
      {variant === "declined" || variant === "cancelled" ? (
        <p className="mt-3 text-xs leading-relaxed text-gray-600">{t("booking.artistDemoClosedNote")}</p>
      ) : null}
      {variant === "completed" ? (
        <p className="mt-3 text-xs leading-relaxed text-gray-600">{t("booking.artistDemoCompletedNote")}</p>
      ) : null}
    </div>
  );
}

export default function ArtistBookingsPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const pathname = usePathname();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [completedHistory, setCompletedHistory] = useState<Booking[]>([]);
  const [nameMap, setNameMap] = useState<Map<string, string>>(new Map());
  const [version, setVersion] = useState(0);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [pipelineTab, setPipelineTab] = useState<
    "pending" | "confirmed" | "wait" | "declined" | "completed"
  >("pending");

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const sb = getBrowserSupabase();
      const raw = await getBookingsForArtist(user.id);
      const filtered = raw.filter((b) => !(b.modelId && b.customerId === user.id));
      setBookings(filtered);
      const hist = await getArtistCompletedClientBookings(user.id);
      setCompletedHistory(hist);
      const ids = [
        ...new Set(
          [...filtered, ...hist].flatMap((b) => [b.customerId, b.modelId, b.artistId].filter(Boolean) as string[]),
        ),
      ];
      setNameMap(await fetchUsernameMap(sb, ids));
    })();
  }, [user, version]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let disposed = false;
    const scrollToSection = () => {
      if (window.location.hash !== "#service-reviews") return;
      const el = document.getElementById("service-reviews");
      if (!el) return;
      const run = () => {
        if (!disposed) el.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      requestAnimationFrame(() => requestAnimationFrame(run));
      window.setTimeout(run, 220);
    };
    scrollToSection();
    window.addEventListener("hashchange", scrollToSection);
    return () => {
      disposed = true;
      window.removeEventListener("hashchange", scrollToSection);
    };
  }, [pathname, version]);

  const resolveName = useMemo(() => (id: string) => nameMap.get(id) ?? id, [nameMap]);

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

  const groups = useMemo(() => {
    const pending = bookings.filter((b) => b.status === "pending").sort(sortByStartAsc);
    const confirmed = bookings.filter((b) => b.status === "confirmed").sort(sortByStartAsc);
    const waitReview = bookings
      .filter((b) => b.status === "service_done" || b.status === "awaiting_feedback")
      .sort(sortByStartAsc);
    const declined = bookings.filter((b) => b.status === "declined").sort(sortByStartDesc);
    const cancelled = bookings.filter((b) => b.status === "cancelled").sort(sortByStartDesc);
    const declinedAndCancelled = [...declined, ...cancelled].sort(sortByStartDesc);
    const completed = bookings.filter((b) => b.status === "completed").sort(sortByStartDesc);
    return { pending, confirmed, waitReview, declined, cancelled, declinedAndCancelled, completed };
  }, [bookings]);

  const snapshotText = useMemo(
    () =>
      t("booking.artistPipelineSnapshot")
        .replace("{pending}", String(groups.pending.length))
        .replace("{confirmed}", String(groups.confirmed.length))
        .replace("{wait}", String(groups.waitReview.length))
        .replace("{declined}", String(groups.declined.length))
        .replace("{cancelled}", String(groups.cancelled.length))
        .replace("{done}", String(completedHistory.length)),
    [groups, completedHistory.length, t],
  );

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

  const pipelineTabs = useMemo(
    () =>
      [
        { id: "pending" as const, count: groups.pending.length },
        { id: "confirmed" as const, count: groups.confirmed.length },
        { id: "wait" as const, count: groups.waitReview.length },
        { id: "declined" as const, count: groups.declinedAndCancelled.length },
        { id: "completed" as const, count: groups.completed.length },
      ] as const,
    [
      groups.pending.length,
      groups.confirmed.length,
      groups.waitReview.length,
      groups.declinedAndCancelled.length,
      groups.completed.length,
    ],
  );

  function renderBookingCard(b: Booking) {
    const waitHint =
      b.status === "service_done"
        ? t("booking.artistStepWaitReviewHintServiceDone")
        : b.status === "awaiting_feedback"
          ? t("booking.artistStepWaitReviewHintAwaiting")
          : null;

    return (
      <li
        key={b.id}
        className="rounded-2xl border border-black/10 bg-[#fdf8f6] p-4 shadow-sm ring-1 ring-black/[0.04]"
      >
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
            <AppButton size="sm" onClick={() => handleStatus(b.id, "confirmed")}>
              {t("booking.actions.confirm")}
            </AppButton>
            <AppButton size="sm" variant="secondary" onClick={() => handleStatus(b.id, "declined")}>
              {t("booking.actions.decline")}
            </AppButton>
            <AppButton size="sm" variant="secondary" onClick={() => handleStatus(b.id, "cancelled")}>
              {t("booking.actions.cancel")}
            </AppButton>
          </div>
        ) : null}

        {b.status === "confirmed" && user ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <AppButton size="sm" onClick={() => handleStatus(b.id, "service_done")}>
              {t("booking.actions.markServiceDone")}
            </AppButton>
            <AppButton size="sm" variant="secondary" onClick={() => handleStatus(b.id, "cancelled")}>
              {t("booking.actions.cancel")}
            </AppButton>
          </div>
        ) : null}

        {(b.status === "service_done" || b.status === "awaiting_feedback") && waitHint ? (
          <p className="mt-3 rounded-xl border border-violet-100 bg-violet-50/80 px-3 py-2 text-xs leading-relaxed text-violet-950">
            {waitHint}
          </p>
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
    );
  }

  function PipelineSection({
    step,
    title,
    hint,
    items,
    emptyKey,
    demos,
  }: {
    step: number;
    title: string;
    hint: string;
    items: Booking[];
    emptyKey: string;
    demos: PipelineDemoVariant[];
  }) {
    const countLabel = t("booking.artistSectionCount").replace("{n}", String(items.length));
    return (
      <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
            {step}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-black">
              {title}
              <span className="ml-2 whitespace-nowrap text-sm font-semibold tabular-nums text-gray-500">
                · {countLabel}
              </span>
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{hint}</p>
            {items.length === 0 ? (
              <>
                <p className="mt-4 text-sm text-gray-500">{t(emptyKey)}</p>
                {demos.length > 1 ? (
                  <p className="mt-3 text-xs font-semibold text-gray-700">{t("booking.artistDemoWaitIntro")}</p>
                ) : null}
                <div className={demos.length > 1 ? "mt-3 space-y-4" : ""}>
                  {demos.map((v) => (
                    <ArtistPipelineDemoCard key={v} variant={v} t={t} language={language} />
                  ))}
                </div>
              </>
            ) : (
              <ul className="mt-4 space-y-3">{items.map((b) => renderBookingCard(b))}</ul>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <RequireRole role="makeup_artist">
      <DashboardShell title={t("booking.artistDashboardTitle")} hideProfileCard>
        {notice ? (
          <div className="mb-4">
            <Notice type={notice.type} message={notice.message} />
          </div>
        ) : null}

        <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-black">{t("booking.artistPipelineTitle")}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">{t("booking.artistPipelineIntro")}</p>
          <p className="mt-4 rounded-2xl border border-pink-100/80 bg-gradient-to-r from-pink-50/80 to-rose-50/40 px-4 py-3 text-sm font-medium leading-relaxed text-gray-800 ring-1 ring-pink-100/60">
            {snapshotText}
          </p>

          <div
            role="tablist"
            aria-label={t("booking.artistPipelineTablistAria")}
            className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 xl:grid-cols-5 xl:gap-3 [&>button:last-child]:col-span-2 [&>button:last-child]:mx-auto [&>button:last-child]:w-full [&>button:last-child]:max-w-sm sm:[&>button:last-child]:col-span-1 sm:[&>button:last-child]:mx-0 sm:[&>button:last-child]:max-w-none"
          >
            {pipelineTabs.map((tab) => {
              const selected = pipelineTab === tab.id;
              const label =
                tab.id === "pending"
                  ? t("booking.artistPipelineTab1")
                  : tab.id === "confirmed"
                    ? t("booking.artistPipelineTab2")
                    : tab.id === "wait"
                      ? t("booking.artistPipelineTab3")
                      : tab.id === "declined"
                        ? t("booking.artistPipelineTab4")
                        : t("booking.artistPipelineTab5");
              return (
                <button
                  key={tab.id}
                  id={`pipeline-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="artist-pipeline-tabpanel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setPipelineTab(tab.id)}
                  className={`flex min-h-10 w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 rounded-full border px-2.5 py-2.5 text-center text-xs font-semibold leading-snug transition sm:min-h-11 sm:px-3 sm:text-sm ${
                    selected
                      ? "border-black bg-black text-white"
                      : "border-black/15 bg-white text-black hover:border-black/30 hover:bg-black/5"
                  }`}
                >
                  <span className="min-w-0">{label}</span>
                  <span className="shrink-0 tabular-nums opacity-80">({tab.count})</span>
                </button>
              );
            })}
          </div>

          <div
            id="artist-pipeline-tabpanel"
            role="tabpanel"
            aria-labelledby={`pipeline-tab-${pipelineTab}`}
            className="mt-5"
          >
            {pipelineTab === "pending" ? (
              <PipelineSection
                step={1}
                title={t("booking.artistStepRequestTitle")}
                hint={t("booking.artistStepRequestHint")}
                items={groups.pending}
                emptyKey="booking.artistStepRequestEmpty"
                demos={["pending"]}
              />
            ) : null}
            {pipelineTab === "confirmed" ? (
              <PipelineSection
                step={2}
                title={t("booking.artistStepUpcomingTitle")}
                hint={t("booking.artistStepUpcomingHint")}
                items={groups.confirmed}
                emptyKey="booking.artistStepUpcomingEmpty"
                demos={["confirmed"]}
              />
            ) : null}
            {pipelineTab === "wait" ? (
              <PipelineSection
                step={3}
                title={t("booking.artistStepWaitReviewTitle")}
                hint={t("booking.artistStepWaitReviewSectionHint")}
                items={groups.waitReview}
                emptyKey="booking.artistStepWaitReviewEmpty"
                demos={["waitDone", "waitReview"]}
              />
            ) : null}
            {pipelineTab === "declined" ? (
              <PipelineSection
                step={4}
                title={t("booking.artistStepDeclinedTitle")}
                hint={t("booking.artistStepDeclinedHint")}
                items={groups.declinedAndCancelled}
                emptyKey="booking.artistStepDeclinedEmpty"
                demos={["declined", "cancelled"]}
              />
            ) : null}
            {pipelineTab === "completed" ? (
              <PipelineSection
                step={5}
                title={t("booking.artistStepCompletedTitle")}
                hint={t("booking.artistStepCompletedHint")}
                items={groups.completed}
                emptyKey="booking.artistStepCompletedEmpty"
                demos={["completed"]}
              />
            ) : null}
          </div>
        </div>

        <section
          id="service-reviews"
          className="scroll-mt-28 mt-8 rounded-3xl border border-black/10 bg-white p-4 shadow-sm sm:p-6"
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
