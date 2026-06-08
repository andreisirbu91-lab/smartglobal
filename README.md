# ✦ Event Concierge — Conversational Booking Agent

A conversational event-planning concierge. The customer describes their event in
plain language; the agent runs a **conversational Q&A** — asking one friendly
question at a time and showing **tappable choice cards** (real venues & products
with photos, or quick choices) — assembles a package, upsells tastefully, adapts
to budget, and ends in a **real, shareable, persisted booking** with a demo
deposit + proforma invoice. Bilingual **EN / RO**.

Built for the Start Global *Graduation Concierge* challenge · Hack a Ton 2026.
**Live:** https://startglobal.rzs-it.ro

---

## The core idea

> **The LLM orchestrates the conversation; a deterministic engine computes money.**

Prices, discounts and totals come only from typed code
([`src/lib/engine.ts`](src/lib/engine.ts)) — never the model. The agent
([`src/lib/llm.ts`](src/lib/llm.ts)) drives the whole flow via tools
([`src/lib/tools.ts`](src/lib/tools.ts)): `ask_choice` (choice cards),
`recommend_items` (catalog products), `discover_places` / `search_venues` (real
Google Places venues & providers), `add_item` / `add_custom_addon`,
`negotiate_discount`, `propose_package` (a second "solutions" agent), and more.

**The golden rule:** the middle of the screen always mirrors the agent's last
move — choice cards, product cards or real venues — so the UI never desyncs from
the conversation. Tapping a card answers the question and the flow continues.

## Highlights

- **Agent-driven Q&A** with premium choice cards + an "Other / type" escape, plus
  number inputs (headcount) and a date picker.
- **Real venues & providers** within 50 km via Google Places (photos, ratings,
  reviews, Maps links, price estimates) — for any need (venue, photographer,
  cake, band, florist, transport, accessibility…).
- **Four event types** (wedding, university & highschool graduation, "something
  else") + an open-ended discovery planner for custom events.
- **Tasteful sales**: anchored upsells, live social proof, bundle deals, and a
  theatrical "unlock a discount" close (supplier search → discount + conditional
  free gift).
- **Multi-agent**: a concierge that orchestrates a `propose_package` solutions
  agent (builds a complete budget-fitting package with or without a budget).
- **Real bookings**: confirm → Supabase (or file fallback) → shareable
  `/booking/[id]` + **invoice email** (Resend) + **demo deposit checkout** &
  **proforma invoice**, WhatsApp/share.
- **Deterministic pricing** proven by `scripts/test-engine.ts`.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · framer-motion ·
OpenAI SDK → **LLMok** · Google Places API (New) · Resend · Supabase (optional).

## Run locally

```bash
npm install
cp .env.local.example .env.local   # fill in the keys below
npm run dev                         # http://localhost:3000
```

Environment (`.env.local`):

| var | purpose |
|-----|---------|
| `LLMOK_API_KEY` / `LLMOK_BASE_URL` / `LLMOK_MODEL` | LLM (OpenAI-compatible) |
| `GOOGLE_PLACES_API_KEY` | live venue/provider discovery (Places API New) |
| `RESEND_API_KEY` / `RESEND_FROM` | invoice email (verified domain) |
| `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | optional; else `.data/` |
| `NEXT_PUBLIC_BASE_URL` | public origin for shareable links |

> The LLMok proxy WAF blocks the OpenAI SDK's default `User-Agent`, so the client
> overrides it (see `src/lib/llm.ts`). Catalog/venue prices are estimates.

## Verify

```bash
npx tsx scripts/test-engine.ts   # proves pricing (group + promo + bundle math)
npm run build                    # type-check + production build
```

## Deploy

Standalone [`Dockerfile`](Dockerfile) + [`docker-compose.yml`](docker-compose.yml)
(plugs into Coolify's Traefik). Supabase schema in
[`supabase/migrations/0001_bookings.sql`](supabase/migrations/0001_bookings.sql).

## License

[MIT](LICENSE) © 2026 Andrei Sîrbu — Start Global Events
