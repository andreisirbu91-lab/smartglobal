import type OpenAI from "openai";
import {
  addCustomItem,
  addItem,
  addVenue,
  applyPromo,
  nextStep,
  quote as computeQuote,
  removeItem,
  selectVenue,
  setContact,
  setChoices,
  setContext,
  setDiscovery,
  setEventType,
  setGraduates,
  setGuests,
  setLanguage,
  setNegotiated,
  setSpotlight,
  setStep,
} from "./engine";
import { CATALOG, CATEGORIES, EVENT_TYPES, eventById, itemById } from "./catalog";
import { searchVenues } from "./places";
import { proposePackage } from "./agents";
import type { CategoryId, EventTypeId, OrderState, Unit, Venue } from "./types";

export const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "set_event_type",
      description: "Set the kind of event being booked.",
      parameters: { type: "object", properties: { eventType: { type: "string", enum: EVENT_TYPES.map((e) => e.id) } }, required: ["eventType"] },
    },
  },
  {
    type: "function",
    function: {
      name: "set_language",
      description: "Set the interface language to match the language the customer is writing in.",
      parameters: { type: "object", properties: { language: { type: "string", enum: ["en", "ro"] } }, required: ["language"] },
    },
  },
  {
    type: "function",
    function: {
      name: "set_context",
      description: "Save the event context as you learn it: city/area (REQUIRED before searching venues), approximate date, style/vibe, and total budget in EUR.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "City or area, e.g. 'Constanta'." },
          date: { type: "string", description: "Approximate date, free text." },
          style: { type: "string", description: "Vibe/style, e.g. 'seaside, intimate'." },
          budget: { type: "number", description: "Total budget in EUR." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_graduates",
      description: "Set the number of honorees (graduates / students). For a wedding this is the couple (2).",
      parameters: { type: "object", properties: { count: { type: "integer", minimum: 1 } }, required: ["count"] },
    },
  },
  {
    type: "function",
    function: {
      name: "set_guests",
      description: "Set the total number of guests attending (drives per-guest pricing like menu and favors).",
      parameters: { type: "object", properties: { count: { type: "integer", minimum: 0 } }, required: ["count"] },
    },
  },
  {
    type: "function",
    function: {
      name: "search_venues",
      description: "Find real venues within 50km of the city using Google Places. Call set_context with the city first. Returns names, ratings, prices and ids you can recommend.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Kind of venue, e.g. 'wedding venue', 'banquet hall'." },
          city: { type: "string", description: "City/area to search around. Defaults to the saved context city." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "discover_places",
      description: "Open-ended discovery for ANY kind of place (cozy cabins, seaside spa, romantic restaurants, team-building venues, etc.) near a location, using live Google Places. Results appear on the customer's screen to browse and pick. Use this for custom/'something else' events and whenever the customer wants ideas for a place.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "What to look for, e.g. 'cozy mountain cabin', 'seaside spa hotel', 'romantic restaurant'." },
          city: { type: "string", description: "City/area to search around (defaults to the saved context location)." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "select_venue",
      description: "Choose THE single venue for a wedding/graduation (from search_venues results). Replaces any previous venue. Pass the venue's fields back.",
      parameters: {
        type: "object",
        properties: {
          placeId: { type: "string" },
          name: { type: "string" },
          address: { type: "string" },
          rating: { type: "number" },
          reviews: { type: "integer" },
          estFlatPrice: { type: "number", description: "Estimated flat venue fee in EUR." },
          photoUrl: { type: "string" },
          mapsUrl: { type: "string" },
        },
        required: ["placeId", "name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_place",
      description: "Add a discovered place to the plan as its own line (custom events: combine a stay + restaurant + transport + activities). Pass the fields from discover_places results, incl. the estimated price so the cart total is right.",
      parameters: {
        type: "object",
        properties: {
          placeId: { type: "string" },
          name: { type: "string" },
          address: { type: "string" },
          rating: { type: "number" },
          reviews: { type: "integer" },
          estFlatPrice: { type: "number", description: "Estimated one-off price in EUR (transport, stay, venue)." },
          estPricePerGuest: { type: "number", description: "Estimated price per person in EUR (food, activities)." },
          photoUrl: { type: "string" },
          mapsUrl: { type: "string" },
        },
        required: ["placeId", "name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_choice",
      description: "Ask the customer a question and show 2-4 tappable CHOICE CARDS in the middle (Claude-style). Use for non-catalog decisions: event type, city, style/vibe, yes/no, headcount ranges, dates, package tiers. An 'Other / type my own' card is always added automatically. Keep options short and clear.",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string", description: "The short question (also say it in your chat reply)." },
          input: { type: "string", enum: ["number", "date", "text"], description: "Adds a typed input: 'number' for headcount (graduates/guests), 'date' for the event date (with a calendar picker). Use preset options as quick picks alongside it." },
          options: {
            type: "array",
            description: "0-4 quick-pick options (can be empty when using a number/date input).",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                emoji: { type: "string" },
                desc: { type: "string", description: "Optional one-line benefit/detail." },
              },
              required: ["label"],
            },
          },
        },
        required: ["options"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recommend_items",
      description: "Surface 1–4 specific catalog options on the customer's screen as a highlighted 'Recommended' panel (with photos) while you discuss them. ALWAYS call this whenever you mention or suggest specific add-ons, so the customer sees the evidence and can tap to add. Pass exact catalog ids.",
      parameters: {
        type: "object",
        properties: { itemIds: { type: "array", items: { type: "string" }, description: "1–4 catalog ids you are presenting." } },
        required: ["itemIds"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_item",
      description: "Add a catalog add-on by its id. Use the catalog list in the system prompt.",
      parameters: { type: "object", properties: { itemId: { type: "string" }, qty: { type: "integer", minimum: 1 } }, required: ["itemId"] },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_item",
      description: "Remove an add-on (or venue) from the package by its id.",
      parameters: { type: "object", properties: { itemId: { type: "string" } }, required: ["itemId"] },
    },
  },
  {
    type: "function",
    function: {
      name: "add_custom_addon",
      description: "Create a bespoke add-on the catalog doesn't have (e.g. a special request). You set a fair price.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          price: { type: "number", description: "Price in EUR." },
          unit: { type: "string", enum: ["per_graduate", "per_guest", "flat"] },
          category: { type: "string", enum: CATEGORIES.map((c) => c.id) },
          description: { type: "string" },
        },
        required: ["name", "price", "unit", "category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "apply_promo",
      description: "Apply a promo code (e.g. GRAD2026, EARLYBIRD).",
      parameters: { type: "object", properties: { code: { type: "string" } }, required: ["code"] },
    },
  },
  {
    type: "function",
    function: {
      name: "negotiate_discount",
      description: "Secure a special 'negotiated' discount (max 15%) to help an over-budget but excellent option fit, or to close the deal. Frame it as you having checked with the owner/provider and obtained a deal. Use sparingly.",
      parameters: { type: "object", properties: { pct: { type: "number", description: "Discount percent, e.g. 5 for 5%." } }, required: ["pct"] },
    },
  },
  {
    type: "function",
    function: {
      name: "set_contact",
      description: "Save the customer's name, email and phone for the booking.",
      parameters: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, phone: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "goto_step",
      description: "Move the guided funnel to a step. Use 'next' to advance, or a 0-based index.",
      parameters: { type: "object", properties: { to: { type: "string", description: "'next' or a step index as a string." } }, required: ["to"] },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_package",
      description: "Ask the planning specialist to assemble a complete, budget-fitting package of add-ons and add them to the order. Use when the customer wants a suggestion, says 'plan it for me', 'surprise me', or you want to fill the package quickly. Venue is chosen separately.",
      parameters: {
        type: "object",
        properties: { preferences: { type: "string", description: "Any stated style/preferences to honor." } },
      },
    },
  },
  {
    type: "function",
    function: { name: "get_quote", description: "Return the current itemized quote and totals.", parameters: { type: "object", properties: {} } },
  },
];

type ToolResult = { state: OrderState; result: unknown };

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  state: OrderState
): Promise<ToolResult> {
  const ok = (next: OrderState, extra: Record<string, unknown> = {}): ToolResult => ({
    state: next,
    result: { ok: true, quote: computeQuote(next), stepIndex: next.stepIndex, ...extra },
  });

  switch (name) {
    case "set_event_type":
      return ok(setEventType(state, args.eventType as EventTypeId));

    case "set_language":
      return ok(setLanguage(state, args.language === "ro" ? "ro" : "en"));

    case "set_context": {
      // Only merge fields that were actually provided — never wipe city/date/budget with undefined.
      const ctx: Record<string, unknown> = {};
      if (args.city != null && String(args.city).trim()) ctx.city = String(args.city).trim();
      if (args.date != null && String(args.date).trim()) ctx.date = String(args.date).trim();
      if (args.style != null && String(args.style).trim()) ctx.style = String(args.style).trim();
      if (args.budget != null && Number(args.budget) > 0) ctx.budget = Number(args.budget);
      return ok(setContext(state, ctx));
    }

    case "set_graduates":
      return ok(setGraduates(state, Number(args.count)));

    case "set_guests":
      return ok(setGuests(state, Number(args.count)));

    case "search_venues": {
      const city = String(args.city ?? state.context.city ?? "").trim();
      if (!city) return { state, result: { ok: false, error: "No city yet. Call set_context with the city first." } };
      const q = String(args.query ?? "event venue");
      const venues = await searchVenues(q, city);
      const next = setDiscovery(state, q, venues); // surface them on the customer's screen
      return {
        state: next,
        result: {
          ok: true,
          found: venues.map((v) => ({ placeId: v.placeId, name: v.name, rating: v.rating, reviews: v.reviews, estFlatPrice: v.estFlatPrice, estPricePerGuest: v.estPricePerGuest, address: v.address })),
        },
      };
    }

    case "discover_places": {
      const city = String(args.city ?? state.context.city ?? "").trim();
      const query = String(args.query ?? "").trim();
      if (!city) return { state, result: { ok: false, error: "No location yet. Ask for the city/area and call set_context first." } };
      const venues = await searchVenues(query || "cozy place", city);
      // Navigate FIRST (setStep clears transient panels), then set discovery.
      let next = state;
      const steps = eventById(next.eventType)?.steps ?? [];
      const di = steps.findIndex((s) => s.kind === "discover");
      if (di >= 0) next = setStep(next, di);
      next = setDiscovery(next, query, venues);
      return {
        state: next,
        result: {
          ok: true,
          found: venues.map((v) => ({ placeId: v.placeId, name: v.name, rating: v.rating, reviews: v.reviews, estFlatPrice: v.estFlatPrice, estPricePerGuest: v.estPricePerGuest, address: v.address })),
        },
      };
    }

    case "select_venue": {
      const venue: Venue = {
        placeId: String(args.placeId),
        name: String(args.name),
        address: args.address as string | undefined,
        rating: args.rating as number | undefined,
        reviews: args.reviews as number | undefined,
        photoUrl: args.photoUrl as string | undefined,
        mapsUrl: args.mapsUrl as string | undefined,
        estFlatPrice: args.estFlatPrice ? Number(args.estFlatPrice) : 1000,
        source: "google",
      };
      return ok(selectVenue(state, venue), { selected: venue.name });
    }

    case "add_place": {
      const venue: Venue = {
        placeId: String(args.placeId),
        name: String(args.name),
        address: args.address as string | undefined,
        rating: args.rating as number | undefined,
        reviews: args.reviews as number | undefined,
        photoUrl: args.photoUrl as string | undefined,
        mapsUrl: args.mapsUrl as string | undefined,
        estFlatPrice: args.estPricePerGuest ? undefined : Number(args.estFlatPrice ?? 200),
        estPricePerGuest: args.estPricePerGuest ? Number(args.estPricePerGuest) : undefined,
        source: "google",
      };
      return ok(addVenue(state, venue), { added: venue.name });
    }

    case "ask_choice": {
      const raw = Array.isArray(args.options) ? args.options : [];
      const options = raw
        .map((o: Record<string, unknown>) => ({
          label: String(o?.label ?? "").slice(0, 60),
          emoji: o?.emoji ? String(o.emoji).slice(0, 4) : undefined,
          desc: o?.desc ? String(o.desc).slice(0, 90) : undefined,
        }))
        .filter((o) => o.label)
        .slice(0, 4);
      const input = ["number", "date", "text"].includes(String(args.input)) ? (String(args.input) as "number" | "date" | "text") : undefined;
      const next = setChoices(state, options, args.question ? String(args.question) : undefined, input);
      return { state: next, result: { ok: true, shown: options.map((o) => o.label), input } };
    }

    case "recommend_items": {
      const ids = (Array.isArray(args.itemIds) ? args.itemIds : []).map(String);
      const next = setSpotlight(state, ids);
      const shown = (next.spotlight ?? []).map((id) => itemById(id)?.name.en).filter(Boolean);
      return { state: next, result: { ok: true, shown } };
    }

    case "add_item": {
      const item = itemById(String(args.itemId));
      if (!item) return { state, result: { ok: false, error: "Unknown itemId; use one from the catalog list." } };
      return ok(addItem(state, item.id, args.qty ? Number(args.qty) : 1), { added: item.name.en });
    }

    case "remove_item":
      return ok(removeItem(state, String(args.itemId)));

    case "add_custom_addon": {
      const id = `custom:${String(args.name).toLowerCase().replace(/\s+/g, "-").slice(0, 32)}`;
      const label = String(args.name);
      return ok(
        addCustomItem(state, id, {
          name: { en: label, ro: label },
          description: args.description ? { en: String(args.description), ro: String(args.description) } : undefined,
          price: Number(args.price),
          unit: args.unit as Unit,
          category: args.category as CategoryId,
        }),
        { added: label }
      );
    }

    case "apply_promo": {
      const next = applyPromo(state, String(args.code));
      const applied = next.promoCode === String(args.code).trim().toUpperCase();
      return { state: next, result: { ok: applied, applied, quote: computeQuote(next) } };
    }

    case "negotiate_discount": {
      const next = setNegotiated(state, Number(args.pct ?? 0));
      return ok(next, { negotiatedPct: next.negotiatedPct });
    }

    case "set_contact":
      return ok(setContact(state, { name: args.name as string, email: args.email as string, phone: args.phone as string }));

    case "goto_step": {
      const to = String(args.to);
      const next = to === "next" ? nextStep(state) : setStep(state, parseInt(to, 10) || 0);
      const step = eventById(next.eventType)?.steps[next.stepIndex];
      return ok(next, { step: step?.id });
    }

    case "propose_package": {
      const proposal = await proposePackage(state, args.preferences as string | undefined);
      let next = state;
      for (const id of proposal.itemIds) next = addItem(next, id);
      const added = proposal.itemIds.map((id) => itemById(id)?.name.en).filter(Boolean);
      return { state: next, result: { ok: true, added, note: proposal.note, quote: computeQuote(next), stepIndex: next.stepIndex } };
    }

    case "get_quote":
      return { state, result: { ok: true, quote: computeQuote(state), stepIndex: state.stepIndex } };

    default:
      return { state, result: { ok: false, error: `Unknown tool ${name}` } };
  }
}

export { CATALOG };
