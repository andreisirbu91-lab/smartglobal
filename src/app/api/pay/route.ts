import { NextResponse } from "next/server";
import { getBooking, markPaid } from "@/lib/bookings";

export const runtime = "nodejs";

/** DEMO payment: simulates a successful Stripe deposit charge. No real money. */
export async function POST(req: Request) {
  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
    const booking = await getBooking(id);
    if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });
    await markPaid(id);
    const deposit = Math.round(booking.total * 0.2);
    return NextResponse.json({ ok: true, paid: true, deposit });
  } catch {
    return NextResponse.json({ error: "pay_failed" }, { status: 500 });
  }
}
