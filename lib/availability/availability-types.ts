export type WeeklySchedule = {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export type AvailabilityBlock = {
  id: string;
  userId: string;
  startAt: string;
  endAt: string;
  reason?: string;
};

export type AvailabilitySettings = {
  userId: string;
  timezone: string;
  slotDurationMinutes: number;
  bufferMinutes: number;
  bookingHorizonDays: number;
};

export type TimeSlot = {
  startAt: string;
  endAt: string;
  available: boolean;
  reason?: string;
};
