import { NextRequest, NextResponse } from "next/server";
import { getSession, putSession, activeCount } from "@/lib/sessions";

export const dynamic = "force-dynamic";

/** GET /api/session/[id]?clientId=... — load the shared session + presence. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clientId = req.nextUrl.searchParams.get("clientId") ?? undefined;
  const d = await getSession(id, clientId);
  if (!d) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ rev: d.rev, order: d.order, messages: d.messages, lastWriter: d.lastWriter, active: activeCount(d) });
}

/** PUT /api/session/[id] — push the latest order + messages (last-write-wins). */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { order, messages, clientId } = await req.json();
    if (!order || !clientId) return NextResponse.json({ error: "order & clientId required" }, { status: 400 });
    const d = await putSession(id, order, messages ?? [], clientId);
    if (!d) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ rev: d.rev, active: activeCount(d) });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
