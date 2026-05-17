"use client";

import { getBrowserSupabase } from "@/lib/supabase/browser-client";
import type { Booking, BookingStatus, CreateBookingInput } from "@/lib/booking-types";
import type { BookingStatusDb } from "@/lib/booking/booking-status";
import type { UserRole } from "@/lib/auth-types";
import {
  validateBookingFeedbackTransition,
  validateBookingTransition,
} from "@/lib/booking/booking-engine";
import {
  checkBookingConflict,
  insertBookingActivity,
  mapBookingRow,
  toInsertRow,
} from "@/lib/bookings/bookings-repository";
import {
  notificationEventForStatusTransition,
  queueBookingNotification,
} from "@/lib/notifications/booking-notifications";

const DELIVERED_STATUSES: BookingStatusDb[] = ["service_done", "awaiting_feedback", "completed"];

export async function getBookingsForCustomer(customerId: string): Promise<Booking[]> {
  const sb = getBrowserSupabase();
  const { data, error } = await sb
    .from("bookings")
    .select("*")
    .eq("customer_id", customerId)
    .order("start_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => mapBookingRow(row as Record<string, unknown>));
}

export async function getBookingsForArtist(artistId: string): Promise<Booking[]> {
  const sb = getBrowserSupabase();
  const { data, error } = await sb
    .from("bookings")
    .select("*")
    .eq("artist_id", artistId)
    .order("start_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => mapBookingRow(row as Record<string, unknown>));
}

export async function getBookingsForModel(modelId: string): Promise<Booking[]> {
  const sb = getBrowserSupabase();
  const { data, error } = await sb
    .from("bookings")
    .select("*")
    .eq("model_id", modelId)
    .order("start_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => mapBookingRow(row as Record<string, unknown>));
}

export async function getBookingById(bookingId: string): Promise<Booking | null> {
  const sb = getBrowserSupabase();
  const { data, error } = await sb.from("bookings").select("*").eq("id", bookingId).maybeSingle();
  if (error || !data) return null;
  return mapBookingRow(data as Record<string, unknown>);
}

export async function getBookingActivity(bookingId: string) {
  const sb = getBrowserSupabase();
  const { data, error } = await sb
    .from("booking_activity")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => ({
    id: String(row.id),
    bookingId: String(row.booking_id),
    actorId: row.actor_id ? String(row.actor_id) : null,
    actorRole: row.actor_role ? String(row.actor_role) : null,
    fromStatus: row.from_status ? String(row.from_status) : null,
    toStatus: String(row.to_status),
    note: row.note ? String(row.note) : null,
    createdAt: String(row.created_at),
  }));
}

/** Admin console: all bookings (RLS allows when caller is admin). */
export async function getAllBookingsForAdmin(): Promise<Booking[]> {
  const sb = getBrowserSupabase();
  const { data, error } = await sb
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error || !data) return [];
  return data.map((row) => mapBookingRow(row as Record<string, unknown>));
}

export async function getArtistClientBookings(artistId: string): Promise<Booking[]> {
  const all = await getBookingsForArtist(artistId);
  return all.filter((b) => !(b.modelId && b.customerId === artistId));
}

export async function getArtistDeliveredSessionStats(artistId: string): Promise<{
  sessionsDelivered: number;
  uniqueCustomers: number;
}> {
  const delivered = (await getArtistClientBookings(artistId)).filter((b) =>
    DELIVERED_STATUSES.includes(b.status),
  );
  return {
    sessionsDelivered: delivered.length,
    uniqueCustomers: new Set(delivered.map((b) => b.customerId)).size,
  };
}

export async function getArtistCompletedClientBookings(artistId: string): Promise<Booking[]> {
  return (await getArtistClientBookings(artistId))
    .filter((b) => b.status === "completed")
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
}

export function averageCustomerRatingFromBookings(bookings: Booking[]): number | null {
  const rated = bookings.filter((b) => b.customerRating != null && b.customerRating > 0);
  if (!rated.length) return null;
  const sum = rated.reduce((acc, b) => acc + (b.customerRating ?? 0), 0);
  return Math.round((sum / rated.length) * 10) / 10;
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const sb = getBrowserSupabase();
  const hasConflict = await checkBookingConflict(sb, input.artistId, input.startAt, input.endAt);
  if (hasConflict) {
    throw new Error("BOOKING_SLOT_UNAVAILABLE");
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const row = toInsertRow(input, id, createdAt, {
    totalPrice: input.totalPrice,
    serviceId: input.serviceId,
    timezone: input.timezone,
  });
  const { data, error } = await sb.from("bookings").insert(row).select("*").single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create booking");
  }

  const booking = mapBookingRow(data as Record<string, unknown>);

  await insertBookingActivity(sb, {
    bookingId: booking.id,
    actorId: input.customerId,
    actorRole: "customer",
    fromStatus: null,
    toStatus: booking.status,
    note: "booking.created",
  });

  void queueBookingNotification(sb, {
    userId: input.artistId,
    eventType: "booking.created",
    payload: { bookingId: booking.id, startAt: booking.startAt },
  });

  return booking;
}

type StatusUpdateResult =
  | { ok: true }
  | {
      ok: false;
      messageKey:
        | "booking.errors.notFound"
        | "booking.errors.invalidTransition"
        | "booking.errors.invalidReview"
        | "booking.errors.slotUnavailable";
    };

export async function updateBookingStatus(
  bookingId: string,
  next: BookingStatus,
  actor: { id: string; role: UserRole },
  options?: { cancellationReason?: string },
): Promise<StatusUpdateResult> {
  const sb = getBrowserSupabase();
  const { data: row, error: fetchErr } = await sb.from("bookings").select("*").eq("id", bookingId).maybeSingle();
  if (fetchErr || !row) return { ok: false, messageKey: "booking.errors.notFound" };

  const booking = mapBookingRow(row as Record<string, unknown>);
  const validation = validateBookingTransition(
    {
      id: booking.id,
      customerId: booking.customerId,
      artistId: booking.artistId,
      modelId: booking.modelId,
      status: booking.status,
    },
    next,
    actor,
    options,
  );

  if (!validation.ok) {
    return { ok: false, messageKey: validation.messageKey };
  }

  const { error } = await sb.from("bookings").update(validation.patch).eq("id", bookingId);
  if (error) return { ok: false, messageKey: "booking.errors.invalidTransition" };

  await insertBookingActivity(sb, {
    bookingId,
    actorId: actor.id,
    actorRole: actor.role,
    fromStatus: booking.status,
    toStatus: validation.patch.status,
    note: options?.cancellationReason,
  });

  const eventType = notificationEventForStatusTransition(booking.status, validation.patch.status);
  if (eventType) {
    const notifyIds = [booking.customerId, booking.artistId].filter((id) => id !== actor.id);
    for (const userId of notifyIds) {
      void queueBookingNotification(sb, {
        userId,
        eventType,
        payload: { bookingId, from: booking.status, to: validation.patch.status },
      });
    }
  }

  return { ok: true };
}

export async function submitBookingFeedback(
  bookingId: string,
  actor: { id: string; role: UserRole },
  input: { rating: number; feedback: string },
): Promise<StatusUpdateResult> {
  if (actor.role !== "customer") {
    return { ok: false, messageKey: "booking.errors.invalidTransition" };
  }
  const rating = Number(input.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, messageKey: "booking.errors.invalidReview" };
  }

  const sb = getBrowserSupabase();
  const { data: row, error: fetchErr } = await sb.from("bookings").select("*").eq("id", bookingId).maybeSingle();
  if (fetchErr || !row) return { ok: false, messageKey: "booking.errors.notFound" };

  const booking = mapBookingRow(row as Record<string, unknown>);
  const validation = validateBookingFeedbackTransition(
    {
      id: booking.id,
      customerId: booking.customerId,
      artistId: booking.artistId,
      modelId: booking.modelId,
      status: booking.status,
    },
    actor,
  );

  if (!validation.ok) {
    return { ok: false, messageKey: validation.messageKey };
  }

  const reviewedAt = new Date().toISOString();
  const { error } = await sb
    .from("bookings")
    .update({
      ...validation.patch,
      customer_rating: Math.round(rating),
      customer_feedback: input.feedback.trim(),
      reviewed_at: reviewedAt,
    })
    .eq("id", bookingId);

  if (error) return { ok: false, messageKey: "booking.errors.invalidTransition" };

  await insertBookingActivity(sb, {
    bookingId,
    actorId: actor.id,
    actorRole: actor.role,
    fromStatus: booking.status,
    toStatus: "completed",
    note: "review.submitted",
  });

  const { error: reviewErr } = await sb.from("reviews").upsert(
    {
      booking_id: bookingId,
      artist_id: booking.artistId,
      customer_id: booking.customerId,
      rating: Math.round(rating),
      body: input.feedback.trim(),
      status: "published",
    },
    { onConflict: "booking_id" },
  );
  if (reviewErr) {
    console.warn("[reviews] upsert failed:", reviewErr.message);
  } else {
    void sb.rpc("refresh_artist_review_aggregates", { p_artist_id: booking.artistId });
  }

  void queueBookingNotification(sb, {
    userId: booking.artistId,
    eventType: "booking.completed",
    payload: { bookingId, rating },
  });

  return { ok: true };
}
