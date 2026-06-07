"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CatalogItem, Contact, Discount, EventTypeId, Lang, OrderState, Venue } from "@/lib/types";
import { CATALOG, eventById, itemById } from "@/lib/catalog";
import { AnimatePresence, motion } from "framer-motion";
import {
  addItem,
  addVenue,
  applyPromo,
  clearChoices,
  clearDiscovery,
  clearSpotlight,
  clearTiers,
  emptyOrder,
  nextStep,
  planPackage,
  prevStep,
  quote as computeQuote,
  selectVenue,
  setContact,
  setContext,
  setEventType,
  setGraduates,
  setGuests,
  setLanguage,
  setStep,
  toggleItem,
} from "@/lib/engine";
import { CatalogCard } from "@/components/CatalogCard";
import { ChoiceCards } from "@/components/ChoiceCards";
import { TierCards } from "@/components/TierCards";
import { VariantCarousel } from "@/components/VariantCarousel";
import { OnlineClassmates } from "@/components/OnlineClassmates";
import { money, tr } from "@/lib/format";
import { itemImage } from "@/lib/images";
import { searchVenues } from "@/lib/places";
import { t } from "@/lib/i18n";
import { Chat, type ChatMessage } from "@/components/Chat";
import { CartPanel } from "@/components/CartPanel";
import { Stepper } from "@/components/Stepper";
import { Button } from "@/components/ui";
import { BasicsStep } from "@/components/steps/BasicsStep";
import { VenueStep } from "@/components/steps/VenueStep";
import { CatalogStep } from "@/components/steps/CatalogStep";
import { ReviewStep } from "@/components/steps/ReviewStep";

type Tab = "chat" | "cart";

/** POST to the streaming chat endpoint; relays live status, returns the final payload. */
async function streamChat(
  body: { messages: ChatMessage[]; order: OrderState },
  onStatus: (text: string) => void,
  signal?: AbortSignal
): Promise<{ assistantMessage?: string; order?: OrderState }> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.body) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let final: { assistantMessage?: string; order?: OrderState } = {};
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        try {
          const ev = JSON.parse(line);
          if (ev.type === "status") onStatus(ev.text);
          else if (ev.type === "final") final = { assistantMessage: ev.assistantMessage, order: ev.order };
        } catch {
          /* ignore partial */
        }
      }
    }
  } catch {
    /* aborted by the user — return whatever we have */
  }
  return final;
}

