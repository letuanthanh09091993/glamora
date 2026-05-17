import type { SupabaseClient } from "@supabase/supabase-js";
import type { Booking, CreateBookingInput } from "@/lib/booking-types";
import type { BookingStatusDb } from "@/lib/booking/booking-status";
import type { PaymentStatus } from "@/lib/booking/payment-status";

export type BookingRow = Record<string, unknown>;

export function mapBookingRow(row: BookingRow): Booking {
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
    serviceId: row.service_id ? String(row.service_id) : undefined,
    status: row.status as BookingStatusDb,
    createdAt: String(row.created_at),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    bookingReferenceCode: row.booking_reference_code
      ? String(row.booking_reference_code)
      : undefined,
    cancellationReason: row.cancellation_reason ? String(row.cancellation_reason) : undefined,
    artistResponseAt: row.artist_response_at ? String(row.artist_response_at) : undefined,
    completedAt: row.completed_at ? String(row.completed_at) : undefined,
    paymentStatus:
      row.payment_status != null && row.payment_status !== ""
        ? (row.payment_status as PaymentStatus)
        : undefined,
    totalPrice: row.total_price != null ? Number(row.total_price) : undefined,
    platformFee: row.platform_fee != null ? Number(row.platform_fee) : undefined,
    currency: row.currency ? String(row.currency) : "VND",
    timezone: row.timezone ? String(row.timezone) : "Asia/Ho_Chi_Minh",
    customerRating:
      row.customer_rating != null && row.customer_rating !== ""
        ? Number(row.customer_rating)
        : undefined,
    customerFeedback: row.customer_feedback ? String(row.customer_feedback) : undefined,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : undefined,
  };
}

/** Core `public.bookings` columns only (production-safe insert). */
export function toInsertRow(
  input: CreateBookingInput,
  id: string,
  createdAt: string,
) {
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

/** Strip marketplace-only fields before PATCH/UPDATE on core schema. */
export function toBookingStatusUpdatePayload(patch: { status: BookingStatusDb }): {
  status: BookingStatusDb;
} {
  return { status: patch.status };
}

export async function insertBookingActivity(
  supabase: SupabaseClient,
  input: {
    bookingId: string;
    actorId: string | null;
    actorRole: string;
    fromStatus: string | null;
    toStatus: string;
    note?: string;
  },
): Promise<void> {
  const { error } = await supabase.from("booking_activity").insert({
    booking_id: input.bookingId,
    actor_id: input.actorId,
    actor_role: input.actorRole,
    from_status: input.fromStatus,
    to_status: input.toStatus,
    note: input.note ?? null,
  });
  if (error) {
    console.warn("[booking_activity] insert failed:", error.message);
  }
}

export async function checkBookingConflict(
  supabase: SupabaseClient,
  artistId: string,
  startAt: string,
  endAt: string,
  excludeBookingId?: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("booking_has_conflict", {
    p_artist_id: artistId,
    p_start_at: startAt,
    p_end_at: endAt,
    p_exclude_booking_id: excludeBookingId ?? null,
  });
  if (error) {
    console.warn("[booking_has_conflict] rpc failed:", error.message);
    return false;
  }
  return Boolean(data);
}
