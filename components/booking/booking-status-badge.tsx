"use client";



import type { BookingStatus } from "@/lib/booking-types";

import { useLanguage } from "@/components/providers/language-provider";

import { glamora } from "@/lib/ui/design-tokens";



const STATUS_STYLES: Record<string, string> = {

  pending: "bg-amber-50 text-amber-900 ring-amber-200/80",

  awaiting_artist_response: "bg-amber-50 text-amber-950 ring-amber-300/70",

  confirmed: "bg-emerald-50 text-emerald-900 ring-emerald-200/80",

  service_done: "bg-indigo-50 text-indigo-950 ring-indigo-200/80",

  awaiting_feedback: "bg-violet-50 text-violet-950 ring-violet-200/80",

  completed: "bg-sky-50 text-sky-950 ring-sky-200/80",

  rejected: "bg-red-50 text-red-800 ring-red-200/80",

  declined: "bg-red-50 text-red-800 ring-red-200/80",

  cancelled: "bg-gray-100 text-gray-700 ring-gray-200/80",

  cancelled_by_customer: "bg-gray-100 text-gray-700 ring-gray-200/80",

  cancelled_by_artist: "bg-gray-100 text-gray-800 ring-gray-300/80",

  refunded: "bg-[var(--glamora-rose-soft)] text-rose-900 ring-rose-200/80",

};



export function BookingStatusBadge({ status }: { status: BookingStatus }) {

  const { t } = useLanguage();

  const labelKey = `booking.status.${status}`;

  const label = t(labelKey);

  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 ring-slate-200/80";



  return (

    <span className={`${glamora.chip} ${style}`}>

      {label === labelKey ? status : label}

    </span>

  );

}


