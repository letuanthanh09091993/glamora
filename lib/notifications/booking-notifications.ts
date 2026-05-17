import type { SupabaseClient } from "@supabase/supabase-js";
import type { BookingStatusDb } from "@/lib/booking/booking-status";

export const BOOKING_NOTIFICATION_EVENTS = [
  "booking.created",
  "booking.confirmed",
  "booking.rejected",
  "booking.cancelled",
  "booking.completed",
  "booking.reminder",
] as const;

export type BookingNotificationEvent = (typeof BOOKING_NOTIFICATION_EVENTS)[number];

type QueueInput = {
  userId: string;
  eventType: BookingNotificationEvent;
  payload: Record<string, unknown>;
  channel?: "in_app" | "email" | "push" | "sms";
};

/**
 * Outbox pattern — persists events for future email/push workers.
 * Safe no-op if table missing (logs warning).
 */
export async function queueBookingNotification(
  supabase: SupabaseClient,
  input: QueueInput,
): Promise<void> {
  const { error } = await supabase.from("notification_events").insert({
    user_id: input.userId,
    event_type: input.eventType,
    channel: input.channel ?? "in_app",
    payload: input.payload,
  });
  if (error) {
    console.warn("[notification_events] queue failed:", error.message);
  }
}

export function notificationEventForStatusTransition(
  from: BookingStatusDb,
  to: BookingStatusDb,
): BookingNotificationEvent | null {
  if (to === "confirmed") return "booking.confirmed";
  if (to === "rejected" || to === "declined") return "booking.rejected";
  if (
    to === "cancelled" ||
    to === "cancelled_by_customer" ||
    to === "cancelled_by_artist"
  ) {
    return "booking.cancelled";
  }
  if (to === "completed") return "booking.completed";
  if (from === "pending" && to === "pending") return "booking.created";
  return null;
}
