import type { AvailabilityBlock, AvailabilitySettings, TimeSlot, WeeklySchedule } from "@/lib/availability/availability-types";

const DEFAULT_SETTINGS: AvailabilitySettings = {
  userId: "",
  timezone: "Asia/Ho_Chi_Minh",
  slotDurationMinutes: 60,
  bufferMinutes: 15,
  bookingHorizonDays: 60,
};

type GenerateSlotsInput = {
  artistId: string;
  dateIso: string;
  settings?: Partial<AvailabilitySettings>;
  weekly: WeeklySchedule[];
  blocks: AvailabilityBlock[];
  existingBookings: { startAt: string; endAt: string }[];
};

function parseTimeOnDate(dateIso: string, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(`${dateIso}T00:00:00`);
  d.setHours(h, m ?? 0, 0, 0);
  return d;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Generates bookable slots for a single local calendar day.
 * Timezone-aware formatting is deferred to callers; dates are built in local env.
 */
export function generateDaySlots(input: GenerateSlotsInput): TimeSlot[] {
  const settings = { ...DEFAULT_SETTINGS, ...input.settings, userId: input.artistId };
  const day = new Date(input.dateIso);
  if (Number.isNaN(day.getTime())) return [];

  const dayOfWeek = day.getDay();
  const windows = input.weekly.filter((w) => w.isActive && w.dayOfWeek === dayOfWeek);
  if (!windows.length) return [];

  const slots: TimeSlot[] = [];
  const durationMs = settings.slotDurationMinutes * 60_000;
  const bufferMs = settings.bufferMinutes * 60_000;

  for (const window of windows) {
    let cursor = parseTimeOnDate(input.dateIso, window.startTime);
    const windowEnd = parseTimeOnDate(input.dateIso, window.endTime);

    while (cursor.getTime() + durationMs <= windowEnd.getTime()) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(cursor.getTime() + durationMs);

      let available = true;
      let reason: string | undefined;

      for (const block of input.blocks) {
        const bStart = new Date(block.startAt);
        const bEnd = new Date(block.endAt);
        if (overlaps(slotStart, slotEnd, bStart, bEnd)) {
          available = false;
          reason = block.reason ?? "blocked";
          break;
        }
      }

      if (available) {
        for (const booking of input.existingBookings) {
          const bStart = new Date(booking.startAt);
          const bEnd = new Date(booking.endAt);
          const paddedStart = new Date(bStart.getTime() - bufferMs);
          const paddedEnd = new Date(bEnd.getTime() + bufferMs);
          if (overlaps(slotStart, slotEnd, paddedStart, paddedEnd)) {
            available = false;
            reason = "booked";
            break;
          }
        }
      }

      slots.push({
        startAt: slotStart.toISOString(),
        endAt: slotEnd.toISOString(),
        available,
        reason,
      });

      cursor = new Date(cursor.getTime() + durationMs + bufferMs);
    }
  }

  return slots;
}
