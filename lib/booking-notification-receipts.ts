"use client";

import { listBookings } from "@/lib/booking-storage";
import type { Booking } from "@/lib/booking-types";

const STORAGE_KEY = "glamora_booking_notif_receipts_v1";

type ReceiptFlags = {
  artistPendingSeen?: boolean;
  customerConfirmedSeen?: boolean;
  customerServiceDoneSeen?: boolean;
  artistAwaitingFeedbackSeen?: boolean;
};

function readReceipts(): Record<string, ReceiptFlags> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ReceiptFlags>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeReceipts(next: Record<string, ReceiptFlags>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function markBookingNotificationReceipts(
  bookingIds: string[],
  patch: Partial<ReceiptFlags>,
): void {
  if (typeof window === "undefined" || bookingIds.length === 0) return;
  const r = readReceipts();
  for (const id of bookingIds) {
    r[id] = { ...r[id], ...patch };
  }
  writeReceipts(r);
}

function sortBookingsDesc(a: Booking, b: Booking) {
  return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
}

/** Artist: unread pending + unread awaiting_feedback (client confirmed session). */
export function getArtistInboxBookings(artistUserId: string): Booking[] {
  const receipts = readReceipts();
  return listBookings()
    .filter((b) => {
      if (b.artistId !== artistUserId) return false;
      if (b.status === "pending" && !receipts[b.id]?.artistPendingSeen) return true;
      if (b.status === "awaiting_feedback" && !receipts[b.id]?.artistAwaitingFeedbackSeen) return true;
      return false;
    })
    .sort(sortBookingsDesc);
}

/** Customer: unread confirmed + unread service_done (artist marked done). */
export function getCustomerInboxBookings(customerUserId: string): Booking[] {
  const receipts = readReceipts();
  return listBookings()
    .filter((b) => {
      if (b.customerId !== customerUserId) return false;
      if (b.status === "confirmed" && !receipts[b.id]?.customerConfirmedSeen) return true;
      if (b.status === "service_done" && !receipts[b.id]?.customerServiceDoneSeen) return true;
      return false;
    })
    .sort(sortBookingsDesc);
}

export function markArtistInboxSeen(bookings: Booking[]): void {
  for (const b of bookings) {
    if (b.status === "pending") {
      markBookingNotificationReceipts([b.id], { artistPendingSeen: true });
    } else if (b.status === "awaiting_feedback") {
      markBookingNotificationReceipts([b.id], { artistAwaitingFeedbackSeen: true });
    }
  }
}

export function markCustomerInboxSeen(bookings: Booking[]): void {
  for (const b of bookings) {
    if (b.status === "confirmed") {
      markBookingNotificationReceipts([b.id], { customerConfirmedSeen: true });
    } else if (b.status === "service_done") {
      markBookingNotificationReceipts([b.id], { customerServiceDoneSeen: true });
    }
  }
}
