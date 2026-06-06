import type { Venue } from "./types";

/**
 * Live venue discovery via Google Places API (New). Results are restricted to
 * within 50 km of the customer's city. Falls back to a curated list when the
 * key is missing or a request fails, so the demo never breaks.
 */

const KEY = process.env.GOOGLE_PLACES_API_KEY;
const BASE = "https://places.googleapis.com/v1";
const RADIUS_M = 50_000;

type LatLng = { latitude: number; longitude: number };

function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const la1 = (a.latitude * Math.PI) / 180;
  const la2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function searchText(textQuery: string, fieldMask: string, body: Record<string, unknown> = {}) {
  const res = await fetch(`${BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY as string,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify({ textQuery, languageCode: "en", ...body }),
  });
  if (!res.ok) throw new Error(`places ${res.status}: ${await res.text()}`);
  return res.json();
}

const geoCache = new Map<string, LatLng | null>();

async function geocodeCity(city: string): Promise<LatLng | null> {
  const key = city.toLowerCase().trim();
  if (geoCache.has(key)) return geoCache.get(key) ?? null;
  try {
    const data = await searchText(city, "places.location", { maxResultCount: 1 });
    const loc = (data.places?.[0]?.location as LatLng) ?? null;
    geoCache.set(key, loc);
    return loc;
  } catch {
    geoCache.set(key, null);
    return null;
  }
}

type Kind = "transport" | "stay" | "food" | "activity" | "photo" | "band" | "music" | "cake" | "decor" | "beauty" | "care" | "venue";

function classifyKind(q: string): Kind {
  const s = q.toLowerCase();
  if (/[îi]ngrijir|caregiver|home ?care|elderly|v[âa]rstnic|b[ăa]tr[âa]n|infirmier|asistent personal|nurse|nursing|babysitt|wheelchair|scaun rulant|accesibil|accessib|dizabilit|handicap|mobility|special needs/.test(s)) return "care";
  if (/photograph|photo|videograf|video|foto|filmare/.test(s)) return "photo";
  if (/\bband\b|forma[țt]i|trup[ăa]|live music|orchestr/.test(s)) return "band";
  if (/\bdj\b|music|muzic|soloist|c[âa]nt[ăa]re|sonoriz/.test(s)) return "music";
  if (/cake|tort|bakery|cofet[ăa]ri|patiseri|dessert|candy ?bar|sweets|dulciuri/.test(s)) return "cake";
  if (/florist|flori|floral|decor|aranjament|baloane/.test(s)) return "decor";
  if (/makeup|machiaj|hair|coafor|coafur|beauty|salon|stylist/.test(s)) return "beauty";
  if (/transport|transfer|taxi|rent.?a.?car|\bcar\b|\bsofer\b|\bșofer\b|inchirieri auto|limuzin|autocar|microbuz/.test(s)) return "transport";
  if (/stay|cazare|hotel|pensiun|caban|cabin|vila|villa|resort|guest ?house|chalet|spa hotel|night/.test(s)) return "stay";
  if (/restaurant|food|dinner|cin[ăa]|lunch|pr[âa]nz|m[âa]ncare|catering|bistro|teras|brunch|pizz|grill/.test(s)) return "food";
  if (/atv|zipline|tirolian|rafting|adventure|aventur|\bpark\b|parc|climb|escalad|off.?road|kayak|paintball|activit|extreme|adrenalin|ski|wakeboard|jet ?ski|diving|scuba/.test(s)) return "activity";
  return "venue";
}

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const VENUE_FLAT: Record<number, number> = { 1: 450, 2: 800, 3: 1400, 4: 2200 };

/** Rough, varied price estimate per kind so results aren't all identical. */
function estimate(kind: Kind, level: number | undefined, seed: number): { estFlatPrice?: number; estPricePerGuest?: number } {
  const lvl = level ?? 2; // 1-4
  const jitter = 0.85 + (seed % 30) / 100; // 0.85..1.14
  const flat = (base: number) => Math.max(40, Math.round((base * (0.6 + lvl * 0.28) * jitter) / 10) * 10);
  const per = (base: number) => Math.max(12, Math.round(base * (0.7 + lvl * 0.2) * jitter));
  switch (kind) {
    case "transport": return { estFlatPrice: flat(120) };
    case "stay": return { estFlatPrice: flat(130) };
    case "food": return { estPricePerGuest: per(30) };
    case "activity": return { estPricePerGuest: per(45) };
    case "photo": return { estFlatPrice: flat(1100) };
    case "band": return { estFlatPrice: flat(2200) };
    case "music": return { estFlatPrice: flat(850) };
    case "cake": return { estFlatPrice: flat(320) };
    case "decor": return { estFlatPrice: flat(800) };
    case "beauty": return { estFlatPrice: flat(130) };
    case "care": return { estFlatPrice: flat(160) };
    default: return { estFlatPrice: Math.round((VENUE_FLAT[lvl] ?? 1200) * jitter / 10) * 10 };
  }
}

export async function searchVenues(query: string, _city: string): Promise<Venue[]> {
  // Single source of truth = the client's partner venues from the offer PDF. No external search.
  return partnerVenues(query);
}

export async function fetchPhoto(name: string): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  if (!KEY) return null;
  try {
    const url = `${BASE}/${name}/media?maxHeightPx=600&maxWidthPx=900&key=${KEY}`;
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    return { body: await res.arrayBuffer(), contentType: res.headers.get("content-type") ?? "image/jpeg" };
  } catch {
    return null;
  }
}

function priceLevelToNumber(level?: string): number | undefined {
  const map: Record<string, number> = {
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };
  return level ? map[level] : undefined;
}

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

// --- Curated fallback ------------------------------------------------------

function partnerVenues(query: string): Venue[] {
  const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`;
  // Star Global Academic partner venues (Constanța) — from the 2026 offer PDF.
  const RAW: { name: string; type: "indoor" | "mixed" | "clubbing"; img: string }[] = [
    { name: "Porto del Sole Restaurant", type: "indoor", img: img("1519225421980-715cb0215aed") },
    { name: "Ten Luxury Ballroom", type: "indoor", img: img("1464366400600-7168b8af9bc3") },
    { name: "Del Mar Ballroom", type: "indoor", img: img("1505236858219-8359eb29e329") },
    { name: "Le Club Mileva", type: "indoor", img: img("1542314831-068cd1dbfeeb") },
    { name: "Sofra Lake Restaurant", type: "mixed", img: img("1414235077428-338989a2e8c0") },
    { name: "Queen Vera", type: "indoor", img: img("1519671482749-fd09be7ccebf") },
    { name: "Imago", type: "indoor", img: img("1530103862676-de8c9debad1d") },
    { name: "Colonadelor", type: "indoor", img: img("1551218808-94e220e084d2") },
    { name: "Kupolla", type: "indoor", img: img("1517248135467-4c7edcad34c4") },
    { name: "La Dolce Vita", type: "indoor", img: img("1466978913421-dad2ebd01d17") },
    { name: "Miraj by the Lake", type: "mixed", img: img("1505693416388-ac5ce068fe85") },
    { name: "The Place", type: "mixed", img: img("1519671482749-fd09be7ccebf") },
    { name: "The View", type: "mixed", img: img("1469474968028-56623f02e42e") },
    { name: "Black Sea Horses (Nazarcea)", type: "mixed", img: img("1500382017468-9049fed747ef") },
    { name: "Forest M", type: "mixed", img: img("1441974231531-c6227db76b6e") },
    { name: "Crama Rasova", type: "mixed", img: img("1510812431401-41d2bd2722f3") },
    { name: "Kift Garden", type: "mixed", img: img("1464366400600-7168b8af9bc3") },
    { name: "Fratelli Lounge & Club", type: "clubbing", img: img("1516450360452-9312f5e86fc7") },
    { name: "Zoom Beach", type: "clubbing", img: img("1507525428034-b723cf961d3e") },
    { name: "Neversea Beach", type: "clubbing", img: img("1470229722913-7c0e2dbbafd3") },
  ];
  const s = query.toLowerCase();
  let list = RAW;
  if (/club|petrecere|party|dans|beach|plaj/.test(s)) list = RAW.filter((v) => v.type === "clubbing");
  else if (/outdoor|gr[ăa]din|teras|lac|aer liber|p[ăa]dure|forest/.test(s)) list = RAW.filter((v) => v.type !== "indoor");
  const slug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return list.map((v) => ({
    placeId: `sg-${slug(v.name)}`,
    name: v.name,
    address: "Constanța · partener Star Global",
    photoUrl: v.img,
    photos: [v.img],
    mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(v.name + " Constanța")}`,
    estFlatPrice: 0,
    source: "curated",
  }));
}
