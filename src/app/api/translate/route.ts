import { NextResponse } from "next/server";
import { translateMessages } from "@/lib/agents";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { texts, target } = (await req.json()) as { texts?: string[]; target?: "en" | "ro" };
    if (!Array.isArray(texts) || !texts.length) return NextResponse.json({ texts: texts ?? [] });
    if (!process.env.LLMOK_API_KEY) return NextResponse.json({ texts });
    const out = await translateMessages(texts, target === "ro" ? "ro" : "en");
    return NextResponse.json({ texts: out });
  } catch {
    return NextResponse.json({ texts: [] }, { status: 200 });
  }
}
