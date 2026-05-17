export type WeeklySchedule = {
  id: string;
  artistId: string;
  /** 0 = Sunday .. 6 = Saturday (matches `artist_weekly_schedules.weekday`) */
  weekday: number;
  startTime: string;
  endTime: string;
  /** Optional lunch / break window within the day (HH:mm, local HCM) */
  breakStart?: string;
  breakEnd?: string;
  isActive: boolean;
};

export type AvailabilityBlock = {
  id: string;
  artistId: string;
  start_at: string;
  end_at: string;
  reason?: string;
};

export type DayBooking = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
};

export type AvailabilitySlot = {
  start_at: string;
  end_at: string;
  available: boolean;
  reason?: string;
};

export type AvailabilitySlotsResponse = {
  success: true;
  slots: AvailabilitySlot[];
};
