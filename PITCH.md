# ✦ Event Concierge — Pitch & Go-Live Plan
### Hack a Ton 2026 · Graduation Concierge challenge · Start Global

**Live demo:** https://startglobal.rzs-it.ro · **Code:** https://github.com/andreisirbu91-lab/smartglobal · office@ambasada.pro

---

# 🇬🇧 ENGLISH

## One line
A conversational event concierge that turns a clunky booking form into a friendly chat — it asks the right questions with **tappable choice cards**, builds a real package from a catalog + **live local venues**, sells tastefully, and ends in a **confirmed, itemized booking** with a deposit and proforma invoice. Bilingual EN/RO.

## The problem (theirs)
Booking a graduation/gala means wading through tickets, gown, photo, video, extra guests, after-party. Forms are clunky; nobody fills them happily. A **conversation** is how people actually want to do this.

## Our solution
The customer just talks (or taps). The agent:
1. **Converses** — one friendly question at a time, each with **choice cards** (city, headcount, date, style, package tier) + an always-present "type your own". No wall of forms.
2. **Builds the package** — real catalog add-ons (photos with prices) and **real venues/providers within 50 km** via Google Places (ratings, reviews, photos, price estimates). Upsells sensibly, adapts to budget.
3. **Confirms & delivers** — a closing deal, name + email, demo deposit + proforma invoice, and a **shareable, itemized booking page**.

## Architecture (the one decision that matters)
> **The LLM orchestrates the conversation; a deterministic engine computes every cent.**

- **Engine** (`src/lib/engine.ts`) — pure functions: quantities, group discount, promos, negotiated deal, totals. The model **never** computes money → prices are always correct against the catalog rules.
- **Agent** (`src/lib/llm.ts` + `tools.ts`) — LLM (via LLMok) drives a tool loop: `ask_choice` (choice cards), `recommend_items`, `search_venues`/`discover_places` (Google Places), `add_item`, `negotiate_discount`, `propose_package` (a second "solutions" agent that builds a full package), `set_contact`, …
- **The golden rule** — the screen always mirrors the agent's last move (choice cards / products / venues), so the UI never desyncs from the chat.
- **Stateless turns** — the client owns the order; each turn sends state + history. Easy to scale, easy to test.
- **Self-improvement loop** — every turn is logged; an **observer agent** (`/api/logs/analyze`) reads real conversations and reports failure patterns; a **regression smoke suite** (`scripts/smoke-flows.py`, 6 multi-step scenarios) gates every change. Tester → Observer → Builder, with build + price tests + git rollback as guardrails.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind · framer-motion · OpenAI SDK → LLMok · Google Places (New) · Resend · Supabase/file store · Docker + Coolify on a Black-Sea VPS.

## How we hit the judging criteria
| Criterion | How |
|---|---|
| Assembles the right package via conversation (the differentiator) | Agent-driven Q&A; deterministic engine guarantees the order is valid & priced |
| UX & naturalness | Conversational choice cards, premium design, 1-tap, "type your own" everywhere, real photos |
| Edge cases (changes, multiple attendees, discounts) | Per-attendee pricing, mid-chat changes, group/promo/negotiated discounts shown exactly |
| Correctness vs catalog rules | Money is pure code, proven by `scripts/test-engine.ts` |
| Creativity + multilingual + upsells | EN/RO with full chat translation, live social proof, anchored upsells, theatrical deal close |

## Stretch goals — status
- ✅ **Multilingual** EN/RO (auto-detect + toggle that translates the whole chat).
- ✅ **Shareable package summary** (`/booking/[id]`, WhatsApp/native share).
- ✅ **Live venue/provider discovery** (beyond the brief — real Google Places).
- 🔜 **Reschedule/modify an existing booking** conversationally (designed; next).

## Trade-offs we made
- **Estimated venue prices** (Places has no real price) — shown as "≈ estimate", confirmed with the provider later. Real prices come from supplier onboarding.
- **Demo payment + proforma** (no real Stripe/SmartBill keys in the hackathon) — wired so swapping to live keys is a config change, not a rewrite.
- **Sonnet over a cheaper mini** — mini dropped tool calls and re-asked; reliability wins for a booking flow.

---

# 🚀 What happens after — putting it in motion for real

The demo is one config-swap away from production. The path:

