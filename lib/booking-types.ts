export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "declined",
  "cancelled",
  "completed",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type Booking = {
  id: string;
  customerId: string;
  artistId: string;
  startAt: string;
  endAt: string;
  notes: string;
  status: BookingStatus;
  createdAt: string;
};

export type CreateBookingInput = {
  customerId: string;
  artistId: string;
  startAt: string;
  endAt: string;
  notes: string;
};
