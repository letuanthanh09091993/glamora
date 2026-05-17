import type { BookingStatusDb } from "@/lib/booking/booking-status";
import type { PaymentStatus } from "@/lib/booking/payment-status";

/** @deprecated Use BOOKING_STATUSES_DB — kept for existing imports */
export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "service_done",
  "awaiting_feedback",
  "completed",
  "declined",
  "cancelled",
  "awaiting_artist_response",
  "rejected",
  "cancelled_by_customer",
  "cancelled_by_artist",
  "refunded",
] as const;

export type BookingStatus = BookingStatusDb;

export const BOOKING_SERVICE_TYPES = [
  "bridal",
  "party",
  "evening",
  "editorial",
  "event",
  "photoshoot",
  "other",
] as const;

export type BookingServiceType = (typeof BOOKING_SERVICE_TYPES)[number];

export type Booking = {
  id: string;
  customerId: string;
  artistId: string;
  modelId?: string;
  startAt: string;
  endAt: string;
  notes: string;
  address?: string;
  contactPhone?: string;
  serviceType?: string;
  serviceId?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt?: string;
  bookingReferenceCode?: string;
  cancellationReason?: string;
  artistResponseAt?: string;
  completedAt?: string;
  paymentStatus?: PaymentStatus;
  totalPrice?: number;
  platformFee?: number;
  currency?: string;
  timezone?: string;
  customerRating?: number;
  customerFeedback?: string;
  reviewedAt?: string;
};

export type CreateBookingInput = {
  customerId: string;
  artistId: string;
  modelId?: string;
  startAt: string;
  endAt: string;
  notes: string;
  address: string;
  contactPhone: string;
  serviceType: string;
  serviceId?: string;
  totalPrice?: number;
  timezone?: string;
};

export type BookingActivity = {
  id: string;
  bookingId: string;
  actorId: string | null;
  actorRole: string | null;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  createdAt: string;
};
