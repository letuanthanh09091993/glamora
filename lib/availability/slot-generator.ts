import {
  GLAMORA_TIMEZONE,
  localDateTimeToUtcIso,
  weekdayInGlamoraTimezone,
} from "@/lib/availability/timezone";
import type {
  AvailabilityBlock,
  AvailabilitySlot,
  WeeklySchedule,
} from "@/lib/availability/availability-types";

export const DEFAULT_SLOT_INTERVAL_MINUTES = 30;

export type GenerateDaySlotsInput = {
  dateIso: string;
  timezone?: string;
  slotDurationMinutes: number;
  slotIntervalMinutes?: number;
  weekly: WeeklySchedule[];
  blocks: AvailabilityBlock[];
  existingBookings: { start_at: string; end_at: string }[];
  now?: Date;
};

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function slotOverlapsBreak(
  dateIso: string,
  slotStart: Date,
  slotEnd: Date,
  breakStart?: string,
  breakEnd?: string,
): boolean {
  if (!breakStart || !breakEnd) return false;
  const bStart = new Date(localDateTimeToUtcIso(dateIso, breakStart));
  const bEnd = new Date(localDateTimeToUtcIso(dateIso, breakEnd));
  return overlaps(slotStart, slotEnd, bStart, bEnd);
}

/**
 * Generates candidate booking slots for one calendar day.
 * Times are built in Asia/Ho_Chi_Minh and returned as UTC ISO strings.
 */
export function generateDaySlots(input: GenerateDaySlotsInput): AvailabilitySlot[] {
  const timezone = input.timezone ?? GLAMORA_TIMEZONE;
  void timezone;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dateIso)) {
    return [];
  }

  const slotDurationMs = input.slotDurationMinutes * 60_000;
  const slotIntervalMs =
    (input.slotIntervalMinutes ?? DEFAULT_SLOT_INTERVAL_MINUTES) * 60_000;

  if (slotDurationMs <= 0 || slotIntervalMs <= 0) {
    return [];
  }

  const weekday = weekdayInGlamoraTimezone(input.dateIso);
  const windows = input.weekly.filter((w) => w.isActive && w.weekday === weekday);

  console.log("[AVAILABILITY DEBUG] slot generation input:", {
    requestedDate: input.dateIso,
    computedWeekday: weekday,
    weeklyRowCount: input.weekly.length,
    weeklyWeekdays: input.weekly.map((w) => ({
      id: w.id,
      weekday: w.weekday,
      isActive: w.isActive,
      startTime: w.startTime,
      endTime: w.endTime,
    })),
    matchedWindows: windows.length,
    blockCount: input.blocks.length,
    bookingCount: input.existingBookings.length,
    slotDurationMinutes: input.slotDurationMinutes,
    slotIntervalMinutes: input.slotIntervalMinutes ?? DEFAULT_SLOT_INTERVAL_MINUTES,
    nowUtc: (input.now ?? new Date()).toISOString(),
  });

  if (!windows.length) {
    console.log("[AVAILABILITY DEBUG] no matching windows — slots will be empty", {
      requestedDate: input.dateIso,
      computedWeekday: weekday,
      hint: "DB weekday must match JS 0=Sun..6=Sat for this calendar date in Asia/Ho_Chi_Minh",
    });
    return [];
  }

  const now = input.now ?? new Date();
  const slots: AvailabilitySlot[] = [];
  let excludedPast = 0;
  let excludedBlocked = 0;
  let excludedBooked = 0;
  let excludedBreak = 0;

  console.log("[AVAILABILITY DEBUG] 4. matched windows count:", windows.length);

  for (const window of windows) {
    const startUtcIso = localDateTimeToUtcIso(input.dateIso, window.startTime);
    const endUtcIso = localDateTimeToUtcIso(input.dateIso, window.endTime);
    let cursorMs = new Date(startUtcIso).getTime();
    const windowEndMs = new Date(endUtcIso).getTime();

    console.log("[AVAILABILITY DEBUG] 5. parsed start/end timestamps:", {
      windowId: window.id,
      startTimeInput: window.startTime,
      endTimeInput: window.endTime,
      startUtcIso,
      endUtcIso,
      cursorMs,
      windowEndMs,
      cursorValid: Number.isFinite(cursorMs),
      endValid: Number.isFinite(windowEndMs),
      probe1970Start: window.startTime
        ? new Date(`1970-01-01T${window.startTime.length === 5 ? `${window.startTime}:00` : window.startTime}`).toString()
        : "n/a",
    });

    if (!Number.isFinite(cursorMs) || !Number.isFinite(windowEndMs)) {
      console.log("[AVAILABILITY DEBUG] invalid window time parse — skipping window", {
        requestedDate: input.dateIso,
        startTime: window.startTime,
        endTime: window.endTime,
      });
      continue;
    }

    while (cursorMs + slotDurationMs <= windowEndMs) {
      const slotStart = new Date(cursorMs);
      const slotEnd = new Date(cursorMs + slotDurationMs);

      let available = true;
      let reason: string | undefined;

      if (slotEnd.getTime() <= now.getTime()) {
        available = false;
        reason = "past";
        excludedPast += 1;
      }

      if (available && slotOverlapsBreak(input.dateIso, slotStart, slotEnd, window.breakStart, window.breakEnd)) {
        available = false;
        reason = "break";
        excludedBreak += 1;
      }

      if (available) {
        for (const block of input.blocks) {
          const bStart = new Date(block.start_at);
          const bEnd = new Date(block.end_at);
          if (overlaps(slotStart, slotEnd, bStart, bEnd)) {
            available = false;
            reason = block.reason ?? "blocked";
            excludedBlocked += 1;
            break;
          }
        }
      }

      if (available) {
        for (const booking of input.existingBookings) {
          const bStart = new Date(booking.start_at);
          const bEnd = new Date(booking.end_at);
          if (overlaps(slotStart, slotEnd, bStart, bEnd)) {
            available = false;
            reason = "booked";
            excludedBooked += 1;
            break;
          }
        }
      }

      const slot: AvailabilitySlot = {
        start_at: slotStart.toISOString(),
        end_at: slotEnd.toISOString(),
        available,
        reason,
      };

      slots.push(slot);

      if (available) {
        console.log("[SLOT GENERATED]", {
          date: input.dateIso,
          start_at: slot.start_at,
          end_at: slot.end_at,
        });
      }

      cursorMs += slotIntervalMs;
    }
  }

  const generatedAvailable = slots.filter((s) => s.available).length;

  console.log("[AVAILABILITY DEBUG] 6. generated slot count:", slots.length);
  console.log("[AVAILABILITY DEBUG] 7. excluded past slots:", excludedPast);
  console.log("[AVAILABILITY DEBUG] local exclusions:", {
    excludedBreak,
    excludedBlocked,
    excludedBooked,
    availableAfterLocalFilters: generatedAvailable,
  });
  console.log("[AVAILABILITY DEBUG] slot-generator summary:", {
    requestedDate: input.dateIso,
    computedWeekday: weekday,
    matchedWindows: windows.length,
    totalGenerated: slots.length,
    availableAfterLocalFilters: generatedAvailable,
  });

  return slots;
}
