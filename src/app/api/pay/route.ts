import { NextResponse } from "next/server";
import { getBooking, recordPayment, type PaymentMode } from "@/lib/bookings";

export const runtime = "nodejs";

/** DEMO checkout: 20% deposit (card), full (card/Stripe) or full on invoice (transfer). Simulated + SmartBill invoice. */
export async function POST(req: Request) {
  try {
    const { id, mode } = (await req.json()) as { id?: string; mode?: PaymentMode };
    if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
    const booking = await getBooking(id);
    if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });
    const m: PaymentMode = mode === "full" || mode === "invoice" ? mode : "deposit";
    const r = await recordPayment(id, m);
    return NextResponse.json({ ok: true, paid: m !== "invoice", mode: m, amountPaid: r?.amountPaid, invoice: r?.invoice });
  } catch {
    return NextResponse.json({ error: "pay_failed" }, { status: 500 });
  }
}
