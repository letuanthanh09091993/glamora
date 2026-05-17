"use client";

import type { Booking } from "@/lib/booking-types";
import { BOOKING_LIFECYCLE_PHASES, bookingStatusToPhase } from "@/lib/booking/booking-status";
import { useLanguage } from "@/components/providers/language-provider";

const PHASE_ORDER = BOOKING_LIFECYCLE_PHASES.filter((p) => p !== "closed_negative");

type Props = {
  booking: Booking;
  compact?: boolean;
};

export function BookingTimeline({ booking, compact = false }: Props) {
  const { t } = useLanguage();
  const currentPhase = bookingStatusToPhase(booking.status);
  const isClosedNegative = currentPhase === "closed_negative";

  const steps = isClosedNegative
    ? ([
        { key: "requested", done: true },
        { key: "closed_negative", done: true, active: true },
      ] as const)
    : PHASE_ORDER.map((phase) => ({
        key: phase,
        done:
          PHASE_ORDER.indexOf(phase) < PHASE_ORDER.indexOf(currentPhase) ||
          phase === currentPhase,
        active: phase === currentPhase,
      }));

  return (
    <ol
      className={`flex ${compact ? "flex-row flex-wrap gap-2" : "flex-col gap-3"} text-xs`}
      aria-label={t("booking.timeline.label")}
    >
      {steps.map((step) => {
        const isActive = "active" in step && step.active === true;
        const isDone = step.done;
        return (
        <li
          key={step.key}
          className={`flex items-center gap-2 ${
            isActive
              ? "font-semibold text-rose-700"
              : isDone
                ? "text-slate-600"
                : "text-slate-300"
          }`}
        >
          <span
            className={`flex h-2.5 w-2.5 shrink-0 rounded-full ${
              isActive
                ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                : isDone
                  ? "bg-emerald-400"
                  : "bg-slate-200"
            }`}
            aria-hidden
          />
          <span>{t(`booking.timeline.${step.key}`)}</span>
        </li>
      );
      })}
    </ol>
  );
}
