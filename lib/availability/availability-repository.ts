import type { SupabaseClient } from "@supabase/supabase-js";
import { checkBookingConflict } from "@/lib/bookings/bookings-repository";
import { isActiveBookingStatus } from "@/lib/booking/booking-status";
import type { BookingStatusDb } from "@/lib/booking/booking-status";
import { dayBoundsUtc } from "@/lib/availability/timezone";
import type {
  AvailabilityBlock,
  DayBooking,
  WeeklySchedule,
} from "@/lib/availability/availability-types";

/** Normalize Postgres `time` → `HH:mm` (slice(0,5) breaks values like `9:00:00` → `9:00:`). */
function formatTime(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const parts = raw.split(":");
  const hour = (parts[0] ?? "00").padStart(2, "0");
  const minute = (parts[1] ?? "00").slice(0, 2).padStart(2, "0");
  return `${hour}:${minute}`;
}

export async function getWeeklySchedules(
  supabase: SupabaseClient,
  artistId: string,
): Promise<WeeklySchedule[]> {
  const { data, error } = await supabase
    .from("artist_weekly_schedules")
    .select("id, artist_id, weekday, start_time, end_time, is_active")
    .eq("artist_id", artistId)
    .eq("is_active", true)
    .order("weekday")
    .order("start_time");

  if (error) {
    console.warn("[AVAILABILITY DEBUG] weekly schedules query error:", {
      artistId,
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return [];
  }

  console.log("[AVAILABILITY DEBUG] 3. raw weekly schedules from DB:", {
    artistId,
    rowCount: data?.length ?? 0,
    rows: (data ?? []).map((r) => ({
      id: r.id,
      artist_id: r.artist_id,
      weekday: r.weekday,
      start_time: r.start_time,
      start_time_type: typeof r.start_time,
      end_time: r.end_time,
      end_time_type: typeof r.end_time,
      is_active: r.is_active,
    })),
  });

  const mapped = (data ?? []).map((row) => {
    const startTime = formatTime(row.start_time);
    const endTime = formatTime(row.end_time);
    console.log("[AVAILABILITY DEBUG] formatTime parse:", {
      id: row.id,
      rawStart: row.start_time,
      formattedStart: startTime,
      rawEnd: row.end_time,
      formattedEnd: endTime,
      legacySliceStart: String(row.start_time ?? "").slice(0, 5),
      legacySliceEnd: String(row.end_time ?? "").slice(0, 5),
    });
    return {
      id: String(row.id),
      artistId: String(row.artist_id),
      weekday: Number(row.weekday),
      startTime,
      endTime,
      isActive: Boolean(row.is_active),
    };
  });

  console.log("[AVAILABILITY DEBUG] mapped weekly schedules:", mapped);

  return mapped;
}

export async function getAvailabilityBlocksForDay(
  supabase: SupabaseClient,
  artistId: string,
  dateIso: string,
): Promise<AvailabilityBlock[]> {
  const { dayStartUtc, dayEndUtc } = dayBoundsUtc(dateIso);

  const { data, error } = await supabase
    .from("artist_availability_blocks")
    .select("id, artist_id, start_at, end_at, reason")
    .eq("artist_id", artistId)
    .gt("end_at", dayStartUtc)
    .lt("start_at", dayEndUtc);

  if (error) {
    console.warn("[availability] blocks:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    artistId: String(row.artist_id),
    start_at: String(row.start_at),
    end_at: String(row.end_at),
    reason: row.reason ? String(row.reason) : undefined,
  }));
}

/** Active bookings overlapping a calendar day (excludes cancelled / rejected). */
export async function getBookingsForDay(
  supabase: SupabaseClient,
  artistId: string,
  dateIso: string,
): Promise<DayBooking[]> {
  const { dayStartUtc, dayEndUtc } = dayBoundsUtc(dateIso);

  const { data, error } = await supabase
    .from("bookings")
    .select("id, start_at, end_at, status")
    .eq("artist_id", artistId)
    .lt("start_at", dayEndUtc)
    .gt("end_at", dayStartUtc);

  if (error) {
    console.warn("[availability] bookings:", error.message);
    return [];
  }

  return (data ?? [])
    .filter((row) => isActiveBookingStatus(String(row.status) as BookingStatusDb))
    .map((row) => ({
      id: String(row.id),
      start_at: String(row.start_at),
      end_at: String(row.end_at),
      status: String(row.status),
    }));
}

/** Authoritative overlap check via `public.booking_has_conflict` RPC. */
export async function hasBookingConflict(
  supabase: SupabaseClient,
  artistId: string,
  startAt: string,
  endAt: string,
  excludeBookingId?: string,
): Promise<boolean> {
  const conflict = await checkBookingConflict(
    supabase,
    artistId,
    startAt,
    endAt,
    excludeBookingId,
  );

  if (conflict) {
    console.log("[BOOKING CONFLICT]", { artistId, startAt, endAt });
  }

  return conflict;
}
