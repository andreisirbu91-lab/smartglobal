import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { canConfirm, makeRef, quote, validate } from "@/lib/engine";
import { saveBooking, getBooking, type BookingRecord } from "@/lib/bookings";
import { sendBookingEmail } from "@/lib/email";
import type { OrderState } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { order, editId } = (await req.json()) as { order: OrderState; editId?: string | null };

    if (!order || !canConfirm(order)) {
      return NextResponse.json(
        { error: "invalid", issues: order ? validate(order) : [] },
        { status: 400 }
      );
    }

    // Editing an existing booking → keep its id + reference (reschedule/modify).
    const existing = editId ? await getBooking(editId) : null;
    const id = existing?.id ?? randomUUID();
    const q = quote(order);
    const ref = existing?.ref ?? makeRef(Date.now());

    const record: BookingRecord = {
      id,
      ref,
      event_type: order.eventType,
      contact: order.contact,
      state: order,
      quote: q,
      total: q.total,
      language: order.language,
      status: "confirmed",
      created_at: new Date().toISOString(),
    };

    await saveBooking(record);

    // Send the invoice email — never let a mail failure block the booking.
    const mail = await sendBookingEmail(record).catch((e) => ({ sent: false, error: String(e) }));
    if (!mail.sent) console.warn("booking email not sent:", mail.error);

    return NextResponse.json({ id, ref, emailed: mail.sent });
  } catch (err) {
    console.error("/api/confirm error", err);
    return NextResponse.json({ error: "confirm_failed" }, { status: 500 });
  }
}
