import { NextResponse } from "next/server";
import { validateBookingTransition } from "@/lib/booking/booking-engine";
import type { BookingStatusDb } from "@/lib/booking/booking-status";
import { mapBookingRow, insertBookingActivity } from "@/lib/bookings/bookings-repository";
import { fetchDbAuthRow } from "@/lib/auth/fetch-db-auth-row";
import {
  notificationEventForStatusTransition,
  queueBookingNotification,
} from "@/lib/notifications/booking-notifications";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";

type Body = {
  status?: BookingStatusDb;
  cancellationReason?: string;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createRouteSupabase();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authRow = await fetchDbAuthRow(supabase, user.id);
    if (!authRow.row) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: bookingId } = await context.params;
    const body = (await request.json()) as Body;
    if (!body.status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    const { data: row, error: fetchErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();

    if (fetchErr || !row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const booking = mapBookingRow(row as Record<string, unknown>);
    const validation = validateBookingTransition(
      {
        id: booking.id,
        customerId: booking.customerId,
        artistId: booking.artistId,
        modelId: booking.modelId,
        status: booking.status,
      },
      body.status,
      { id: user.id, role: authRow.row.role },
      { cancellationReason: body.cancellationReason },
    );

    if (!validation.ok) {
      return NextResponse.json({ error: validation.messageKey }, { status: 400 });
    }

    const { error: updateErr } = await supabase
      .from("bookings")
      .update(validation.patch)
      .eq("id", bookingId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    await insertBookingActivity(supabase, {
      bookingId,
      actorId: user.id,
      actorRole: authRow.row.role,
      fromStatus: booking.status,
      toStatus: validation.patch.status,
      note: body.cancellationReason,
    });

    const eventType = notificationEventForStatusTransition(booking.status, validation.patch.status);
    if (eventType) {
      for (const userId of [booking.customerId, booking.artistId]) {
        if (userId !== user.id) {
          await queueBookingNotification(supabase, {
            userId,
            eventType,
            payload: { bookingId, to: validation.patch.status },
          });
        }
      }
    }

    return NextResponse.json({ ok: true, status: validation.patch.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
