"use client";

import type { BookingStatus } from "@/lib/booking-types";
import { useLanguage } from "@/components/providers/language-provider";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  awaiting_artist_response: "bg-amber-50 text-amber-900 ring-amber-300",
  confirmed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  service_done: "bg-indigo-50 text-indigo-900 ring-indigo-200",
  awaiting_feedback: "bg-violet-50 text-violet-900 ring-violet-200",
  completed: "bg-sky-50 text-sky-900 ring-sky-200",
  rejected: "bg-red-50 text-red-800 ring-red-200",
  declined: "bg-red-50 text-red-800 ring-red-200",
  cancelled: "bg-gray-100 text-gray-700 ring-gray-200",
  cancelled_by_customer: "bg-gray-100 text-gray-700 ring-gray-200",
  cancelled_by_artist: "bg-gray-100 text-gray-800 ring-gray-300",
  refunded: "bg-fuchsia-50 text-fuchsia-900 ring-fuchsia-200",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { t } = useLanguage();
  const labelKey = `booking.status.${status}`;
  const label = t(labelKey);
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      {label === labelKey ? status : label}
    </span>
  );
}