### Phase 1 — Real money & invoices (1–2 weeks)
- **Stripe** (cards, Apple/Google Pay) for the deposit; the demo checkout already models it — swap test keys for live.
- **SmartBill** (or Oblio) for real proforma → fiscal invoice on payment; the proforma is already generated.
- Webhooks: payment success → confirm booking → email invoice (Resend already wired) → notify the supplier.

### Phase 2 — Supplier onboarding portal (2–4 weeks) — the real catalog
- A dashboard where venues/photographers/DJs/caterers add **their real items, prices, photos, availability**. This replaces estimates with truth and gives the "real photo library" we stubbed.
- Each supplier = a tenant; the concierge searches **their** live inventory first, falling back to Google Places for discovery.
- Commission model: Start Global takes a % of each confirmed booking (the business case).

### Phase 3 — Booking management & lifecycle
- Conversational **reschedule/modify** (the stretch goal): "move it to July 20", "drop the band".
- Customer + supplier booking dashboards; status (pending → paid → delivered).
- Automated reminders (WhatsApp/email), guest list collection, co-attendee shares.

### Phase 4 — Distribution & growth
- **WhatsApp Business** entry point (the agent lives where students already chat).
- Embeddable widget for school/university sites.
- CRM + analytics: funnel, drop-off, AOV, upsell take-rate.

### Phase 5 — The self-improving product (already started)
- The Tester → Observer → Builder loop runs continuously on real logs: it flags re-asks, dead-ends, dropped steps, and proposes prompt fixes; each fix passes the smoke suite + price tests before deploy. The product literally gets better with every conversation.

### Business model in one line
Free for the customer; Start Global earns a **commission per confirmed booking** + optional supplier subscription. The concierge lowers the effort of booking to a 2-minute chat → more completed bookings → more revenue.

---

# 🇷🇴 ROMÂNĂ

## Într-o frază
Un concierge conversațional pentru evenimente care transformă un formular greoi de rezervare într-o discuție prietenoasă — pune întrebările potrivite cu **carduri de ales**, construiește un pachet real din catalog + **locații reale din zonă**, vinde elegant și se termină cu o **rezervare confirmată și itemizată**, cu avans și factură proformă. Bilingv RO/EN.

## Problema (a lor)
Rezervarea unui banchet/absolvire înseamnă un morman de opțiuni (bilete, robă, foto, video, invitați în plus, after-party). Formularele sunt greoaie; nimeni nu le completează cu drag. O **conversație** e modul în care oamenii chiar vor să facă asta.

## Soluția noastră
Clientul doar vorbește (sau atinge). Agentul:
1. **Conversează** — o întrebare prietenoasă pe rând, fiecare cu **carduri** (oraș, număr, dată, stil, pachet) + mereu „scrie tu". Fără ziduri de formulare.
2. **Construiește pachetul** — add-on-uri reale din catalog (cu poze și prețuri) și **locații/furnizori reali pe o rază de 50 km** via Google Places (rating, recenzii, poze, estimări de preț). Upsell elegant, se încadrează în buget.
3. **Confirmă & livrează** — un close cu reducere, nume + email, avans demo + proformă și o **pagină de rezervare itemizată, de partajat**.

## Arhitectura (decizia care contează)
> **LLM-ul conduce conversația; un motor determinist calculează fiecare leu.**

- **Motor** (`engine.ts`) — funcții pure: cantități, discount de grup, promoții, negociere, totaluri. Modelul **nu** atinge banii → prețurile sunt mereu corecte față de regulile catalogului.
- **Agent** (`llm.ts` + `tools.ts`) — LLM (via LLMok) cu buclă de tool-uri: `ask_choice`, `recommend_items`, `search_venues`/`discover_places`, `add_item`, `negotiate_discount`, `propose_package`, `set_contact`…
- **Regula de aur** — ecranul oglindește mereu ultima mișcare a agentului → UI-ul nu se desincronizează niciodată de chat.
- **Tururi stateless** — clientul deține comanda; ușor de scalat și testat.
- **Bucla de auto-îmbunătățire** — fiecare tur e logat; un **agent-observator** (`/api/logs/analyze`) citește conversațiile reale și raportează tiparele de eșec; o **suită de regresie** (`scripts/smoke-flows.py`, 6 scenarii multi-pas) păzește fiecare schimbare. Tester → Observer → Builder, cu build + teste de preț + rollback git ca plase de siguranță.

