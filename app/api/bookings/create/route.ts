import { NextResponse } from "next/server";
import { fetchDbAuthRow } from "@/lib/auth/fetch-db-auth-row";
import { checkBookingConflict } from "@/lib/bookings/bookings-repository";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";

const MIN_DURATION_MINUTES = 15;
const MAX_DURATION_MINUTES = 480;

type CreateBookingBody = {
  artistId?: string;
  customerId?: string;
  startAt?: string;
  endAt?: string;
  notes?: string;
  serviceIds?: string[];
  address?: string;
  contactPhone?: string;
  serviceType?: string;
  modelId?: string;
};

function parseIso(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateBookingBody;

    console.log("[BOOKING CREATE REQUEST]", {
      artistId: body.artistId,
      customerId: body.customerId,
      startAt: body.startAt,
      endAt: body.endAt,
      serviceIds: body.serviceIds,
    });

    const supabase = await createRouteSupabase();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const authRow = await fetchDbAuthRow(supabase, user.id);
    if (!authRow.row || authRow.row.account_status !== "active") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (authRow.row.role !== "customer") {
      return NextResponse.json(
        { success: false, error: "Only customers can create bookings" },
        { status: 403 },
      );
    }

    const artistId = body.artistId?.trim();
    const customerId = body.customerId?.trim();
    const startAt = body.startAt?.trim();
    const endAt = body.endAt?.trim();
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    if (!artistId || !customerId || !startAt || !endAt) {
      return NextResponse.json(
        { success: false, error: "Missing artistId, customerId, startAt, or endAt" },
        { status: 400 },
      );
    }

    if (customerId !== user.id) {
      return NextResponse.json(
        { success: false, error: "customerId must match authenticated user" },
        { status: 403 },
      );
    }

    if (artistId === customerId) {
      return NextResponse.json(
        { success: false, error: "Cannot book yourself" },
        { status: 400 },
      );
    }

    const start = parseIso(startAt);
    const end = parseIso(endAt);
    if (!start || !end) {
      return NextResponse.json(
        { success: false, error: "Invalid startAt or endAt" },
        { status: 400 },
      );
    }

    if (end.getTime() <= start.getTime()) {
      return NextResponse.json(
        { success: false, error: "endAt must be after startAt" },
        { status: 400 },
      );
    }

    const durationMinutes = (end.getTime() - start.getTime()) / 60_000;
    if (
      durationMinutes < MIN_DURATION_MINUTES ||
      durationMinutes > MAX_DURATION_MINUTES
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Duration must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} minutes`,
        },
        { status: 400 },
      );
    }

    const now = Date.now();
    if (end.getTime() <= now) {
      return NextResponse.json(
        { success: false, error: "Slot is in the past" },
        { status: 400 },
      );
    }

    const { data: artist, error: artistErr } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", artistId)
      .maybeSingle();

    if (artistErr || !artist) {
      return NextResponse.json(
        { success: false, error: "Artist not found" },
        { status: 404 },
      );
    }

    if (artist.role !== "makeup_artist") {
      return NextResponse.json(
        { success: false, error: "User is not a makeup artist" },
        { status: 400 },
      );
    }

    const hasConflict = await checkBookingConflict(supabase, artistId, startAt, endAt);
    if (hasConflict) {
      console.log("[BOOKING CONFLICT]", { artistId, startAt, endAt });
      return NextResponse.json(
        { success: false, error: "Slot unavailable" },
        { status: 409 },
      );
    }

    const bookingId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const serviceIds = Array.isArray(body.serviceIds)
      ? body.serviceIds.filter((id) => typeof id === "string" && id.trim())
      : [];
    const primaryServiceId = serviceIds[0] ?? null;

    const insertRow: Record<string, unknown> = {
      id: bookingId,
      customer_id: customerId,
      artist_id: artistId,
      model_id: body.modelId?.trim() || null,
      start_at: startAt,
      end_at: endAt,
      notes,
      status: "pending",
      payment_status: "unpaid",
      created_at: createdAt,
      address: body.address?.trim() || null,
      contact_phone: body.contactPhone?.trim() || null,
      service_type: body.serviceType?.trim() || null,
    };

    if (primaryServiceId) {
      insertRow.service_id = primaryServiceId;
    }

    const { data: booking, error: insertErr } = await supabase
      .from("bookings")
      .insert(insertRow)
      .select("id, status")
      .single();

    if (insertErr || !booking) {
      console.error("[BOOKING CREATE REQUEST] insert failed:", insertErr?.message);
      return NextResponse.json(
        { success: false, error: insertErr?.message ?? "Failed to create booking" },
        { status: 500 },
      );
    }

    console.log("[BOOKING CREATED]", {
      bookingId: booking.id,
      status: booking.status,
      artistId,
      customerId,
    });

    const { error: activityErr } = await supabase.from("booking_activity").insert({
      booking_id: booking.id,
      actor_user_id: user.id,
      activity_type: "booking_created",
      metadata: {
        serviceIds,
        serviceType: body.serviceType ?? null,
        startAt,
        endAt,
        notes,
      },
    });

    if (activityErr) {
      console.warn("[BOOKING ACTIVITY INSERTED] failed:", activityErr.message);
    } else {
      console.log("[BOOKING ACTIVITY INSERTED]", {
        bookingId: booking.id,
        activity_type: "booking_created",
      });
    }

    return NextResponse.json({
      success: true,
      bookingId: String(booking.id),
      status: String(booking.status),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    console.error("[BOOKING CREATE REQUEST] error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
