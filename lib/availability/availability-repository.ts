import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AvailabilityBlock,
  AvailabilitySettings,
  WeeklySchedule,
} from "@/lib/availability/availability-types";

const DEFAULT_SETTINGS: AvailabilitySettings = {
  userId: "",
  timezone: "Asia/Ho_Chi_Minh",
  slotDurationMinutes: 60,
  bufferMinutes: 15,
  bookingHorizonDays: 60,
};

export async function getAvailabilitySettings(
  supabase: SupabaseClient,
  userId: string,
): Promise<AvailabilitySettings> {
  const { data } = await supabase
    .from("artist_availability_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    return { ...DEFAULT_SETTINGS, userId };
  }

  return {
    userId,
    timezone: String(data.timezone ?? DEFAULT_SETTINGS.timezone),
    slotDurationMinutes: Number(data.slot_duration_minutes ?? 60),
    bufferMinutes: Number(data.buffer_minutes ?? 15),
    bookingHorizonDays: Number(data.booking_horizon_days ?? 60),
  };
}

export async function getWeeklySchedules(
  supabase: SupabaseClient,
  userId: string,
): Promise<WeeklySchedule[]> {
  const { data, error } = await supabase
    .from("artist_weekly_schedules")
    .select("*")
    .eq("user_id", userId)
    .order("day_of_week");

  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    dayOfWeek: Number(row.day_of_week),
    startTime: String(row.start_time).slice(0, 5),
    endTime: String(row.end_time).slice(0, 5),
    isActive: Boolean(row.is_active),
  }));
}

export async function getAvailabilityBlocks(
  supabase: SupabaseClient,
  userId: string,
  fromIso: string,
  toIso: string,
): Promise<AvailabilityBlock[]> {
  const { data, error } = await supabase
    .from("artist_availability_blocks")
    .select("*")
    .eq("user_id", userId)
    .gte("end_at", fromIso)
    .lte("start_at", toIso);

  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    startAt: String(row.start_at),
    endAt: String(row.end_at),
    reason: row.reason ? String(row.reason) : undefined,
  }));
}
