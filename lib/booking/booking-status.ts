/** All statuses stored in `public.bookings.status` (v2 + legacy). */
export const BOOKING_STATUSES_DB = [
  "pending",
  "awaiting_artist_response",
  "confirmed",
  "rejected",
  "cancelled_by_customer",
  "cancelled_by_artist",
  "completed",
  "refunded",
  "service_done",
  "awaiting_feedback",
  "declined",
  "cancelled",
] as const;

export type BookingStatusDb = (typeof BOOKING_STATUSES_DB)[number];

/** Canonical marketplace lifecycle phases for UI timeline. */
export const BOOKING_LIFECYCLE_PHASES = [
  "requested",
  "awaiting_response",
  "confirmed",
  "in_service",
  "awaiting_review",
  "completed",
  "closed_negative",
] as const;

export type BookingLifecyclePhase = (typeof BOOKING_LIFECYCLE_PHASES)[number];

export const TERMINAL_BOOKING_STATUSES: BookingStatusDb[] = [
  "rejected",
  "declined",
  "cancelled",
  "cancelled_by_customer",
  "cancelled_by_artist",
  "completed",
  "refunded",
];

export const ACTIVE_BOOKING_STATUSES: BookingStatusDb[] = [
  "pending",
  "awaiting_artist_response",
  "confirmed",
  "service_done",
  "awaiting_feedback",
];

export function isTerminalBookingStatus(status: BookingStatusDb): boolean {
  return TERMINAL_BOOKING_STATUSES.includes(status);
}

export function isActiveBookingStatus(status: BookingStatusDb): boolean {
  return ACTIVE_BOOKING_STATUSES.includes(status);
}

/** Map any DB status to a timeline phase (legacy-aware). */
export function bookingStatusToPhase(status: BookingStatusDb): BookingLifecyclePhase {
  switch (status) {
    case "pending":
    case "awaiting_artist_response":
      return status === "awaiting_artist_response" ? "awaiting_response" : "requested";
    case "confirmed":
      return "confirmed";
    case "service_done":
      return "in_service";
    case "awaiting_feedback":
      return "awaiting_review";
    case "completed":
      return "completed";
    case "rejected":
    case "declined":
    case "cancelled":
    case "cancelled_by_customer":
    case "cancelled_by_artist":
    case "refunded":
      return "closed_negative";
    default:
      return "requested";
  }
}

/** Normalize legacy action targets to v2 DB status on write. */
export function normalizeStatusForWrite(
  next: BookingStatusDb,
  actor: { role: string; id: string },
  booking: { customerId: string; artistId: string },
): BookingStatusDb {
  if (next === "declined") return "rejected";
  if (next === "cancelled") {
    if (actor.id === booking.customerId) return "cancelled_by_customer";
    if (actor.id === booking.artistId) return "cancelled_by_artist";
    return "cancelled_by_customer";
  }
  return next;
}

/** UI grouping: upcoming vs past tabs */
export function isUpcomingBookingStatus(status: BookingStatusDb): boolean {
  return ["pending", "awaiting_artist_response", "confirmed", "service_done", "awaiting_feedback"].includes(
    status,
  );
}