export default function Home() {
  const [order, setOrder] = useState<OrderState>(() => emptyOrder("en"));
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: t("greeting", "en") }]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const toastIdRef = useRef(0);
  const buildModeRef = useRef<{ active: boolean; prefs: string }>({ active: false, prefs: "" });
  const buildBusyRef = useRef(false);
  function showToast(text: string) {
    const id = ++toastIdRef.current;
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }
  const [tab, setTab] = useState<Tab>("chat");
  const [focusSignal, setFocusSignal] = useState(0);
  const [checkout, setCheckout] = useState<null | "ask" | "searching" | "deal">(null);
  const [dealStatus, setDealStatus] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [collabActive, setCollabActive] = useState(0);
  const [votes, setVotes] = useState<Record<string, string[]>>({});
  const clientIdRef = useRef<string>("");
  const sessionRevRef = useRef(0);
  const adoptingRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editIdRef = useRef<string | null>(null);
  const router = useRouter();

  /** Load an existing booking to modify/reschedule it conversationally. */
  async function loadBooking(id: string) {
    try {
      const res = await fetch(`/api/booking/${id}`);
      if (!res.ok) return;
      const d = await res.json();
      if (!d.order) return;
      editIdRef.current = id;
      closeShownRef.current = true; // it's already a booking; no first-time close theatrics
      const base: OrderState = d.order;
      setOrder(base);
      setMessages([]);
      setTab("chat");
      await kickAgent(
        base,
        `[SYSTEM NOTE (always English) — reply ONLY in ${base.language === "ro" ? "Romanian" : "English"}. This is an EXISTING booking (ref ${d.ref}) the customer wants to modify or reschedule. In ONE warm line, confirm you've loaded their package and ask what they'd like to change — the date, an add-on, a package, the venue — then ask_choice 3-4 quick options like "Change the date", "Swap an item", "Add something", "Change the venue". Do NOT rebuild from scratch; keep everything already chosen.]`,
        []
      );
    } catch { /* ignore */ }
  }

  function openOther() {
    setTab("chat");
    setFocusSignal((n) => n + 1);
  }

  const lang = order.language;
  const quote = useMemo(() => computeQuote(order), [order]);
  const evt = eventById(order.eventType);
  const step = evt?.steps[order.stepIndex];
  const honoreeLabel = evt ? tr(evt.honoreeLabel, lang) : t("honorees", lang);

  useEffect(() => {
    setMessages((prev) =>
      prev.length === 1 && prev[0].role === "assistant" ? [{ role: "assistant", content: t("greeting", lang) }] : prev
    );
  }, [lang]);

  const mut = (fn: (o: OrderState) => OrderState) => setOrder((o) => fn(o));

  // --- Agent reacts to on-screen clicks (no typing needed) ---
  const orderRef = useRef(order);
  const messagesRef = useRef(messages);
  const pendingRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const closeShownRef = useRef(false);
  useEffect(() => { orderRef.current = order; }, [order]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // --- Collaborative shared sessions (share a link → plan together live) ---
  function adopt(d: { order?: OrderState; messages?: ChatMessage[]; rev: number; active?: number; votes?: Record<string, string[]> }) {
    sessionRevRef.current = d.rev;
    if (d.active != null) setCollabActive(d.active);
    if (d.votes) setVotes(d.votes);
    adoptingRef.current = true;
    if (d.order) setOrder(d.order);
    if (Array.isArray(d.messages) && d.messages.length) setMessages(d.messages);
    setTimeout(() => { adoptingRef.current = false; }, 60);
  }

  /** Toggle a group vote for an option (shared sessions). */
  async function vote(optionId: string) {
    if (!sessionId) return;
    const me = clientIdRef.current;
    setVotes((prev) => {
      const next: Record<string, string[]> = {};
      for (const k of Object.keys(prev)) next[k] = (prev[k] || []).filter((c) => c !== me);
      const had = (prev[optionId] || []).includes(me);
      next[optionId] = had ? next[optionId] || [] : [...(next[optionId] || []), me];
      return next;
    });
    try {
      const res = await fetch(`/api/session/${sessionId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: me, optionId }),
      });
      const d = await res.json();
      if (d.votes) setVotes(d.votes);
      if (d.rev) sessionRevRef.current = Math.max(sessionRevRef.current, d.rev);
    } catch { /* ignore */ }
  }

  function leaveDeadSession() {
    setSessionId(null);
    setCollabActive(0);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("s");
      window.history.replaceState({}, "", url.toString());
    } catch { /* ignore */ }
  }

  async function joinSession(id: string) {
    try {
      const res = await fetch(`/api/session/${id}?clientId=${clientIdRef.current}`);
      if (res.status === 404) { leaveDeadSession(); return; } // session expired — recover to a normal app
      if (!res.ok) return;
      adopt(await res.json());
    } catch { /* ignore */ }
  }

  async function collaborate() {
    let id = sessionId;
    if (!id) {
      try {
        const res = await fetch("/api/session", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: orderRef.current, messages: messagesRef.current }),
        });
        const d = await res.json();
        if (!d.id) return;
        id = String(d.id);
        setSessionId(id);
        sessionRevRef.current = 1;
        const url = new URL(window.location.href);
        url.searchParams.set("s", id);
        window.history.replaceState({}, "", url.toString());
      } catch { return; }
    }
    const link = `${window.location.origin}/?s=${id}`;
    const text = lang === "ro" ? "Hai să planificăm împreună evenimentul" : "Let's plan the event together";
    if (navigator.share) { try { await navigator.share({ title: "Event Concierge", text, url: link }); return; } catch { /* fall through */ } }
    try { await navigator.clipboard.writeText(link); } catch { /* ignore */ }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`, "_blank");
  }

  // On mount: stable client id + auto-join a shared session from ?s=...
  useEffect(() => {
    clientIdRef.current =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    // Default to Romanian for RO browsers (the customer can still toggle).
    if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("ro")) {
      setOrder((o) => setLanguage(o, "ro"));
    }
    const params = new URLSearchParams(window.location.search);
    const edit = params.get("edit");
    if (edit) { loadBooking(edit); return; }
    const s = params.get("s");
    if (s) { setSessionId(s); joinSession(s); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll the shared session for remote changes + presence.
  useEffect(() => {
    if (!sessionId) return;
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}?clientId=${clientIdRef.current}`);
        if (res.status === 404) { leaveDeadSession(); return; } // stop polling a dead session
        if (!res.ok) return;
        const d = await res.json();
        setCollabActive(d.active ?? 1);
        if (d.votes) setVotes(d.votes);
        if (d.rev > sessionRevRef.current && d.lastWriter !== clientIdRef.current) adopt(d);
        else sessionRevRef.current = Math.max(sessionRevRef.current, d.rev);
      } catch { /* ignore */ }
    }, 2500);
    return () => clearInterval(iv);
  }, [sessionId]);

  // Push local changes to the shared session (debounced; skip echoes of an adopt).
  useEffect(() => {
    if (!sessionId || adoptingRef.current) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: orderRef.current, messages: messagesRef.current, clientId: clientIdRef.current }),
        });
        const d = await res.json();
        if (d.rev) sessionRevRef.current = d.rev;
        if (d.active != null) setCollabActive(d.active);
      } catch { /* ignore */ }
    }, 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, messages, sessionId]);

  // Voting: the cart follows the winning tier — winner's items stay, the other
  // options in the same stack drop out, so the shared cart reflects the vote.
  useEffect(() => {
    if (!sessionId || collabActive <= 1) return;
    const group = order.tiers?.options;
    if (!group || group.length < 2) return;
    let win: (typeof group)[number] | null = null;
    let best = 0;
    let tie = false;
    for (const o of group) {
      const c = votes[o.label]?.length ?? 0;
      if (c > best) { best = c; win = o; tie = false; }
      else if (c === best && c > 0) tie = true;
    }
    if (!win || best === 0 || tie) return;
    const winIds = new Set(win.itemIds);
    const siblingIds = group.flatMap((o) => o.itemIds).filter((id) => !winIds.has(id));
    setOrder((o) => {
      let n = o;
      let changed = false;
      for (const id of siblingIds) if (n.lines.some((l) => l.itemId === id)) { n = toggleItem(n, id); changed = true; }
      for (const id of win!.itemIds) if (!n.lines.some((l) => l.itemId === id)) { n = toggleItem(n, id); changed = true; }
      return changed ? n : o;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [votes, order.tiers, sessionId, collabActive]);

  // Safety net: a tier/choice set already shown this session never renders twice.
  // The agent stays in charge of WHAT to propose; this only blocks an accidental repeat.
  // Block only a CONSECUTIVE duplicate surface (the agent showing the exact same set
  // twice in a row). Re-showing a set later — e.g. packs at finalize if none was
  // picked — is legitimate and allowed.
  const lastSigRef = useRef<string | null>(null);
  useEffect(() => {
    const ti = order.tiers, ch = order.choices;
    let sig: string | null = null;
    if (ti?.options?.length) sig = "t:" + ti.options.map((o) => [...o.itemIds].sort().join(",")).sort().join("|");
    else if (ch?.options?.length) sig = "c:" + ch.options.map((o) => o.label).sort().join("|");
    if (!sig) return;
    if (sig === lastSigRef.current) {
      setOrder((o) => { const n = { ...o }; delete n.tiers; delete n.choices; return n; });
      keepMoving({ ...orderRef.current, tiers: undefined, choices: undefined });
    } else {
      lastSigRef.current = sig;
      nudgeRef.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.tiers, order.choices]);

  function stop() {
    if (timerRef.current) clearTimeout(timerRef.current);
    pendingRef.current = [];
    abortRef.current?.abort();
    setLoading(false);
    setStatus(null);
  }

  const nudgeRef = useRef(0);

  function hasSurface(o?: OrderState | null) {
    return !!(o && (o.tiers?.options?.length || o.choices?.options?.length || o.spotlight?.length || o.discovery?.venues?.length));
  }

  /** Run one agent turn with a system instruction; adopt any surface; then keep the flow moving. */
  async function runTurn(instruction: string) {
    setLoading(true);
    setStatus(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let resultOrder: OrderState | undefined;
    try {
      const data = await streamChat({ messages: [...messagesRef.current, { role: "user", content: instruction }], order: orderRef.current }, setStatus, ctrl.signal);
      resultOrder = data.order;
      if (data.assistantMessage) setMessages((m) => [...m, { role: "assistant", content: data.assistantMessage! }]);
      const tiers = data.order?.tiers;
      const choices = data.order?.choices;
      const spotlight = data.order?.spotlight;
      const discovery = data.order?.discovery;
      if (tiers || choices || spotlight || discovery) {
        setOrder((o) => {
          const n = { ...o };
          delete n.tiers; delete n.choices; delete n.spotlight; delete n.discovery;
          if (tiers) n.tiers = tiers;
          else if (choices) n.choices = choices;
          else if (spotlight) n.spotlight = spotlight;
          else if (discovery) n.discovery = discovery;
          return n;
        });
        setTab("chat");
      }
    } catch {
      /* silent — clicks still worked */
    } finally {
      setLoading(false);
      setStatus(null);
    }
    await keepMoving(resultOrder ?? orderRef.current);
  }

  async function fireReaction() {
    const labels = pendingRef.current;
    pendingRef.current = [];
    if (!labels.length) return;
    nudgeRef.current = 0;
    await runTurn(`[SYSTEM NOTE (always English) — reply ONLY in ${lang === "ro" ? "Romanian" : "English"} and do NOT call set_language. On-screen actions by the customer: ${labels.join("; ")}. React warmly and PERSUASIVELY (2-3 sentences: acknowledge their pick, then PROPOSE the next thing with a planner's reasoning — the standout option, what it adds, and the price vs their budget). Then you MUST move the screen forward to a DIFFERENT not-yet-covered category, choosing the RIGHT tool: recommend_tiers for product categories (cap, album, bars), or ask_choice (NO prices) for the artist GENRE. NEVER bundle mutually-exclusive variants in one tier (no album_2020+album_2030, no toca_digital+toca_painted) — those are ALTERNATIVES. Do NOT re-offer anything in ITEMS ALREADY IN THE CART or ALREADY COVERED BY THE CHOSEN PACK. If a venue was chosen, go to the first service category. If a graduation PACK isn't in the cart yet, show the Base/Expert/VIP tiers. If everything's covered, ask for name+email to finalize. ALWAYS end by surfacing something the customer still needs. NEVER re-ask anything already set; do NOT re-add items already added.]`);
  }

  /** Never let the flow stall: if a turn ended with nothing on screen, push the agent to continue. */
  async function keepMoving(o: OrderState) {
    if (hasSurface(o)) { nudgeRef.current = 0; return; }
    if (!o.eventType) return;                               // pre-event: agent's own flow handles it
    if (o.contact?.name && o.contact?.email) return;        // ready to finalize — nothing to surface
    if (nudgeRef.current >= 2) return;                      // never loop forever
    nudgeRef.current++;
    await runTurn(`[SYSTEM NOTE (always English) — reply ONLY in ${lang === "ro" ? "Romanian" : "English"}. The screen is EMPTY — you ended a turn without putting anything on screen, which is NOT allowed. In ONE short sentence, continue the plan, then IMMEDIATELY call a tool that surfaces something: recommend_tiers for the NEXT not-yet-covered category (if no graduation PACK is in the cart yet, show Base/Expert/VIP), or ask_choice, or — if everything's covered and a venue + pack are in the cart — ask for the customer's name & email to finalize. Do NOT re-offer items already in the cart or covered by the pack. Do NOT stop without a surface.]`);
  }

  function queueReaction(label: string) {
    pendingRef.current.push(label);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fireReaction, 700);
  }

  function handleToggle(id: string) {
    const present = orderRef.current.lines.some((l) => l.itemId === id);
    // On add: clear the current set so the screen refreshes; the agent then brings the next category.
    setOrder((o) => (present ? toggleItem(o, id) : clearTiers(clearSpotlight(toggleItem(o, id)))));
    if (!present) {
      const n = itemById(id)?.name[lang];
      if (n) queueReaction(`added "${n}"`);
    }
  }

  // Pick a bundle tier → add every item in it (skip ones already added) and move on.
  function addTier(ids: string[]) {
    const present = new Set(orderRef.current.lines.map((l) => l.itemId));
    const toAdd = ids.filter((id) => !present.has(id));
    setOrder((o) => { let n = clearTiers(o); for (const id of toAdd) n = addItem(n, id); return n; });
    const names = toAdd.map((id) => itemById(id)?.name[lang]).filter(Boolean);
    if (names.length) queueReaction(`added the bundle: ${names.map((n) => `"${n}"`).join(" + ")}`);
  }

  function handleSelectVenue(v: Venue) {
    setOrder((o) => nextStep(selectVenue(o, v)));
    queueReaction(`chose the venue "${v.name}"`);
  }

  // Custom events keep multiple places (stay + food + transport). Other events pick ONE
  // venue: selecting it replaces any prior one AND clears the list so it disappears and
  // the agent moves on to the next category.
  function handleAddPlace(v: Venue) {
    const isCustom = orderRef.current.eventType === "custom";
    const present = orderRef.current.lines.some((l) => l.itemId === `venue:${v.placeId}`);
    setOrder((o) => (isCustom ? addVenue(o, v) : clearDiscovery(selectVenue(o, v))));
    if (!present) queueReaction(`chose the place "${v.name}"`);
  }

  function handleLocationChosen(city: string) {
    if (city.trim()) queueReaction(`chose ${city} as the location`);
  }

  function handleDateChosen(date: string) {
    if (date.trim()) queueReaction(`set the date to ${date}`);
  }

  const venueIds = new Set(order.lines.filter((l) => l.itemId.startsWith("venue:")).map((l) => l.itemId));

  function goHome() {
    closeShownRef.current = false;
    setOrder((o) => emptyOrder(o.language));
    setMessages([{ role: "assistant", content: t("greeting", lang) }]);
    setTab("chat");
  }

  /** Run one agent turn driven by a hidden system instruction (not shown in chat). */
  async function kickAgent(baseOrder: OrderState, instruction: string, baseMsgs: ChatMessage[]) {
    setLoading(true);
    setStatus(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const data = await streamChat({ messages: [...baseMsgs, { role: "user", content: instruction }], order: baseOrder }, setStatus, ctrl.signal);
      if (data.order) setOrder(data.order);
      if (data.assistantMessage) setMessages([...baseMsgs, { role: "assistant", content: data.assistantMessage }]);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
      setStatus(null);
    }
  }

  async function pickEvent(id: EventTypeId) {
    closeShownRef.current = false;
    const base = setEventType(emptyOrder(lang), id);
    setOrder(base);
    setMessages([]);
    setTab("chat");
    // Agent starts the conversation itself: greet + ask the CITY with choice cards.
    await kickAgent(
      base,
      `[SYSTEM NOTE (always English) — reply ONLY in ${lang === "ro" ? "Romanian" : "English"} and do NOT call set_language. The customer just chose their event type. Greet in ONE short warm line and IMMEDIATELY ask the FIRST question — the CITY — by calling ask_choice with input:"text" and quick options: Constanța, București, Cluj-Napoca, Iași, Timișoara, Brașov. Ask nothing else and do NOT search venues yet.]`,
      []
    );
  }

  /** Answer a choice card; capture a date only when it's a CONCRETE day (has a digit),
   *  so a vague season like "Toamna"/"Summer" goes to the agent to propose real dates. */
  const GENRE_PREFIX: Record<string, string> = { "Pop": "art_pop_", "Hip-Hop": "art_hh_", "Rock & Indie": "art_rock_", "DJ": "art_dj_" };

  function answerChoice(label: string) {
    const cur = orderRef.current;
    // Deterministic: picking an artist genre always shows that genre's artists (never an empty list).
    const prefix = GENRE_PREFIX[label];
    if (prefix && (cur.eventType === "grad_highschool" || cur.eventType === "grad_university")) {
      const ids = CATALOG.filter((i) => i.id.startsWith(prefix)).map((i) => i.id);
      if (ids.length) {
        setMessages((m) => [
          ...m,
          { role: "user", content: label },
          { role: "assistant", content: lang === "ro" ? `Iată artiștii ${label} disponibili — alege-l pe cel dorit (prețuri în € + TVA):` : `Here are the ${label} artists — pick your favourite (prices in € + VAT):` },
        ]);
        setOrder((o) => { const n = clearTiers(clearChoices({ ...o })); n.spotlight = ids; return n; });
        setTab("chat");
        return;
      }
    }
    const concreteDate = cur.choices?.input === "date" && /\d/.test(label);
    // Build mode: once the customer picks the DATE, the agent builds everything itself.
    if (concreteDate && buildModeRef.current.active) {
      setMessages((m) => [...m, { role: "user", content: label }]);
      setOrder((o) => clearChoices(setContext(o, { date: label })));
      void theatricalBuild();
      return;
    }
    const base = concreteDate ? setContext(cur, { date: label }) : cur;
    send(label, base);
  }

  async function send(text: string, baseOrder?: OrderState) {
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    // The customer is answering — drop the previous question's cards immediately
    // so a stale surface never lingers a step behind the chat.
    setOrder((o) => clearTiers(clearChoices(baseOrder ?? o)));
    setLoading(true);
    setStatus(null);
    nudgeRef.current = 0;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let resultOrder: OrderState | undefined;
    try {
      const data = await streamChat({ messages: next, order: baseOrder ?? orderRef.current }, setStatus, ctrl.signal);
      resultOrder = data.order;
      if (data.order) {
        setOrder(data.order);
        if (data.order.spotlight?.length || data.order.discovery?.venues?.length) setTab("chat");
      }
      setMessages([...next, { role: "assistant", content: data.assistantMessage ?? "…" }]);
    } catch {
      setMessages([...next, { role: "assistant", content: lang === "ro" ? "Am întâmpinat o problemă. Mai încearcă." : "I hit a snag. Please try again." }]);
    } finally {
      setLoading(false);
      setStatus(null);
    }
    armBuildMode(text);
    const ob = orderRef.current;
    if (buildModeRef.current.active && ob.context.date && ob.graduates >= 2 && !ob.lines.some((l) => ["sga_base", "sga_expert", "sga_vip"].includes(l.itemId))) {
      void theatricalBuild();
      return;
    }
    await keepMoving(orderRef.current);
  }

  /** Detect a "build it for me" request and ARM build mode. The agent then asks the date
   *  and shows venues; once the customer picks a venue, the package auto-builds theatrically. */
  const BUILD_RE = /(f[ăa]-?mi|fac[- ]?mi|construie?[șs]te|construi|build|surprinde|surprise me|solu[țt]ie|solution|pachet complet|complete package|full package|end.?to.?end)/i;
  function armBuildMode(text: string) {
    const hasBudgetOrComplete = /\b\d{4,6}\b|buget|budget|complet|complete|full|for me|pentru mine/i.test(text);
    if (BUILD_RE.test(text) && hasBudgetOrComplete) buildModeRef.current = { active: true, prefs: text };
  }

  /** Build the package around the already-chosen venue, dropping items into the cart
   *  one by one with a toast for each — the "wow" moment. */
  const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
  async function theatricalBuild() {
    if (buildBusyRef.current) return;
    buildBusyRef.current = true;
    const prefs = buildModeRef.current.prefs;
    buildModeRef.current.active = false;
    setOrder((o) => clearTiers(clearChoices(clearSpotlight(clearDiscovery(o)))));
    setTab("cart");
    setMessages((m) => [...m, { role: "assistant", content: lang === "ro" ? "Perfect — construiesc acum totul pentru tine, în buget. Privește coșul." : "Perfect — I'll build everything for you now, within budget. Watch the cart." }]);
    await pause(500);

    // 1) Venue first (the agent chooses a partner venue — the customer only picked the date).
    if (!orderRef.current.lines.some((l) => l.itemId.startsWith("venue:"))) {
      try {
        const vs = await searchVenues("banquet hall", orderRef.current.context.city ?? "Constanța");
        if (vs[0]) { setOrder((o) => selectVenue(o, vs[0])); showToast((lang === "ro" ? "Locația: " : "Venue: ") + vs[0].name); await pause(750); }
      } catch { /* ignore */ }
    }

    // 2) Pack → food/drink → photo → DJ, one by one, all within budget.
    for (const id of planPackage(orderRef.current, prefs)) {
      const it = itemById(id);
      setOrder((o) => addItem(o, id));
      if (it) showToast((lang === "ro" ? "Adăugat: " : "Added: ") + tr(it.name, lang));
      await pause(750);
    }

    const total = computeQuote(orderRef.current).total;
    setMessages((m) => [...m, { role: "assistant", content: lang === "ro"
      ? `Gata — pachetul complet e în coș, în bugetul tău (total ${money(total)}). Dacă vrei să-l ridici un nivel, uite două adaosuri care fac diferența:`
      : `Done — the full package is in your cart, within budget (total ${money(total)}). To take it up a notch, here are two add-ons that make the difference:` }]);
    // Upsell moment — surface 1-3 premium add-ons not already in the cart.
    await pause(400);
    const inCart = new Set(orderRef.current.lines.map((l) => l.itemId));
    const upsell = ["art_pop_minelli", "sga_sushi_bar", "canvas"].filter((id) => !inCart.has(id)).slice(0, 3);
    if (upsell.length) { setTab("chat"); setOrder((o) => { const n = clearTiers(clearChoices({ ...o })); n.spotlight = upsell; return n; }); }
    buildBusyRef.current = false;
  }

  async function startFromText(text: string) {
    const v = text.trim();
    if (!v) return;
    const detected = detectLang(v);
    const userMsg: ChatMessage = { role: "user", content: v };
    setMessages([userMsg]);
    setOrder((o) => setLanguage(o, detected));
    setLoading(true);
    setStatus(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let resultOrder: OrderState | undefined;
    try {
      const data = await streamChat({ messages: [userMsg], order: { ...orderRef.current, language: detected } }, setStatus, ctrl.signal);
      resultOrder = data.order;
      if (data.order) setOrder(data.order);
      setMessages([userMsg, { role: "assistant", content: data.assistantMessage ?? "…" }]);
    } catch {
      setMessages([userMsg, { role: "assistant", content: detected === "ro" ? "Am întâmpinat o problemă. Mai încearcă." : "I hit a snag. Please try again." }]);
    } finally {
      setLoading(false);
      setStatus(null);
    }
    armBuildMode(v);
    await keepMoving(orderRef.current);
  }

  async function toggleLang() {
    const target: Lang = lang === "en" ? "ro" : "en";
    setOrder((o) => setLanguage(o, target));

    // Translate BOTH the chat AND the on-screen surface (choice/tier questions & labels).
    const msgs = messagesRef.current.map((m) => m.content);
    const ch = orderRef.current.choices;
    const ti = orderRef.current.tiers;
    const surface: string[] = [];
    if (ch) { surface.push(ch.question ?? ""); ch.options.forEach((o) => { surface.push(o.label); surface.push(o.desc ?? ""); }); }
    if (ti) { surface.push(ti.question ?? ""); ti.options.forEach((o) => surface.push(o.label)); }
    const texts = [...msgs, ...surface];
    if (!texts.length) return;

    setLoading(true);
    setStatus(target === "ro" ? "Traduc conversația…" : "Translating…");
    try {
      const res = await fetch("/api/translate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts, target }),
      });
      const d = await res.json();
      if (!Array.isArray(d.texts) || d.texts.length !== texts.length) return;
      const tr2 = d.texts as string[];
      setMessages((prev) => (prev.length === msgs.length ? prev.map((m, i) => ({ ...m, content: tr2[i] })) : prev));
      // Re-map the surface translations back onto choices/tiers.
      let k = msgs.length;
      setOrder((o) => {
        const n = { ...o };
        if (n.choices) {
          const q = tr2[k++]; const opts = n.choices.options.map((op) => ({ ...op, label: tr2[k++], desc: op.desc ? tr2[k++] : op.desc }));
          n.choices = { ...n.choices, question: q || n.choices.question, options: opts };
        }
        if (n.tiers) {
          const q = tr2[k++]; const opts = n.tiers.options.map((op) => ({ ...op, label: tr2[k++] }));
          n.tiers = { ...n.tiers, question: q || n.tiers.question, options: opts };
        }
        return n;
      });
    } catch {
      /* keep originals */
    } finally {
      setLoading(false);
      setStatus(null);
    }
  }

  async function shareDraft() {
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      const data = await res.json();
      if (!data.id) return;
      const url = `${window.location.origin}/booking/${data.id}`;
      const text =
        (lang === "ro" ? "Uite pachetul nostru de eveniment" : "Check out our event package") + ` · ${money(quote.total)}`;
      if (navigator.share) {
        try {
          await navigator.share({ title: "Event package", text, url });
          return;
        } catch {
          /* fall through to WhatsApp */
        }
      }
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text}: ${url}`)}`, "_blank");
    } catch {
      /* ignore */
    }
  }

  /** The agent applies the unlocked discount + a conditional free gift, framed in products. */
  async function runSupplierDeal() {
    const ro = lang === "ro";
    const instr = `[SYSTEM NOTE (always English) — reply ONLY in ${ro ? "Romanian" : "English"} and do NOT call set_language. You've just run an extended search across partner suppliers and UNLOCKED a special discount (no fake phone calls — frame it as "I searched our suppliers and unlocked a deal"). In their language, 2-3 short warm sentences framed in PRODUCTS — never raw percentages:
1) CALL negotiate_discount(5), and JUSTIFY it with a specific item ALREADY in their package: "because you chose **<one item they already have>**, I unlocked a special discount on the whole package" (don't quote the % coldly).
2) Then a conditional gift the supplier offers: "and there's more — if you ALSO add **<Z: a nicer/pricier item they DON'T have yet>**, you get **<W: a smaller delight, ~€100-200>** for FREE". recommend_items Z and W so they appear on screen to tap.
Do NOT finalize the booking; invite them to press Finalize again when ready.]`;
    setLoading(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const data = await streamChat({ messages: [...messagesRef.current, { role: "user", content: instr }], order: orderRef.current }, setStatus, ctrl.signal);
      if (data.order) setOrder(data.order);
      if (data.assistantMessage) setMessages((m) => [...m, { role: "assistant", content: data.assistantMessage! }]);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setStatus(null);
    }
  }

  /** Modal "unlock a deal": theatrical supplier search, then the agent locks the discount. */
  async function unlockDeal() {
    closeShownRef.current = true;
    setCheckout("searching");
    const ro = lang === "ro";
    const stages = ro
      ? ["Caut la furnizorii noștri o ofertă mai bună…", "Verific reducerile disponibile la parteneri…", "Am găsit ceva!", "Am deblocat un discount special!"]
      : ["Searching our partner suppliers…", "Checking available partner discounts…", "Found something!", "Unlocked a special discount!"];
    for (let i = 0; i < stages.length; i++) {
      setDealStatus(stages[i]);
      await new Promise((r) => setTimeout(r, i < stages.length - 1 ? 2800 : 1200));
    }
    await runSupplierDeal();
    setCheckout("deal");
  }

  async function doBook() {
    setConfirming(true);
    try {
      const res = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderRef.current, editId: editIdRef.current }),
      });
      const data = await res.json();
      if (data.id) router.push(`/booking/${data.id}`);
      else throw new Error();
    } catch {
      setConfirming(false);
    }
  }

  async function confirm() {
    if (checkout) return; // modal already open — never stack/repeat it
    // First press of Finalize → open the checkout modal (sure-you-don't-want + unlock a deal).
    if (!closeShownRef.current && quote.total > 0) {
      setCheckout("ask");
      return;
    }
    await doBook();
  }

  const isLast = evt ? order.stepIndex >= evt.steps.length - 1 : false;
  const canContinue = step?.kind === "basics" && step.field === "location" ? Boolean(order.context.city) : true;
  const paneH = "h-[calc(100dvh-150px)] lg:h-[calc(100dvh-104px)]";
  const show = (which: Tab) => (tab === which ? "flex" : "hidden") + " lg:flex";
  // Mobile: swipe left → cart, right → chat.
  const touchX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 60) return;
    setTab(dx < 0 ? "cart" : "chat");
  };

  // The agent's current surface, rendered inline in the conversation under the chat.
  const voting =
    sessionId && collabActive > 1
      ? {
          count: (id: string) => votes[id]?.length ?? 0,
          mine: (id: string) => votes[id]?.includes(clientIdRef.current) ?? false,
          onVote: vote,
        }
      : undefined;

  const skipCategory = (
    <button
      onClick={() => send(lang === "ro" ? "sări peste categoria asta — arată-mi următoarea categorie DIFERITĂ, nu aceeași" : "skip this category — show me the NEXT, DIFFERENT category, not the same one")}
      className="text-[13px] text-ink-soft underline-offset-2 transition hover:text-ink hover:underline"
    >
      {lang === "ro" ? "Sari peste această categorie →" : "Skip this category →"}
    </button>
  );
  const surface = order.tiers?.options?.length ? (
    <div className="space-y-3">
      {order.tiers.question && (
        <div className="space-y-2"><div className="rule-gold" /><h3 className="text-display text-[24px] leading-tight text-ink">{order.tiers.question}</h3></div>
      )}
      <VariantCarousel
        lang={lang}
        voting={voting}
        items={order.tiers.options.map((o) => {
          const resolved = o.itemIds.map((id) => itemById(id)).filter(Boolean) as NonNullable<ReturnType<typeof itemById>>[];
          const first = resolved[0];
          const names = resolved.map((it) => tr(it.name, lang));
          const bullets = first?.includes ? first.includes[lang] : names;
          // Show the per-graduate price (as in the PDF) + the class total so they correlate.
          const perGrad = resolved.reduce((s, it) => s + (it.unit === "per_graduate" ? it.price : 0), 0);
          const price = perGrad > 0
            ? `${money(perGrad)}/${lang === "ro" ? "abs." : "grad"} · ${money(o.total)}`
            : money(o.total);
          return {
            id: o.label,
            src: first ? itemImage(first) : "",
            title: o.label,
            subtitle: names.slice(0, 3).join(" · "),
            price,
            images: resolved.map((it) => itemImage(it)),
            bullets,
          };
        })}
        onSelect={(id) => { const o = order.tiers!.options.find((t) => t.label === id); if (o) addTier(o.itemIds); }}
      />
      {skipCategory}
    </div>
  ) : order.choices?.options?.length ? (
    <ChoiceCards
      question={order.choices.question}
      options={order.choices.options}
      input={order.choices.input}
      lang={lang}
      onPick={answerChoice}
      onOther={openOther}
      voting={voting}
    />
  ) : order.spotlight && order.spotlight.length > 0 ? (
    <div className="space-y-3">
      <VariantCarousel
        lang={lang}
        voting={voting}
        selectedId={order.lines.map((l) => l.itemId).find((id) => order.spotlight!.includes(id))}
        items={order.spotlight.map((id) => {
          const it = itemById(id);
          return {
            id,
            src: it ? itemImage(it) : "",
            title: it ? tr(it.name, lang) : id,
            subtitle: it ? tr(it.description, lang) : "",
            price: it ? money(it.price, it.currency) : undefined,
            images: it ? [itemImage(it)] : [],
            bullets: it?.includes ? it.includes[lang] : it ? [tr(it.description, lang)] : [],
          };
        })}
        onSelect={handleToggle}
      />
      {skipCategory}
    </div>
  ) : order.discovery?.venues?.length ? (
    <div className="space-y-2">
      {order.discovery.query && (
        <div className="space-y-2">
          <div className="rule-gold" />
          <h3 className="text-display text-[22px] leading-tight text-ink">{order.discovery.query}</h3>
        </div>
      )}
      <VariantCarousel
        lang={lang}
        selectedId={[...venueIds][0]}
        items={order.discovery.venues.map((v) => ({
          id: `venue:${v.placeId}`,
          src: v.photoUrl,
          title: v.name,
          subtitle: v.rating ? `★ ${v.rating}${v.reviews ? ` · ${v.reviews} ${t("reviews", lang)}` : ""}` : v.address,
          price: v.estPricePerGuest
            ? `${money(v.estPricePerGuest)}/${t("perGuest", lang)}`
            : v.estFlatPrice
              ? `${t("from", lang)} ${money(v.estFlatPrice)}`
              : (lang === "ro" ? "Inclus în banchet" : "Included in banquet"),
          href: v.mapsUrl,
          images: v.photos,
          bullets: [
            v.address,
            v.rating ? `★ ${v.rating}${v.reviews ? ` · ${v.reviews} ${t("reviews", lang)}` : ""}` : null,
            lang === "ro" ? "Locație parteneră — inclusă în banchet" : "Partner venue — included in the banquet",
          ].filter((x): x is string => Boolean(x)),
        }))}
        onSelect={(id) => {
          const v = order.discovery!.venues.find((x) => `venue:${x.placeId}` === id);
          if (v) handleAddPlace(v);
        }}
        voting={voting}
      />
    </div>
  ) : (messages.length <= 1 && !order.eventType && order.lines.length === 0) ? (
    <div className="animate-rise space-y-3">
      <div className="rule-gold" />
      <h3 className="text-display text-[20px] leading-tight text-ink">{lang === "ro" ? "Începe cu un exemplu" : "Start with an example"}</h3>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {(lang === "ro"
          ? [
              "Avem nevoie de o soluție pentru o absolvire de liceu în Constanța, 200 de absolvenți și 40 de invitați, buget 50.000 lei. Fă-mi tu pachetul complet.",
              "Fă-mi un banchet de absolvire complet în Constanța pentru 150 de absolvenți, buget 80.000 lei, cu DJ.",
            ]
          : [
              "We need a solution for a highschool graduation in Constanța, 200 graduates and 40 guests, budget 50,000 RON. Build the full package for me.",
              "Build a complete graduation banquet in Constanța for 150 graduates, budget 80,000 RON, with a DJ.",
            ]
        ).map((p) => (
          <button key={p} onClick={() => send(p)} className="card-soft rounded-2xl p-4 text-left text-[13.5px] leading-snug text-ink transition hover:-translate-y-0.5 hover:border-gold/55">
            {p}
          </button>
        ))}
      </div>
      <p className="text-[12px] text-ink-soft/70">{lang === "ro" ? "…sau scrie cererea ta mai jos." : "…or type your own request below."}</p>
    </div>
  ) : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[1480px] flex-col px-3 pb-3 sm:px-6">
      {toasts.length > 0 && (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
          {toasts.map((tt) => (
            <div key={tt.id} className="animate-rise rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-ivory shadow-[0_12px_30px_-10px_rgba(38,35,32,.6)]">✓ {tt.text}</div>
          ))}
        </div>
      )}
      {tab === "chat" && quote.lines.length > 0 && (
        <button onClick={() => setTab("cart")} className="no-print fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-ink px-5 py-3 text-[13px] font-medium text-ivory shadow-[0_16px_36px_-12px_rgba(38,35,32,.7)] lg:hidden">
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1.5 text-[11px] font-semibold">{quote.lines.length}</span>
          <span className="text-gold-soft">{money(quote.total)}</span>
          <span>{lang === "ro" ? "Vezi coșul →" : "View cart →"}</span>
        </button>
      )}
      <Header
        lang={lang}
        eventName={evt ? tr(evt.name, lang) : null}
        onHome={goHome}
        onToggleLang={toggleLang}
        onCollaborate={collaborate}
        collabActive={collabActive}
      />

      {messages.length === 0 ? (
        <Landing lang={lang} loading={loading} onStart={startFromText} onPick={pickEvent} />
      ) : (
        <>
          {/* Mobile tab bar */}
          <div className="no-print mb-3 flex gap-1 rounded-full border border-ink/10 bg-white p-1 text-sm lg:hidden">
            <TabBtn active={tab === "chat"} onClick={() => setTab("chat")}>{lang === "ro" ? "Conversație" : "Conversation"}</TabBtn>
            <TabBtn active={tab === "cart"} onClick={() => setTab("cart")}>
              <span className="inline-flex items-center gap-1.5">
                {lang === "ro" ? "Coș" : "Cart"}
                {quote.lines.length > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1.5 text-[11px] font-semibold text-white">{quote.lines.length}</span>}
                · {money(quote.total)}
              </span>
            </TabBtn>
          </div>
          <p className="no-print mb-2 text-center text-[11px] text-ink-soft/60 lg:hidden">{lang === "ro" ? "← glisează între conversație și coș →" : "← swipe between conversation and cart →"}</p>

          <div className="grid flex-1 gap-4 lg:grid-cols-12" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            {/* Conversation — chat + inline choice/venue/product cards in ONE column */}
            <section className={`card-soft ${show("chat")} ${paneH} flex-col p-4 lg:col-span-8`}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PanelTitle>{t("brand", lang)}</PanelTitle>
                  <OnlineClassmates
                    lang={lang}
                    label={
                      lang === "ro"
                        ? order.eventType === "wedding" ? "cupluri online" : order.eventType === "custom" ? "persoane online" : "colegi online"
                        : order.eventType === "wedding" ? "couples online" : order.eventType === "custom" ? "people online" : "classmates online"
                    }
                  />
                </div>
                <button onClick={() => setTab("cart")} className="lg:pointer-events-none" title={lang === "ro" ? "Vezi coșul" : "View cart"}>
                  <RunningTotal total={quote.total} budget={order.context.budget} lang={lang} />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <Chat
                  messages={messages}
                  lang={lang}
                  loading={loading}
                  statusText={status}
                  onSend={send}
                  onStop={stop}
                  focusSignal={focusSignal}
                  surface={surface}
                />
              </div>
            </section>

            {/* Cart */}
            <section className={`card-soft ${show("cart")} ${paneH} flex-col p-4 lg:col-span-4`}>
              <CartPanel
                order={order}
                quote={quote}
                lang={lang}
                confirming={confirming}
                honoreeLabel={honoreeLabel}
                onSetGraduates={(n) => mut((o) => setGraduates(o, n))}
                onSetGuests={(n) => mut((o) => setGuests(o, n))}
                onApplyPromo={(code) => mut((o) => applyPromo(o, code))}
                onRemove={(id) => mut((o) => toggleItem(o, id))}
                onSetContact={(c: Contact) => mut((o) => setContact(o, c))}
                onConfirm={confirm}
                onShare={shareDraft}
              />
            </section>
          </div>

          <AnimatePresence>
            {checkout && (
              <CheckoutModal
                stage={checkout}
                dealStatus={dealStatus}
                suggested={checkout === "ask" ? suggestedExtra(order) : undefined}
                discounts={quote.discounts}
                upsells={(order.spotlight ?? [])
                  .map((id) => itemById(id))
                  .filter((i): i is CatalogItem => Boolean(i) && !order.lines.some((l) => l.itemId === i!.id))}
                total={quote.total}
                lang={lang}
                confirming={confirming}
                onAdd={(id) => handleToggle(id)}
                onUnlock={unlockDeal}
                onFinalize={() => { setCheckout(null); doBook(); }}
                onClose={() => setCheckout(null)}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </main>
  );
}

function suggestedExtra(order: OrderState): CatalogItem | undefined {
  const have = new Set(order.lines.map((l) => l.itemId));
  const ev = order.eventType;
  const pool = CATALOG.filter(
    (i) => (i.eventTypes.length === 0 || (ev && i.eventTypes.includes(ev))) && !have.has(i.id)
  );
  return pool.find((i) => i.popular) ?? pool[0];
}

function CheckoutModal({
  stage,
  dealStatus,
  suggested,
  discounts,
  upsells,
  total,
  lang,
  confirming,
  onAdd,
  onUnlock,
  onFinalize,
  onClose,
}: {
  stage: "ask" | "searching" | "deal";
  dealStatus: string;
  suggested?: CatalogItem;
  discounts: Discount[];
  upsells: CatalogItem[];
  total: number;
  lang: Lang;
  confirming: boolean;
  onAdd: (id: string) => void;
  onUnlock: () => void;
  onFinalize: () => void;
  onClose: () => void;
}) {
  const ro = lang === "ro";
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-3 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={stage === "searching" ? undefined : onClose}
    >
      <motion.div
        className="w-full max-w-md overflow-hidden rounded-3xl bg-card p-6 shadow-2xl"
        initial={{ scale: 0.95, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-display text-xl text-ink">{ro ? "Aproape gata" : "Almost there"}</h3>
          <span className="rounded-full bg-gold/10 px-3 py-1 text-[13px] font-medium text-gold-deep">{money(total)}</span>
        </div>

        {stage === "ask" && (
          <div className="space-y-4">
            {suggested ? (
              <div className="rounded-2xl border border-gold/25 bg-gold/[0.05] p-4">
                <p className="text-sm text-ink-soft">
                  {ro ? "Ești sigur că nu vrei și " : "Sure you don't want "}
                  <span className="font-semibold text-ink">{tr(suggested.name, lang)}</span>
                  {ro ? "? Mulți îl adaugă." : " too? Most people add it."}
                  <span className="ml-1 text-gold-deep">({money(suggested.price)}{suggested.unit !== "flat" ? (ro ? "/buc" : "/ea") : ""})</span>
                </p>
                <button onClick={() => onAdd(suggested.id)} className="btn-gold mt-3 w-full rounded-full py-2.5 text-sm font-semibold">
                  {ro ? "Adaugă-l" : "Add it"}
                </button>
              </div>
            ) : null}

            <button onClick={onUnlock} className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-ivory transition hover:bg-ink/90">
              {ro ? "Caută-mi o ofertă mai bună" : "Unlock me a better deal"}
            </button>
            <button onClick={onFinalize} disabled={confirming} className="btn-champagne w-full py-3 text-sm font-semibold disabled:opacity-50">
              {confirming ? "…" : (ro ? `Finalizează acum · ${money(total)}` : `Finalize now · ${money(total)}`)}
            </button>
            <button onClick={onClose} className="w-full text-center text-[13px] text-ink-soft hover:text-ink">
              {ro ? "Mai văd" : "Keep looking"}
            </button>
          </div>
        )}

        {stage === "searching" && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
            <p className="text-sm text-ink-soft">{dealStatus}</p>
          </div>
        )}

        {stage === "deal" && (
          <div className="space-y-4 py-1">
            <div className="rounded-xl border border-ink/12 bg-ivory/50 p-4 text-center">
              <p className="text-sm text-ink">
                {ro ? "Am deblocat un discount special pentru pachetul tău!" : "Unlocked a special discount on your package!"}
              </p>
              {discounts.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {discounts.map((d) => (
                    <div key={d.code} className="text-[13px] text-gold-deep">
                      {tr(d.label, lang)} · <span className="font-semibold">−{money(d.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-1 text-display text-2xl text-gold-deep">{money(total)}</p>
            </div>

            {upsells.length > 0 && (
              <div className="rounded-2xl border border-gold/20 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep/80">
                  {ro ? "Adaugă și primești extra" : "Add & unlock extras"}
                </p>
                <div className="space-y-2">
                  {upsells.slice(0, 3).map((it) => (
                    <div key={it.id} className="flex items-center justify-between gap-2 rounded-xl bg-ivory/60 px-3 py-2">
                      <span className="min-w-0 truncate text-[13px] text-ink">
                        {tr(it.name, lang)} <span className="text-ink-soft">· {money(it.price)}</span>
                      </span>
                      <button onClick={() => onAdd(it.id)} className="btn-gold shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold">
                        {ro ? "Adaugă" : "Add"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={onFinalize} disabled={confirming} className="btn-champagne w-full py-3 text-sm font-semibold disabled:opacity-50">
              {confirming ? "…" : (ro ? `Finalizează · ${money(total)}` : `Finalize · ${money(total)}`)}
            </button>
            <button onClick={onClose} className="w-full text-center text-[13px] text-ink-soft hover:text-ink">
              {ro ? "Mai adaug ceva" : "Add something more"}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function Header({
  lang,
  eventName,
  onHome,
  onToggleLang,
  onCollaborate,
  collabActive,
}: {
  lang: Lang;
  eventName: string | null;
  onHome: () => void;
  onToggleLang: () => void;
  onCollaborate: () => void;
  collabActive: number;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 py-3 sm:py-4">
      <div className="flex min-w-0 items-center gap-2">
        <button onClick={onHome} className="text-display text-lg tracking-tight text-ink transition hover:opacity-70 sm:text-xl" aria-label="home">
          {t("brand", lang)}
        </button>
        {eventName && (
          <button onClick={onHome} className="no-print inline-flex max-w-[60vw] items-center gap-1 truncate rounded-full border border-ink/12 bg-ivory px-2.5 py-1 text-[12px] text-ink-soft transition hover:border-ink/25 sm:max-w-none">
            {eventName} <span className="opacity-50">· {t("home", lang)}</span>
          </button>
        )}
      </div>
      <div className="no-print flex items-center gap-2">
        {eventName && (
          <button
            onClick={onCollaborate}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
              collabActive > 1 ? "border-ink/25 bg-ivory text-ink" : "border-ink/12 text-ink-soft hover:border-ink/25 hover:text-ink"
            }`}
            title={lang === "ro" ? "Planificați împreună" : "Plan together"}
          >
            {collabActive > 1 ? (
              <>
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500/50" /><span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" /></span>
                {collabActive} {lang === "ro" ? "live" : "live"}
              </>
            ) : (
              <>{lang === "ro" ? "Invită clasa" : "Invite the class"}</>
            )}
          </button>
        )}
        <div className="flex items-center rounded-full border border-ink/10 bg-white p-0.5 text-sm">
        {(["en", "ro"] as const).map((l) => (
          <button key={l} onClick={() => l !== lang && onToggleLang()} className={`rounded-full px-3 py-1 font-medium transition ${lang === l ? "bg-ink text-ivory" : "text-ink-soft hover:text-ink"}`}>
            {l.toUpperCase()}
          </button>
        ))}
        </div>
      </div>
    </header>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex-1 truncate rounded-full px-3 py-2 font-medium transition ${active ? "bg-ink text-ivory" : "text-ink-soft"}`}>
      {children}
    </button>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-deep/80">{children}</h2>;
}

/** Always-visible running cost, with a budget bar when a budget is set. */
function RunningTotal({ total, budget, lang }: { total: number; budget?: number; lang: Lang }) {
  if (!budget) {
    return (
      <span className="rounded-full border border-gold/25 bg-gold/8 px-3 py-1 text-[12px] font-medium text-gold-deep">
        {lang === "ro" ? "Total" : "Total"}: <span className="text-display">{money(total)}</span>
      </span>
    );
  }
  const pct = Math.min(100, Math.round((total / budget) * 100));
  const over = total > budget;
  return (
    <div className="min-w-[150px]">
      <div className="flex items-center justify-between text-[11px]">
        <span className={over ? "font-semibold text-wine" : "text-ink-soft"}>
          {money(total)} / {money(budget)}
        </span>
        <span className={over ? "text-wine" : "text-gold-deep"}>{over ? (lang === "ro" ? "peste buget" : "over") : `${pct}%`}</span>
      </div>
      <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-ink/8">
        <div className={`h-full rounded-full transition-all ${over ? "bg-wine" : "bg-gold"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function detectLang(text: string): Lang {
  const t = ` ${text.toLowerCase()} `;
  if (/[ăâîșțţ]/.test(t)) return "ro";
  const ro = ["nunta", "nuntă", "absolvire", "vreau", "munte", "mare", "buget", "invitati", "invitați", "petrecere", "liceu", "facultate", " si ", " la "];
  return ro.some((w) => t.includes(w)) ? "ro" : "en";
}

function Landing({
  lang,
  loading,
  onStart,
  onPick,
}: {
  lang: Lang;
  loading: boolean;
  onStart: (text: string) => void;
  onPick: (id: EventTypeId) => void;
}) {
  const [text, setText] = useState("");
  const examples =
    lang === "ro"
      ? [
          "Avem nevoie de o soluție pentru o absolvire de liceu în Constanța, 200 de absolvenți și 40 de invitați, buget 50.000 lei. Fă-mi tu pachetul complet.",
          "Fă-mi un banchet de absolvire complet în Constanța pentru 150 de absolvenți, buget 80.000 lei, cu DJ.",
        ]
      : [
          "We need a solution for a highschool graduation in Constanța, 200 graduates and 40 guests, budget 50,000 RON. Build the full package for me.",
          "Build a complete graduation banquet in Constanța for 150 graduates, budget 80,000 RON, with a DJ.",
        ];
  return (
    <div className="mx-auto w-full max-w-2xl py-14 sm:py-20">
      <div className="animate-rise flex flex-col items-center text-center">
        <div className="kicker">{lang === "ro" ? "Event Concierge" : "Event Concierge"}</div>
        <div className="rule-gold mt-4" />
        <h1 className="text-display mt-5 text-5xl leading-[1.04] text-ink sm:text-6xl">
          {lang === "ro" ? "Ce planificăm?" : "What are we planning?"}
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
          {lang === "ro"
            ? "Descrie evenimentul tău într-o frază, iar eu construiesc pachetul complet — locații reale, furnizori, preț."
            : "Describe your event in one line and I'll build the full package — real venues, vendors and pricing."}
        </p>
      </div>

      <div className="animate-rise mt-6 flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onStart(text);
            }
          }}
          rows={2}
          placeholder={lang === "ro" ? "ex. Banchet de liceu în Constanța, 100 de absolvenți, buget ~30.000 RON…" : "e.g. A highschool banquet in Constanța, 100 graduates, ~30,000 RON…"}
          className="card-soft min-h-[60px] flex-1 resize-none rounded-2xl px-4 py-3 text-base outline-none focus:border-gold"
        />
        <button
          onClick={() => onStart(text)}
          disabled={loading || !text.trim()}
          className="btn-gold grid h-[60px] w-[60px] place-items-center rounded-2xl text-xl disabled:opacity-50"
          aria-label="start"
        >
          {loading ? "…" : "↑"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {examples.map((ex) => (
          <button key={ex} onClick={() => onStart(ex)} className="rounded-full border border-ink/10 px-3 py-1.5 text-[12px] text-ink-soft transition hover:border-gold/40 hover:text-ink">
            {ex}
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-[12px] text-ink-soft/60">
        {lang === "ro" ? "Absolvire de liceu sau de facultate — îți construiesc pachetul în conversație." : "Highschool or university graduation — I'll build your package right in the chat."}
      </p>
    </div>
  );
}

function EmptyStage({ lang, onOther }: { lang: Lang; onOther: () => void }) {
  return (
    <div className="animate-rise flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-ink/15 p-8 text-center">
      <p className="max-w-sm text-sm text-ink-soft">
        {lang === "ro"
          ? "Spune-mi ce-ți dorești și-ți aduc aici variante reale — locații, foto, muzică — pe care le alegi cu un click."
          : "Tell me what you'd like and I'll bring real options here — venues, photo, music — to pick with one tap."}
      </p>
      <button onClick={onOther} className="btn-gold mt-4 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold">
        {lang === "ro" ? "Scrie ce vrei" : "Type what you want"}
      </button>
    </div>
  );
}

function SpotlightPanel({
  ids,
  lang,
  selectedIds,
  onToggle,
  onDismiss,
}: {
  ids: string[];
  lang: Lang;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onDismiss: () => void;
}) {
  // Hide items already in the cart — once added, they disappear from the middle.
  const items = ids.map((id) => itemById(id)).filter((i) => i && !selectedIds.has(i.id));
  if (!items.length) return null;
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft">
          {lang === "ro" ? "Recomandări" : "Recommendations"}
        </span>
        <button onClick={onDismiss} className="text-ink-soft/60 hover:text-ink" aria-label="dismiss">✕</button>
      </div>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        {items.map((item) => (
          <CatalogCard key={item!.id} item={item!} lang={lang} selected={selectedIds.has(item!.id)} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}
