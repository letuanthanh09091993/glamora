import { NextResponse } from "next/server";
import { generateDaySlots } from "@/lib/availability/slot-generator";
import {
  getAvailabilityBlocks,
  getAvailabilitySettings,
  getWeeklySchedules,
} from "@/lib/availability/availability-repository";
import { isActiveBookingStatus } from "@/lib/booking/booking-status";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";

export async function GET(
  request: Request,
  context: { params: Promise<{ artistId: string }> },
) {
  try {
    const { artistId } = await context.params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) {
      return NextResponse.json({ error: "Missing date query (YYYY-MM-DD)" }, { status: 400 });
    }

    const supabase = await createRouteSupabase();
    const [settings, weekly, blocks] = await Promise.all([
      getAvailabilitySettings(supabase, artistId),
      getWeeklySchedules(supabase, artistId),
      getAvailabilityBlocks(
        supabase,
        artistId,
        `${date}T00:00:00.000Z`,
        `${date}T23:59:59.999Z`,
      ),
    ]);

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const { data: bookings } = await supabase
      .from("bookings")
      .select("start_at, end_at, status")
      .eq("artist_id", artistId)
      .gte("start_at", dayStart.toISOString())
      .lte("start_at", dayEnd.toISOString());

    const existingBookings =
      bookings
        ?.filter((b) => isActiveBookingStatus(b.status as never))
        .map((b) => ({ startAt: String(b.start_at), endAt: String(b.end_at) })) ?? [];

    const slots = generateDaySlots({
      artistId,
      dateIso: date,
      settings,
      weekly,
      blocks,
      existingBookings,
    });

    return NextResponse.json({ date, artistId, settings, slots });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
