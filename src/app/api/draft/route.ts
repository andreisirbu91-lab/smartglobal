import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { makeRef, quote } from "@/lib/engine";
import { saveBooking, type BookingRecord } from "@/lib/bookings";
import type { OrderState } from "@/lib/types";

export const runtime = "nodejs";

/** Save the in-progress package as a shareable DRAFT (no email, no payment). */
export async function POST(req: Request) {
  try {
    const { order } = (await req.json()) as { order: OrderState };
    if (!order || !order.lines?.length) return NextResponse.json({ error: "empty" }, { status: 400 });

    const id = randomUUID();
    const q = quote(order);
    const ref = makeRef(Date.now());
    const record: BookingRecord = {
      id,
      ref,
      event_type: order.eventType,
      contact: order.contact,
      state: order,
      quote: q,
      total: q.total,
      language: order.language,
      status: "draft",
      created_at: new Date().toISOString(),
    };
    await saveBooking(record);
    return NextResponse.json({ id, ref });
  } catch {
    return NextResponse.json({ error: "draft_failed" }, { status: 500 });
  }
}