## Cum bifăm criteriile de jurizare
| Criteriu | Cum |
|---|---|
| Asamblează pachetul corect prin conversație (diferențiatorul) | Q&A condus de agent; motorul determinist garantează o comandă validă și corect calculată |
| UX & naturalețe | Carduri conversaționale, design premium, 1-tap, „scrie tu" peste tot, poze reale |
| Edge cases (modificări, mai mulți participanți, discounturi) | Preț per participant, modificări în chat, discounturi de grup/promo/negociat afișate exact |
| Corectitudine față de catalog | Banii sunt cod pur, dovedit de `test-engine.ts` |
| Creativitate + multilingv + upsell | RO/EN cu traducerea întregului chat, social proof live, upsell ancorat, close teatral |

## Stretch goals — status
- ✅ **Multilingv** RO/EN (auto-detect + toggle care traduce tot chatul).
- ✅ **Rezumat de partajat** (`/booking/[id]`, WhatsApp/share nativ).
- ✅ **Descoperire locații/furnizori reali** (peste brief — Google Places real).
- 🔜 **Reprogramare/modificare** conversațională (proiectat; urmează).

## Compromisuri
- **Prețuri estimate** la locații (Places n-are preț real) — „≈ estimare", confirmate ulterior cu furnizorul. Prețul real vine din onboarding-ul furnizorilor.
- **Plată demo + proformă** (fără chei reale Stripe/SmartBill la hackathon) — făcut astfel încât trecerea la live = o schimbare de config, nu rescriere.
- **Sonnet în loc de mini** — mini pierdea tool-uri și re-întreba; pentru rezervări, fiabilitatea câștigă.

## 🚀 Ce urmează — cum îl punem în mișcare real
- **Faza 1 — Bani & facturi reale (1–2 săpt):** Stripe pentru avans (checkout-ul demo deja îl modelează — schimbi cheile), SmartBill/Oblio pentru proformă → factură fiscală la plată; webhook-uri plată→confirmare→email→notificare furnizor.
- **Faza 2 — Portal de furnizori (2–4 săpt) — catalogul real:** dashboard unde locații/fotografi/DJ/catering adaugă **produsele, prețurile, pozele și disponibilitatea lor reale**. Înlocuiește estimările cu adevărul + biblioteca reală de poze. Fiecare furnizor = tenant; comision per rezervare confirmată = modelul de business.
- **Faza 3 — Management rezervări:** reprogramare/modificare conversațională, dashboard-uri client + furnizor, statusuri, remindere WhatsApp/email, listă de invitați.
- **Faza 4 — Distribuție:** intrare prin **WhatsApp Business** (agentul stă unde discută deja elevii), widget embeddabil pe site-uri de școli/facultăți, CRM + analitice (funnel, AOV, rată de upsell).
- **Faza 5 — Produs care se auto-îmbunătățește (deja pornit):** bucla Tester → Observer → Builder rulează continuu pe loguri reale, propune fix-uri, fiecare trece prin suita de regresie înainte de deploy. Produsul devine mai bun cu fiecare conversație.

### Model de business
Gratis pentru client; Start Global câștigă un **comision per rezervare confirmată** + abonament opțional de furnizor. Concierge-ul reduce efortul de rezervare la un chat de 2 minute → mai multe rezervări finalizate → mai mult venit.

---

## 🎤 5-minute pitch script
1. **Hook (30s)** — "Booking a graduation is a clunky form nobody enjoys. We made it a 2-minute chat." Show the landing → pick event.
2. **Live demo (2.5min)** — city → headcount → date (calendar) → "build for me / no budget" → full package generates → walk one upsell → **real venues with photos** → checkout modal: "sure you don't want X?" → unlock a deal → **confirmed itemized booking** + invoice.
3. **Architecture (1min)** — "LLM drives the chat, a deterministic engine owns the money — so prices are always right. Real venues via Google Places. The screen mirrors the agent."
4. **Trust & scale (30s)** — self-improvement loop: every conversation is analyzed, every change passes a regression suite. One config swap from real Stripe + supplier catalog.
5. **Close (30s)** — "Free for students, commission per booking for Start Global. It gets smarter with every chat."
