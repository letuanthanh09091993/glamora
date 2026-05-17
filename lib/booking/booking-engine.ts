import type { UserRole } from "@/lib/auth-types";
import {
  type BookingStatusDb,
  isTerminalBookingStatus,
  normalizeStatusForWrite,
} from "@/lib/booking/booking-status";

export type BookingTransitionActor = {
  id: string;
  role: UserRole;
};

export type BookingTransitionContext = {
  id: string;
  customerId: string;
  artistId: string;
  modelId?: string;
  status: BookingStatusDb;
};

export type BookingTransitionPatch = {
  status: BookingStatusDb;
  artist_response_at?: string;
  completed_at?: string;
  cancellation_reason?: string;
  updated_at: string;
};

export type TransitionValidationResult =
  | { ok: true; patch: BookingTransitionPatch }
  | { ok: false; messageKey: "booking.errors.notFound" | "booking.errors.invalidTransition" };

function canCustomerSetStatus(from: BookingStatusDb, to: BookingStatusDb): boolean {
  if (to === "awaiting_feedback") return from === "service_done";
  if (to === "cancelled_by_customer" || to === "cancelled") {
    return from === "pending" || from === "confirmed" || from === "awaiting_artist_response";
  }
  return false;
}

function canArtistSetStatus(from: BookingStatusDb, to: BookingStatusDb): boolean {
  if (from === "pending" || from === "awaiting_artist_response") {
    return to === "confirmed" || to === "rejected" || to === "declined" || to === "cancelled_by_artist" || to === "cancelled";
  }
  if (from === "confirmed") {
    return to === "service_done" || to === "cancelled_by_artist" || to === "cancelled";
  }
  return false;
}

function isParticipant(
  actor: BookingTransitionActor,
  booking: BookingTransitionContext,
): "customer" | "artist" | "model" | "admin" | null {
  if (actor.role === "admin") return "admin";
  if (booking.customerId === actor.id) return "customer";
  if (booking.artistId === actor.id) return "artist";
  if (booking.modelId && booking.modelId === actor.id) return "model";
  if (actor.role === "makeup_artist" && booking.customerId === actor.id && booking.modelId) {
    return "artist";
  }
  return null;
}

export function validateBookingTransition(
  booking: BookingTransitionContext,
  nextRaw: BookingStatusDb,
  actor: BookingTransitionActor,
  options?: { cancellationReason?: string },
): TransitionValidationResult {
  const from = booking.status;
  const next = normalizeStatusForWrite(nextRaw, actor, booking);

  if (from === next) {
    return { ok: true, patch: { status: next, updated_at: new Date().toISOString() } };
  }

  if (isTerminalBookingStatus(from)) {
    return { ok: false, messageKey: "booking.errors.invalidTransition" };
  }

  const participant = isParticipant(actor, booking);
  if (!participant) {
    return { ok: false, messageKey: "booking.errors.invalidTransition" };
  }

  if (participant === "admin") {
    const patch: BookingTransitionPatch = {
      status: next,
      updated_at: new Date().toISOString(),
    };
    if (next === "confirmed" || next === "rejected") {
      patch.artist_response_at = new Date().toISOString();
    }
    if (next === "completed") patch.completed_at = new Date().toISOString();
    if (options?.cancellationReason) patch.cancellation_reason = options.cancellationReason;
    return { ok: true, patch };
  }

  if (participant === "customer") {
    if (!canCustomerSetStatus(from, next)) {
      return { ok: false, messageKey: "booking.errors.invalidTransition" };
    }
  } else if (participant === "artist" || participant === "model") {
    if (!canArtistSetStatus(from, next)) {
      return { ok: false, messageKey: "booking.errors.invalidTransition" };
    }
  }

  const patch: BookingTransitionPatch = {
    status: next,
    updated_at: new Date().toISOString(),
  };

  if (next === "confirmed" || next === "rejected") {
    patch.artist_response_at = new Date().toISOString();
  }
  if (next === "completed") {
    patch.completed_at = new Date().toISOString();
  }
  if (
    (next === "cancelled_by_customer" || next === "cancelled_by_artist" || next === "cancelled") &&
    options?.cancellationReason
  ) {
    patch.cancellation_reason = options.cancellationReason.trim();
  }

  return { ok: true, patch };
}

export function validateBookingFeedbackTransition(
  booking: BookingTransitionContext,
  actor: BookingTransitionActor,
): TransitionValidationResult {
  if (actor.role !== "customer" || booking.customerId !== actor.id) {
    return { ok: false, messageKey: "booking.errors.invalidTransition" };
  }
  if (booking.status !== "awaiting_feedback") {
    return { ok: false, messageKey: "booking.errors.invalidTransition" };
  }
  return {
    ok: true,
    patch: {
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}
