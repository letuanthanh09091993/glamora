"use client";

import { getBrowserSupabase } from "@/lib/supabase/browser-client";
import type { Booking, BookingStatus, CreateBookingInput } from "@/lib/booking-types";
import type { UserRole } from "@/lib/auth-types";

const DELIVERED_STATUSES: BookingStatus[] = ["service_done", "awaiting_feedback", "completed"];

function mapBookingRow(row: Record<string, unknown>): Booking {
  return {
    id: String(row.id),
    customerId: String(row.customer_id),
    artistId: String(row.artist_id),
    modelId: row.model_id ? String(row.model_id) : undefined,
    startAt: String(row.start_at),
    endAt: String(row.end_at),
    notes: String(row.notes ?? ""),
    address: row.address ? String(row.address) : undefined,
    contactPhone: row.contact_phone ? String(row.contact_phone) : undefined,
    serviceType: row.service_type ? String(row.service_type) : undefined,
    status: row.status as BookingStatus,
    createdAt: String(row.created_at),
    customerRating:
      row.customer_rating != null && row.customer_rating !== ""
        ? Number(row.customer_rating)
        : undefined,
    customerFeedback: row.customer_feedback ? String(row.customer_feedback) : undefined,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : undefined,
  };
}

function toInsertRow(input: CreateBookingInput, id: string, createdAt: string) {
  return {
    id,
    customer_id: input.customerId,
    artist_id: input.artistId,
    model_id: input.modelId ?? null,
    start_at: input.startAt,
    end_at: input.endAt,
    notes: input.notes,
    address: input.address,
    contact_phone: input.contactPhone,
    service_type: input.serviceType,
    status: "pending" as const,
    created_at: createdAt,
  };
}

export async function getBookingsForCustomer(customerId: string): Promise<Booking[]> {
  const sb = getBrowserSupabase();
  const { data, error } = await sb
    .from("bookings")
    .select("*")
    .eq("customer_id", customerId)
    .order("start_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapBookingRow);
}

export async function getBookingsForArtist(artistId: string): Promise<Booking[]> {
  const sb = getBrowserSupabase();
  const { data, error } = await sb
    .from("bookings")
    .select("*")
    .eq("artist_id", artistId)
    .order("start_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapBookingRow);
}

export async function getBookingsForModel(modelId: string): Promise<Booking[]> {
  const sb = getBrowserSupabase();
  const { data, error } = await sb
    .from("bookings")
    .select("*")
    .eq("model_id", modelId)
    .order("start_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapBookingRow);
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
  return data.map(mapBookingRow);
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
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const row = toInsertRow(input, id, createdAt);
  const { data, error } = await sb.from("bookings").insert(row).select("*").single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create booking");
  }
  return mapBookingRow(data as Record<string, unknown>);
}

type StatusUpdateResult =
  | { ok: true }
  | {
      ok: false;
      messageKey:
        | "booking.errors.notFound"
        | "booking.errors.invalidTransition"
        | "booking.errors.invalidReview";
    };

function canCustomerSetStatus(from: BookingStatus, to: BookingStatus): boolean {
  if (to === "awaiting_feedback") return from === "service_done";
  if (to !== "cancelled") return false;
  return from === "pending" || from === "confirmed";
}

function canArtistSetStatus(from: BookingStatus, to: BookingStatus): boolean {
  if (from === "pending" && (to === "confirmed" || to === "declined" || to === "cancelled")) return true;
  if (from === "confirmed" && (to === "service_done" || to === "cancelled")) return true;
  return false;
}

export async function updateBookingStatus(
  bookingId: string,
  next: BookingStatus,
  actor: { id: string; role: UserRole },
): Promise<StatusUpdateResult> {
  const sb = getBrowserSupabase();
  const { data: row, error: fetchErr } = await sb.from("bookings").select("*").eq("id", bookingId).maybeSingle();
  if (fetchErr || !row) return { ok: false, messageKey: "booking.errors.notFound" };

  const booking = mapBookingRow(row as Record<string, unknown>);
  const from = booking.status;

  if (from === next) return { ok: true };
  if (from === "declined" || from === "cancelled" || from === "completed") {
    return { ok: false, messageKey: "booking.errors.invalidTransition" };
  }

  if (actor.role === "customer" && booking.customerId === actor.id) {
    if (!canCustomerSetStatus(from, next)) {
      return { ok: false, messageKey: "booking.errors.invalidTransition" };
    }
  } else if (actor.role === "makeup_artist" && booking.artistId === actor.id) {
    if (!canArtistSetStatus(from, next)) {
      return { ok: false, messageKey: "booking.errors.invalidTransition" };
    }
  } else if (actor.role === "makeup_artist" && booking.customerId === actor.id && booking.modelId) {
    if (!canArtistSetStatus(from, next)) {
      return { ok: false, messageKey: "booking.errors.invalidTransition" };
    }
  } else if (actor.role === "model" && booking.modelId === actor.id) {
    if (!canArtistSetStatus(from, next)) {
      return { ok: false, messageKey: "booking.errors.invalidTransition" };
    }
  } else {
    return { ok: false, messageKey: "booking.errors.invalidTransition" };
  }

  const { error } = await sb.from("bookings").update({ status: next }).eq("id", bookingId);
  if (error) return { ok: false, messageKey: "booking.errors.invalidTransition" };
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
  if (booking.customerId !== actor.id) {
    return { ok: false, messageKey: "booking.errors.invalidTransition" };
  }
  if (booking.status !== "awaiting_feedback") {
    return { ok: false, messageKey: "booking.errors.invalidTransition" };
  }

  const reviewedAt = new Date().toISOString();
  const { error } = await sb
    .from("bookings")
    .update({
      status: "completed",
      customer_rating: Math.round(rating),
      customer_feedback: input.feedback.trim(),
      reviewed_at: reviewedAt,
    })
    .eq("id", bookingId);

  if (error) return { ok: false, messageKey: "booking.errors.invalidTransition" };
  return { ok: true };
}
