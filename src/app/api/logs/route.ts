import { NextRequest, NextResponse } from "next/server";
import { readLog } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** GET /api/logs?key=...&n=60 — tail of the per-turn conversation log (debug). */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== (process.env.LOG_KEY ?? "sg-logs-2026")) {
    return new NextResponse("forbidden", { status: 403 });
  }
  const n = Math.min(500, Math.max(1, Number(req.nextUrl.searchParams.get("n") ?? "60")));
  const text = await readLog(n);
  return new NextResponse(text || "(no log yet)", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
