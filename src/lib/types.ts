// Shared domain types for the Event Concierge.

export type Lang = "en" | "ro";

export type Localized = { en: string; ro: string };

/** How an item's quantity is derived. */
export type Unit = "per_graduate" | "per_guest" | "flat";

export type EventTypeId =
  | "wedding"
  | "grad_highschool"
  | "grad_university"
  | "custom"
  | "grad_bac"
  | "prom"
  | "gala"
  | "corporate";

export type CategoryId =
  | "venues"
  | "attire"
  | "tickets"
  | "catering"
  | "bar"
  | "cakes"
  | "photography"
  | "videography"
  | "music"
  | "artists"
  | "effects"
  | "decorations"
  | "photozone"
  | "rentals"
  | "print"
  | "invitations"
  | "favors"
  | "afterparty";

export type CatalogItem = {
  id: string;
  name: Localized;
  description: Localized;
  /** Longer marketing copy shown in the detail modal. */
  long?: Localized;
  /** Bullet list of what's included, shown in the detail modal. */
  includes?: { en: string[]; ro: string[] };
  category: CategoryId;
  /** Empty array = available for all event types. */
  eventTypes: EventTypeId[];
  price: number; // EUR
  unit: Unit;
  /** Optional real-photo override (http URL or /catalog/... path). */
  image?: string;
  popular?: boolean;
  /** If set, this item is a bundle of the listed item ids (used to show savings). */
  bundleOf?: string[];
};

export type Category = {
  id: CategoryId;
  name: Localized;
  icon: string;
};

// --- Guided funnel ---------------------------------------------------------

export type StepKind = "basics" | "places" | "catalog" | "discover" | "review";

export type Step = {
  id: string;
  title: Localized;
  /** The curious, well-aimed question the agent should ask at this step. */
  question: Localized;
  kind: StepKind;
  /** For single-decision `basics` steps: which one control to show. */
  field?: "location" | "date" | "people";
  /** For `catalog` steps: which categories to surface. */
  categories?: CategoryId[];
  /** For `places` steps: the kind of place to search for (e.g. "wedding venue"). */
  placesQuery?: Localized;
  optional?: boolean;
};

export type EventType = {
  id: EventTypeId;
  name: Localized;
  tagline: Localized;
  icon: string;
  /** Ordered funnel. If empty, the event uses free gallery browse. */
  steps: Step[];
  /** Whether honorees are "graduates" (per_graduate pricing applies). */
  honoreeLabel: Localized;
};

// --- Venues (live Google Places or curated fallback) -----------------------

export type Venue = {
  placeId: string;
  name: string;
  address?: string;
  rating?: number;
  reviews?: number;
  priceLevel?: number; // 0-4
  photoUrl?: string;
  /** Up to ~6 photos for the bento gallery. */
  photos?: string[];
  mapsUrl?: string;
  reviewQuote?: string;
  /** Our estimate so the cart total stays meaningful (Places has no exact price). */
  estPricePerGuest?: number;
  estFlatPrice?: number;
  source: "google" | "curated";
};

// --- Order / quote ---------------------------------------------------------

/** A non-catalog item (a chosen venue or an agent-invented add-on). */
export type CustomItem = {
  name: Localized;
  description?: Localized;
  price: number;
  unit: Unit;
  category: CategoryId;
  image?: string;
  meta?: Record<string, unknown>;
};

export type OrderLine = {
  itemId: string; // catalog id, or a synthetic id for custom items
  /** Explicit count for `flat` items (defaults to 1). */
  qty?: number;
  /** Present for non-catalog items (venues, custom add-ons). */
  custom?: CustomItem;
};

export type Contact = {
  name?: string;
  email?: string;
  phone?: string;
};

export type EventContext = {
  city?: string;
  date?: string;
  style?: string;
  budget?: number;
};

export type OrderState = {
  eventType: EventTypeId | null;
  graduates: number; // honorees (graduates / the couple)
  guests: number; // attendee count, drives per_guest pricing
  lines: OrderLine[];
  promoCode?: string;
  contact?: Contact;
  context: EventContext;
  stepIndex: number;
  /** Catalog ids the agent is currently showing the customer as recommendations. */
  spotlight?: string[];
  /** Open-ended place discovery the agent surfaced (custom events). */
  discovery?: { query: string; venues: Venue[] };
  /** A special "negotiated" discount the agent secured (0..0.2). */
  negotiatedPct?: number;
  /** Agent-driven multiple-choice question shown as cards in the middle. */
  choices?: { question?: string; options: ChoiceOption[]; input?: "number" | "date" | "text" };
  language: Lang;
};

export type ChoiceOption = { label: string; emoji?: string; desc?: string };

export type QuoteLine = {
  itemId: string;
  name: Localized;
  category: CategoryId;
  unit: Unit;
  unitPrice: number;
  quantity: number;
  total: number;
  savings?: number;
};

export type Discount = {
  code: string;
  label: Localized;
  amount: number;
};

export type Quote = {
  lines: QuoteLine[];
  subtotal: number;
  discounts: Discount[];
  total: number;
  currency: "EUR";
};
