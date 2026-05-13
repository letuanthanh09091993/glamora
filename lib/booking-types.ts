export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "service_done",
  "awaiting_feedback",
  "completed",
  "declined",
  "cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

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
  startAt: string;
  endAt: string;
  notes: string;
  /** On-site / service location */
  address?: string;
  /** Phone for this appointment */
  contactPhone?: string;
  /** Service category id (`booking.serviceTypes.*`) */
  serviceType?: string;
  status: BookingStatus;
  createdAt: string;
  /** 1–5 after customer completes review step */
  customerRating?: number;
  customerFeedback?: string;
  reviewedAt?: string;
};

export type CreateBookingInput = {
  customerId: string;
  artistId: string;
  startAt: string;
  endAt: string;
  notes: string;
  address: string;
  contactPhone: string;
  serviceType: string;
};
