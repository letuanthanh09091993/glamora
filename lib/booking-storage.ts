"use client";

import { Booking, BookingStatus, CreateBookingInput } from "@/lib/booking-types";
import { UserRole } from "@/lib/auth-types";
import { getUsers, saveUsers } from "@/lib/auth-storage";

const BOOKINGS_KEY = "glamora_bookings_v1";

function readBookings(): Booking[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(BOOKINGS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Booking[];
  } catch {
    return [];
  }
}

function writeBookings(bookings: Booking[]) {
  window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

function appendCustomerBookingId(customerId: string, bookingId: string) {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === customerId);
  if (index === -1) return;
  const history = users[index].bookingHistory ?? [];
  if (history.includes(bookingId)) return;
  users[index] = { ...users[index], bookingHistory: [...history, bookingId] };
  saveUsers(users);
}

export function listBookings(): Booking[] {
  return readBookings();
}

export function getBookingsForCustomer(customerId: string): Booking[] {
  return readBookings()
    .filter((b) => b.customerId === customerId)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
}

export function getBookingsForArtist(artistId: string): Booking[] {
  return readBookings()
    .filter((b) => b.artistId === artistId)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
}

export function createBooking(input: CreateBookingInput): Booking {
  const bookings = readBookings();
  const booking: Booking = {
    id: crypto.randomUUID(),
    ...input,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  bookings.push(booking);
  writeBookings(bookings);
  appendCustomerBookingId(input.customerId, booking.id);
  return booking;
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

export function updateBookingStatus(
  bookingId: string,
  next: BookingStatus,
  actor: { id: string; role: UserRole },
): StatusUpdateResult {
  const bookings = readBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) return { ok: false, messageKey: "booking.errors.notFound" };

  const booking = bookings[index];
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
  } else {
    return { ok: false, messageKey: "booking.errors.invalidTransition" };
  }

  bookings[index] = { ...booking, status: next };
  writeBookings(bookings);
  return { ok: true };
}

export function submitBookingFeedback(
  bookingId: string,
  actor: { id: string; role: UserRole },
  input: { rating: number; feedback: string },
): StatusUpdateResult {
  if (actor.role !== "customer") {
    return { ok: false, messageKey: "booking.errors.invalidTransition" };
  }
  const rating = Number(input.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, messageKey: "booking.errors.invalidReview" };
  }

  const bookings = readBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) return { ok: false, messageKey: "booking.errors.notFound" };

  const booking = bookings[index];
  if (booking.customerId !== actor.id) {
    return { ok: false, messageKey: "booking.errors.invalidTransition" };
  }
  if (booking.status !== "awaiting_feedback") {
    return { ok: false, messageKey: "booking.errors.invalidTransition" };
  }

  bookings[index] = {
    ...booking,
    status: "completed",
    customerRating: Math.round(rating),
    customerFeedback: input.feedback.trim(),
    reviewedAt: new Date().toISOString(),
  };
  writeBookings(bookings);
  return { ok: true };
}
