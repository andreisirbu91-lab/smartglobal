import {
  CATALOG,
  GROUP_DISCOUNT,
  PROMO_CODES,
  eventById,
  itemById,
} from "./catalog";
import { RON_PER_EUR } from "./format";
import type {
  Contact,
  CustomItem,
  Discount,
  EventContext,
  EventTypeId,
  Lang,
  OrderState,
  Quote,
  QuoteLine,
  Venue,
} from "./types";

/**
 * The engine is the single source of truth for pricing. The LLM never computes
 * money — it only calls these pure functions. Every function returns a NEW
 * state object (no mutation), so client and server can share it freely.
 */

export function emptyOrder(language: Lang = "en"): OrderState {
  return {
    eventType: null,
    graduates: 1,
    guests: 0,
    lines: [],
    context: {},
    stepIndex: 0,
    language,
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const clampInt = (n: number, min: number) =>
  Math.max(min, Math.floor(Number.isFinite(n) ? n : min));

// --- Mutations (pure) ------------------------------------------------------

export function setEventType(state: OrderState, eventType: EventTypeId): OrderState {
  return { ...state, eventType, stepIndex: 0 };
}

/** Once an essential is captured, the question that asked for it is answered — drop it. */
function answered(next: OrderState): OrderState {
  delete next.choices;
  delete next.tiers;
  return next;
}

export function setGraduates(state: OrderState, count: number): OrderState {
  return answered({ ...state, graduates: clampInt(count, 1) });
}

export function setGuests(state: OrderState, count: number): OrderState {
  return answered({ ...state, guests: clampInt(count, 0) });
}

export function setLanguage(state: OrderState, language: Lang): OrderState {
  return { ...state, language };
}

export function setContact(state: OrderState, contact: Contact): OrderState {
  return { ...state, contact: { ...state.contact, ...contact } };
}

export function setContext(state: OrderState, context: Partial<EventContext>): OrderState {
  return answered({ ...state, context: { ...state.context, ...context } });
}

export function setSpotlight(state: OrderState, ids: string[]): OrderState {
  // Enforce a SINGLE category per recommendation set — never mix categories.
  const items = ids.map((id) => itemById(id)).filter((i): i is NonNullable<typeof i> => Boolean(i));
  const cat0 = items[0]?.category;
  const sameCat = items.filter((i) => i.category === cat0).map((i) => i.id);
  const next = { ...state, spotlight: sameCat };
  if (sameCat.length > 0) { delete next.discovery; delete next.choices; delete next.tiers; } // active surface
  return next;
}

export function clearSpotlight(state: OrderState): OrderState {
  const next = { ...state };
  delete next.spotlight;
  return next;
}

export function setDiscovery(state: OrderState, query: string, venues: import("./types").Venue[]): OrderState {
  const next = { ...state, discovery: { query, venues } };
  if (venues.length > 0) { delete next.spotlight; delete next.choices; delete next.tiers; } // active surface
  return next;
}

export function clearDiscovery(state: OrderState): OrderState {
  const next = { ...state };
  delete next.discovery;
  return next;
}

export function setChoices(
  state: OrderState,
  options: import("./types").ChoiceOption[],
  question?: string,
  input?: "number" | "date" | "text"
): OrderState {
  const next = { ...state, choices: { question, options, input } };
  delete next.spotlight;
  delete next.discovery;
  delete next.tiers;
  return next;
}

export function clearChoices(state: OrderState): OrderState {
  const next = { ...state };
  delete next.choices;
  return next;
}

export function setTiers(
  state: OrderState,
  question: string | undefined,
  raw: { label: string; itemIds: string[] }[]
): OrderState {
  const qty = (unit: string) =>
    unit === "per_guest" ? Math.max(1, state.guests) : unit === "per_graduate" ? Math.max(1, state.graduates) : 1;
  const options = (raw || [])
    .map((t) => {
      const ids = (t.itemIds || []).map((id) => itemById(id)).filter((i): i is NonNullable<typeof i> => Boolean(i));
      const total = round2(ids.reduce((s, it) => s + it.price * qty(it.unit), 0));
      return { label: String(t.label ?? "").slice(0, 70), itemIds: ids.map((i) => i.id), total };
    })
    .filter((o) => o.itemIds.length > 0)
    .slice(0, 3);
  const next = { ...state, tiers: { question, options } };
  delete next.choices;
  delete next.spotlight;
  delete next.discovery;
  return next;
}

export function clearTiers(state: OrderState): OrderState {
  const next = { ...state };
  delete next.tiers;
  return next;
}

/** Apply a special "negotiated" discount (agent secured a deal). Capped at 20%. */
export function setNegotiated(state: OrderState, pct: number): OrderState {
  const p = pct > 1 ? pct / 100 : pct; // accept 5 or 0.05
  return { ...state, negotiatedPct: Math.max(0, Math.min(0.2, p)) };
}

// Step control
export function setStep(state: OrderState, stepIndex: number): OrderState {
  const max = (eventById(state.eventType)?.steps.length ?? 1) - 1;
  const idx = Math.max(0, Math.min(max, Math.floor(stepIndex)));
  // Navigating to a step resets the transient overlays so the middle always
  // reflects the current step (no stale venue/recommendation panels linger).
  const next = { ...state, stepIndex: idx };
  delete next.spotlight;
  delete next.discovery;
  delete next.choices;
  delete next.tiers;
  return next;
}
export const nextStep = (s: OrderState) => setStep(s, s.stepIndex + 1);
export const prevStep = (s: OrderState) => setStep(s, s.stepIndex - 1);

/** Add a catalog item. Flat items accumulate quantity; per-person items are singletons. */
export function addItem(state: OrderState, itemId: string, qty = 1): OrderState {
  const item = itemById(itemId);
  if (!item) return state;

  const existing = state.lines.find((l) => l.itemId === itemId);
  if (existing) {
    if (item.unit !== "flat") return state;
    return {
      ...state,
      lines: state.lines.map((l) =>
        l.itemId === itemId ? { ...l, qty: (l.qty ?? 1) + qty } : l
      ),
    };
  }
  return {
    ...state,
    lines: [...state.lines, { itemId, qty: item.unit === "flat" ? qty : undefined }],
  };
}

export function removeItem(state: OrderState, itemId: string): OrderState {
  return { ...state, lines: state.lines.filter((l) => l.itemId !== itemId) };
}

export function toggleItem(state: OrderState, itemId: string): OrderState {
  return state.lines.some((l) => l.itemId === itemId)
    ? removeItem(state, itemId)
    : addItem(state, itemId);
}

export function setItemQty(state: OrderState, itemId: string, qty: number): OrderState {
  if (qty <= 0) return removeItem(state, itemId);
  const item = itemById(itemId);
  if (!item || item.unit !== "flat") return state;
  const exists = state.lines.some((l) => l.itemId === itemId);
  const lines = exists
    ? state.lines.map((l) => (l.itemId === itemId ? { ...l, qty: clampInt(qty, 1) } : l))
    : [...state.lines, { itemId, qty: clampInt(qty, 1) }];
  return { ...state, lines };
}

/** Add a non-catalog item (agent-invented add-on). Replaces same id. */
export function addCustomItem(state: OrderState, id: string, custom: CustomItem): OrderState {
  const lines = [
    ...state.lines.filter((l) => l.itemId !== id),
    { itemId: id, custom },
  ];
  return { ...state, lines };
}

function venueToCustom(venue: Venue): CustomItem {
  const perGuest = venue.estPricePerGuest && venue.estPricePerGuest > 0;
  return {
    name: { en: venue.name, ro: venue.name },
    price: perGuest ? venue.estPricePerGuest! : venue.estFlatPrice ?? 0,
    unit: perGuest ? "per_guest" : "flat",
    category: "venues",
    image: venue.photoUrl,
    meta: {
      address: venue.address,
      rating: venue.rating,
      reviews: venue.reviews,
      mapsUrl: venue.mapsUrl,
      reviewQuote: venue.reviewQuote,
      source: venue.source,
    },
  };
}

/** Choose THE venue (graduation/wedding). Replaces any existing venue line. */
export function selectVenue(state: OrderState, venue: Venue): OrderState {
  const id = `venue:${venue.placeId}`;
  const withoutVenues = state.lines.filter((l) => !l.itemId.startsWith("venue:"));
  return { ...state, lines: [{ itemId: id, custom: venueToCustom(venue) }, ...withoutVenues] };
}

/** Add a discovered place as its own line (custom events: stay + food + transport + activities). */
export function addVenue(state: OrderState, venue: Venue): OrderState {
  const id = `venue:${venue.placeId}`;
  if (state.lines.some((l) => l.itemId === id)) return removeItem(state, id); // toggle off
  return { ...state, lines: [...state.lines, { itemId: id, custom: venueToCustom(venue) }] };
}

export function applyPromo(state: OrderState, code: string): OrderState {
  const key = code.trim().toUpperCase();
  if (!PROMO_CODES[key]) return state;
  return { ...state, promoCode: key };
}

export function clearPromo(state: OrderState): OrderState {
  const next = { ...state };
  delete next.promoCode;
  return next;
}

export function isValidPromo(code: string): boolean {
  return Boolean(PROMO_CODES[code.trim().toUpperCase()]);
}

// --- Quote (authoritative pricing) -----------------------------------------

function quantityFor(unit: string, state: OrderState, lineQty?: number): number {
  switch (unit) {
    case "per_graduate":
      return Math.max(1, state.graduates);
    case "per_guest":
      return Math.max(1, state.guests);
    default:
      return Math.max(1, lineQty ?? 1);
  }
}

type Resolved = { name: QuoteLine["name"]; category: QuoteLine["category"]; unit: QuoteLine["unit"]; price: number; bundleOf?: string[] };

function resolveLine(line: OrderState["lines"][number]): Resolved | null {
  if (line.custom) {
    return {
      name: line.custom.name,
      category: line.custom.category,
      unit: line.custom.unit,
      price: line.custom.price,
    };
  }
  const item = itemById(line.itemId);
  if (!item) return null;
  return { name: item.name, category: item.category, unit: item.unit, price: item.price, bundleOf: item.bundleOf };
}

export function quote(state: OrderState): Quote {
  const lines: QuoteLine[] = [];

  for (const line of state.lines) {
    const r = resolveLine(line);
    if (!r) continue;
    const quantity = quantityFor(r.unit, state, line.qty);
    const total = round2(r.price * quantity);

    let savings: number | undefined;
    if (r.bundleOf?.length) {
      const partsEach = r.bundleOf.reduce((sum, pid) => sum + (itemById(pid)?.price ?? 0), 0);
      const saved = round2((partsEach - r.price) * quantity);
      if (saved > 0) savings = saved;
    }

    lines.push({
      itemId: line.itemId,
      name: r.name,
      category: r.category,
      unit: r.unit,
      unitPrice: r.price,
      quantity,
      total,
      savings,
      currency: (r as { currency?: "EUR" | "RON" }).currency,
    });
  }

  // Everything totals in RON; EUR-quoted lines (artists) convert at RON_PER_EUR.
  const toRON = (l: QuoteLine) => (l.currency === "EUR" ? l.total * RON_PER_EUR : l.total);
  const subtotal = round2(lines.reduce((sum, l) => sum + toRON(l), 0));

  const discounts: Discount[] = [];
  if (subtotal > 0 && state.graduates >= GROUP_DISCOUNT.minGraduates) {
    discounts.push({
      code: "GROUP",
      label: GROUP_DISCOUNT.label,
      amount: round2(subtotal * GROUP_DISCOUNT.pct),
    });
  }
  if (subtotal > 0 && state.promoCode && PROMO_CODES[state.promoCode]) {
    const promo = PROMO_CODES[state.promoCode];
    discounts.push({
      code: state.promoCode,
      label: promo.label,
      amount: round2(subtotal * promo.pct),
    });
  }
  if (subtotal > 0 && state.negotiatedPct && state.negotiatedPct > 0) {
    discounts.push({
      code: "DEAL",
      label: { en: "Special discount secured for you", ro: "Reducere specială obținută pentru tine" },
      amount: round2(subtotal * state.negotiatedPct),
    });
  }

  const discountTotal = round2(discounts.reduce((sum, d) => sum + d.amount, 0));
  const total = round2(Math.max(0, subtotal - discountTotal));

  return { lines, subtotal, discounts, total, currency: "EUR" };
}

// --- Validation ------------------------------------------------------------

export type ValidationIssue = { field: string; message: { en: string; ro: string } };

export function validate(state: OrderState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!state.eventType) {
    issues.push({ field: "eventType", message: { en: "Choose an event type.", ro: "Alege tipul de eveniment." } });
  }
  if (state.lines.length === 0) {
    issues.push({ field: "lines", message: { en: "Add at least one item.", ro: "Adaugă cel puțin un articol." } });
  }
  if (!state.contact?.name) {
    issues.push({ field: "name", message: { en: "We need a name for the booking.", ro: "Avem nevoie de un nume pentru rezervare." } });
  }
  if (!state.contact?.email || !/^\S+@\S+\.\S+$/.test(state.contact.email)) {
    issues.push({ field: "email", message: { en: "A valid email is required.", ro: "Este necesar un email valid." } });
  }
  return issues;
}

export function canConfirm(state: OrderState): boolean {
  return validate(state).length === 0;
}

/** Stable, human-friendly booking reference. */
export function makeRef(seed: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let n = Math.abs(Math.floor(seed));
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += chars[n % chars.length];
    n = Math.floor(n / chars.length) + 7;
  }
  return `EVT-${out}`;
}

export { CATALOG };
