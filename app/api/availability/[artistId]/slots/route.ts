import { NextResponse } from "next/server";
import { generateDaySlots } from "@/lib/availability/slot-generator";
import {
  getAvailabilityBlocksForDay,
  getBookingsForDay,
  getWeeklySchedules,
  hasBookingConflict,
} from "@/lib/availability/availability-repository";
import { GLAMORA_TIMEZONE, weekdayInGlamoraTimezone } from "@/lib/availability/timezone";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";

const MIN_DURATION = 15;
const MAX_DURATION = 480;

export async function GET(
  request: Request,
  context: { params: Promise<{ artistId: string }> },
) {
  try {
    const { artistId } = await context.params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const durationRaw = searchParams.get("duration_minutes");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid date (YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    const durationMinutes = durationRaw
      ? Number.parseInt(durationRaw, 10)
      : 60;

    if (
      !Number.isFinite(durationMinutes) ||
      durationMinutes < MIN_DURATION ||
      durationMinutes > MAX_DURATION
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `duration_minutes must be between ${MIN_DURATION} and ${MAX_DURATION}`,
        },
        { status: 400 },
      );
    }

    console.log("[AVAILABILITY REQUEST]", {
      artistId,
      date,
      duration_minutes: durationMinutes,
      timezone: GLAMORA_TIMEZONE,
    });

    const supabase = await createRouteSupabase();

    const computedWeekday = weekdayInGlamoraTimezone(date);

    console.log("[AVAILABILITY DEBUG] 1. requested date:", date);
    console.log("[AVAILABILITY DEBUG] 2. computed weekday:", {
      computedWeekday,
      legend: "0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat (Asia/Ho_Chi_Minh)",
      artistId,
      durationMinutes,
      serverNowUtc: new Date().toISOString(),
    });

    const [weekly, blocks, bookings] = await Promise.all([
      getWeeklySchedules(supabase, artistId),
      getAvailabilityBlocksForDay(supabase, artistId, date),
      getBookingsForDay(supabase, artistId, date),
    ]);

    console.log("[AVAILABILITY DEBUG] schedules found:", {
      weeklyCount: weekly.length,
      weeklyWeekdays: weekly.map((w) => w.weekday),
      blocksCount: blocks.length,
      activeBookingsCount: bookings.length,
    });

    const candidates = generateDaySlots({
      dateIso: date,
      timezone: GLAMORA_TIMEZONE,
      slotDurationMinutes: durationMinutes,
      weekly,
      blocks,
      existingBookings: bookings.map((b) => ({
        start_at: b.start_at,
        end_at: b.end_at,
      })),
    });

    let excludedConflict = 0;
    const excludedPastFromCandidates = candidates.filter((s) => s.reason === "past").length;

    const slots = await Promise.all(
      candidates.map(async (slot) => {
        if (!slot.available) {
          return {
            start_at: slot.start_at,
            end_at: slot.end_at,
            available: false,
          };
        }

        const conflict = await hasBookingConflict(
          supabase,
          artistId,
          slot.start_at,
          slot.end_at,
        );

        if (conflict) {
          excludedConflict += 1;
        }

        return {
          start_at: slot.start_at,
          end_at: slot.end_at,
          available: !conflict,
        };
      }),
    );

    const generatedCount = candidates.length;
    const availableCount = slots.filter((s) => s.available).length;

    console.log("[AVAILABILITY DEBUG] 7. excluded past slots (from generator):", excludedPastFromCandidates);
    console.log("[AVAILABILITY DEBUG] 8. excluded conflict slots (RPC):", excludedConflict);
    console.log("[AVAILABILITY DEBUG] 9. final slot count:", {
      totalReturned: slots.length,
      available: availableCount,
      unavailable: slots.length - availableCount,
    });
    console.log("[AVAILABILITY DEBUG] route summary:", {
      requestedDate: date,
      computedWeekday,
      generatedSlotsCount: generatedCount,
      finalSlotsCount: slots.length,
      availableAfterRpc: availableCount,
    });

    console.log("[AVAILABLE SLOT COUNT]", {
      artistId,
      date,
      total: slots.length,
      available: availableCount,
    });

    return NextResponse.json({ success: true, slots });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    console.error("[AVAILABILITY REQUEST] error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
