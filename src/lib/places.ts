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

const VENUE_FLAT: Record<number, number> = { 1: 600, 2: 1200, 3: 2200, 4: 3500 };

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

export async function searchVenues(query: string, city: string): Promise<Venue[]> {
  if (!KEY) return curatedVenues(query, city);

  try {
    const center = await geocodeCity(city);
    const body: Record<string, unknown> = { maxResultCount: 6 };
    if (center) {
      body.locationBias = { circle: { center, radius: RADIUS_M } };
    }
    const fields = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.location",
      "places.rating",
      "places.userRatingCount",
      "places.priceLevel",
      "places.googleMapsUri",
      "places.photos.name",
      "places.reviews",
    ].join(",");

    const data = await searchText(`${query} in ${city}`, fields, body);
    const places: any[] = data.places ?? [];
    const kind = classifyKind(query);

    const venues = places
      .filter((p) => !center || !p.location || haversineMeters(center, p.location) <= RADIUS_M)
      .map((p): Venue => {
        const photos: string[] = (p.photos ?? [])
          .slice(0, 6)
          .map((ph: any) => `/api/places/photo?name=${encodeURIComponent(ph.name)}`);
        const review = p.reviews?.find((r: any) => r?.text?.text)?.text?.text as string | undefined;
        const level = priceLevelToNumber(p.priceLevel);
        const est = estimate(kind, level, hash(p.id ?? p.displayName?.text ?? ""));
        return {
          placeId: p.id,
          name: p.displayName?.text ?? "Venue",
          address: p.formattedAddress,
          rating: p.rating,
          reviews: p.userRatingCount,
          priceLevel: level,
          photoUrl: photos[0],
          photos,
          mapsUrl: p.googleMapsUri,
          reviewQuote: review ? truncate(review, 160) : undefined,
          estFlatPrice: est.estFlatPrice,
          estPricePerGuest: est.estPricePerGuest,
          source: "google",
        };
      })
      .filter((v) => v.rating === undefined || v.rating >= 3.5)
      .slice(0, 6);

    return venues.length ? venues : curatedVenues(query, city);
  } catch (err) {
    console.error("searchVenues failed, using curated:", err);
    return curatedVenues(query, city);
  }
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

function curatedVenues(query: string, city: string): Venue[] {
  const u = (id: string) =>
    `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`;
  return [
    {
      placeId: "curated-1",
      name: `Grand Ballroom ${city}`,
      address: `${city}, Romania`,
      rating: 4.8,
      reviews: 412,
      priceLevel: 3,
      photoUrl: u("1519225421980-715cb0215aed"),
      reviewQuote: "Stunning hall, impeccable service — our guests were amazed.",
      estFlatPrice: 2200,
      source: "curated",
    },
    {
      placeId: "curated-2",
      name: `Seaside Terrace ${city}`,
      address: `${city}, Romania`,
      rating: 4.7,
      reviews: 188,
      priceLevel: 2,
      photoUrl: u("1464366400600-7168b8af9bc3"),
      reviewQuote: "Magical sunset views right on the water. Perfect setting.",
      estFlatPrice: 1200,
      source: "curated",
    },
    {
      placeId: "curated-3",
      name: `Garden Pavilion ${city}`,
      address: `${city}, Romania`,
      rating: 4.6,
      reviews: 263,
      priceLevel: 2,
      photoUrl: u("1505236858219-8359eb29e329"),
      reviewQuote: "Lovely green space, great food, very flexible team.",
      estFlatPrice: 1000,
      source: "curated",
    },
  ];
}
