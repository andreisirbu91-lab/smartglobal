import { NextRequest, NextResponse } from "next/server";
import { getBooking } from "@/lib/bookings";

export const dynamic = "force-dynamic";

/** GET /api/booking/[id] — load an existing booking's order so it can be edited/rescheduled. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await getBooking(id);
  if (!b) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ id: b.id, ref: b.ref, order: b.state });
}
