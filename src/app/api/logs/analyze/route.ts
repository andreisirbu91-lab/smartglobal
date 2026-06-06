import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { readLog } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const client = new OpenAI({
  apiKey: process.env.LLMOK_API_KEY,
  baseURL: process.env.LLMOK_BASE_URL ?? "https://burn.llmok.app/v1",
  defaultHeaders: { "User-Agent": "Mozilla/5.0" },
});

/**
 * GET /api/logs/analyze?key=...&n=80
 * An observer agent reads recent real conversations and reports recurring
 * failures + concrete prompt fixes — the self-improvement loop.
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== (process.env.LOG_KEY ?? "sg-logs-2026")) {
    return new NextResponse("forbidden", { status: 403 });
  }
  const n = Math.min(300, Math.max(5, Number(req.nextUrl.searchParams.get("n") ?? "80")));
  const log = await readLog(n);
  if (!log) return new NextResponse("(no log yet)", { headers: { "Content-Type": "text/plain; charset=utf-8" } });

  const prompt = `You are a sharp QA analyst for "Event Concierge", a conversational event-booking agent. Each log line is ONE assistant turn as JSON: { lastUser, in (captured state before), tools (tool calls made), reply, out (captured state after), nextChoice (the question shown next) }. The agent should: capture each answer with a tool, NEVER re-ask something already in 'in', and ALWAYS end a turn by surfacing something (ask_choice / recommend_items / discover_places) that matches its reply.

Analyze these ${log.trim().split("\n").length} turns and report:
1) RECURRING FAILURES — re-asking captured info (city/guests/date already set but asked again), turns with empty 'tools' that still ask a question (stale surface), language flips, dead-ends, surfaced category not matching the reply. Quote the offending lastUser + reply briefly.
2) FREQUENCY — roughly how often each failure happens.
3) FIXES — 3-6 concrete, specific rule additions for the agent's system prompt that would prevent the top failures.
Be concise and concrete. Plain text, no preamble.

LOG:
${log}`;

  try {
    const completion = await client.chat.completions.create({
      model: process.env.LLMOK_MODEL ?? "claude-sonnet-4-6",
      messages: [{ role: "user", content: prompt }],
    });
    const text = completion.choices[0]?.message?.content ?? "(no analysis)";
    return new NextResponse(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (e) {
    return new NextResponse("analyze error: " + String(e), { status: 500 });
  }
}
