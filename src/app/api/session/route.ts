import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/sessions";

export const dynamic = "force-dynamic";

/** POST /api/session — create a shared collaborative session, returns its id. */
export async function POST(req: NextRequest) {
  try {
    const { order, messages } = await req.json();
    if (!order) return NextResponse.json({ error: "order required" }, { status: 400 });
    const id = await createSession(order, messages ?? []);
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
