import { NextResponse } from "next/server";
import { searchVenues } from "@/lib/places";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "wedding venue";
  const city = searchParams.get("city")?.trim() || "";
  if (!city) return NextResponse.json({ venues: [] });
  try {
    const venues = await searchVenues(query, city);
    return NextResponse.json({ venues });
  } catch (err) {
    console.error("/api/places error", err);
    return NextResponse.json({ venues: [] }, { status: 200 });
  }
}
