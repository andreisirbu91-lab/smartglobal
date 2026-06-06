import { NextRequest, NextResponse } from "next/server";
import { getSession, putSession, voteSession, activeCount } from "@/lib/sessions";

export const dynamic = "force-dynamic";

/** GET /api/session/[id]?clientId=... — load the shared session + presence. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clientId = req.nextUrl.searchParams.get("clientId") ?? undefined;
  const d = await getSession(id, clientId);
  if (!d) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ rev: d.rev, order: d.order, messages: d.messages, lastWriter: d.lastWriter, votes: d.votes ?? {}, active: activeCount(d) });
}

/** POST /api/session/[id] — toggle a group vote for an option. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { clientId, optionId } = await req.json();
    if (!clientId || !optionId) return NextResponse.json({ error: "clientId & optionId required" }, { status: 400 });
    const d = await voteSession(id, clientId, optionId);
    if (!d) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ rev: d.rev, votes: d.votes ?? {}, active: activeCount(d) });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
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
