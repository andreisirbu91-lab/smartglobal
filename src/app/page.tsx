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
import { money, tr } from "@/lib/format";
import { t } from "@/lib/i18n";
import { Chat, type ChatMessage } from "@/components/Chat";
import { CartPanel } from "@/components/CartPanel";
import { EventPicker } from "@/components/EventPicker";
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
  const [tab, setTab] = useState<Tab>("chat");
  const [focusSignal, setFocusSignal] = useState(0);
  const [checkout, setCheckout] = useState<null | "ask" | "searching" | "deal">(null);
  const [dealStatus, setDealStatus] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [collabActive, setCollabActive] = useState(0);
  const clientIdRef = useRef<string>("");
  const sessionRevRef = useRef(0);
  const adoptingRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

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
  function adopt(d: { order?: OrderState; messages?: ChatMessage[]; rev: number; active?: number }) {
    sessionRevRef.current = d.rev;
    if (d.active != null) setCollabActive(d.active);
    adoptingRef.current = true;
    if (d.order) setOrder(d.order);
    if (Array.isArray(d.messages) && d.messages.length) setMessages(d.messages);
    setTimeout(() => { adoptingRef.current = false; }, 60);
  }

  async function joinSession(id: string) {
    try {
      const res = await fetch(`/api/session/${id}?clientId=${clientIdRef.current}`);
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
    const s = new URLSearchParams(window.location.search).get("s");
    if (s) { setSessionId(s); joinSession(s); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll the shared session for remote changes + presence.
  useEffect(() => {
    if (!sessionId) return;
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}?clientId=${clientIdRef.current}`);
        if (!res.ok) return;
        const d = await res.json();
        setCollabActive(d.active ?? 1);
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

  function stop() {
    if (timerRef.current) clearTimeout(timerRef.current);
    pendingRef.current = [];
    abortRef.current?.abort();
    setLoading(false);
    setStatus(null);
  }

  async function fireReaction() {
    const labels = pendingRef.current;
    pendingRef.current = [];
    if (!labels.length) return;
    const instruction = `[SYSTEM NOTE (always English) — reply ONLY in ${lang === "ro" ? "Romanian" : "English"} and do NOT call set_language. On-screen actions by the customer: ${labels.join("; ")}. React warmly and briefly (1-2 sentences). If they CHOSE A VENUE/PLACE: acknowledge in ONE line and IMMEDIATELY move to the FIRST service category — call recommend_items (2-3 best add-ons like menu/photo/music) OR ask_choice for the next decision so the screen never goes empty. If they ADDED an item: acknowledge with one concrete detail AND immediately call recommend_items for the NEXT 1-2 complementary upgrades (or ask_choice the next category) — never end without a fresh surface. You MUST end this turn by calling a tool that puts something new on the screen (recommend_items, discover_places, or ask_choice). NEVER re-ask for anything already set. Do NOT re-add items already added.]`;
    setLoading(true);
    setStatus(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const data = await streamChat({ messages: [...messagesRef.current, { role: "user", content: instruction }], order: orderRef.current }, setStatus, ctrl.signal);
      if (data.assistantMessage) setMessages((m) => [...m, { role: "assistant", content: data.assistantMessage! }]);
      // Adopt the agent's fresh surface — tiers, choice cards, recommendations OR discovered places.
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
  }

  function queueReaction(label: string) {
    pendingRef.current.push(label);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fireReaction, 700);
  }

  function handleToggle(id: string) {
    const present = orderRef.current.lines.some((l) => l.itemId === id);
    setOrder((o) => toggleItem(o, id));
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
  function answerChoice(label: string) {
    const cur = orderRef.current;
    const concreteDate = cur.choices?.input === "date" && /\d/.test(label);
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
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const data = await streamChat({ messages: next, order: baseOrder ?? orderRef.current }, setStatus, ctrl.signal);
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
    try {
      const data = await streamChat({ messages: [userMsg], order: { ...orderRef.current, language: detected } }, setStatus, ctrl.signal);
      if (data.order) setOrder(data.order);
      setMessages([userMsg, { role: "assistant", content: data.assistantMessage ?? "…" }]);
    } catch {
      setMessages([userMsg, { role: "assistant", content: detected === "ro" ? "Am întâmpinat o problemă. Mai încearcă." : "I hit a snag. Please try again." }]);
    } finally {
      setLoading(false);
      setStatus(null);
    }
  }

  async function toggleLang() {
    const target: Lang = lang === "en" ? "ro" : "en";
    setOrder((o) => setLanguage(o, target));
    const texts = messagesRef.current.map((m) => m.content);
    if (!texts.length) return;
    setLoading(true);
    setStatus(target === "ro" ? "Traduc conversația…" : "Translating the chat…");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts, target }),
      });
      const d = await res.json();
      if (Array.isArray(d.texts) && d.texts.length === texts.length) {
        setMessages((prev) => (prev.length === d.texts.length ? prev.map((m, i) => ({ ...m, content: d.texts[i] })) : prev));
      }
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
        body: JSON.stringify({ order: orderRef.current }),
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

  // The agent's current surface, rendered inline in the conversation under the chat.
  const skipCategory = (
    <button
      onClick={() => send(lang === "ro" ? "sări peste această categorie, mergem mai departe" : "skip this category, let's move on")}
      className="text-[13px] text-ink-soft underline-offset-2 transition hover:text-ink hover:underline"
    >
      {lang === "ro" ? "Sari peste această categorie →" : "Skip this category →"}
    </button>
  );
  const surface = order.tiers?.options?.length ? (
    <div className="space-y-3">
      <TierCards question={order.tiers.question} options={order.tiers.options} lang={lang} onPick={addTier} />
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
    />
  ) : order.spotlight && order.spotlight.length > 0 ? (
    <div className="space-y-3">
      <SpotlightPanel
        ids={order.spotlight}
        lang={lang}
        selectedIds={new Set(order.lines.map((l) => l.itemId))}
        onToggle={handleToggle}
        onDismiss={() => mut(clearSpotlight)}
      />
      {skipCategory}
    </div>
  ) : order.discovery?.venues?.length ? (
    <VenueStep
      query=""
      city={order.context.city ?? ""}
      lang={lang}
      headerLabel={order.discovery.query}
      presetVenues={order.discovery.venues}
      selectedIds={venueIds}
      onSelect={handleAddPlace}
    />
  ) : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[1480px] flex-col px-3 pb-3 sm:px-6">
      <Header
        lang={lang}
        eventName={evt ? tr(evt.name, lang) : null}
        onHome={goHome}
        onToggleLang={toggleLang}
        onCollaborate={collaborate}
        collabActive={collabActive}
      />

      {!evt ? (
        <Landing lang={lang} loading={loading} onStart={startFromText} onPick={pickEvent} />
      ) : (
        <>
          {/* Mobile tab bar */}
          <div className="no-print mb-3 flex gap-1 rounded-full border border-ink/10 bg-white p-1 text-sm lg:hidden">
            <TabBtn active={tab === "chat"} onClick={() => setTab("chat")}>{lang === "ro" ? "Conversație" : "Conversation"}</TabBtn>
            <TabBtn active={tab === "cart"} onClick={() => setTab("cart")}>{money(quote.total)}</TabBtn>
          </div>

          <div className="grid flex-1 gap-4 lg:grid-cols-12">
            {/* Conversation — chat + inline choice/venue/product cards in ONE column */}
            <section className={`card-soft ${show("chat")} ${paneH} flex-col p-4 lg:col-span-8`}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <PanelTitle>{t("brand", lang)}</PanelTitle>
                <RunningTotal total={quote.total} budget={order.context.budget} lang={lang} />
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
            <button onClick={onFinalize} disabled={confirming} className="btn-gold w-full rounded-full py-3 text-sm font-semibold disabled:opacity-50">
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

            <button onClick={onFinalize} disabled={confirming} className="btn-gold w-full rounded-full py-3 text-sm font-semibold disabled:opacity-50">
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
      ? ["Nuntă în Constanța, 150 invitați, ~20.000€", "Banchet de liceu în Cluj, 60 elevi", "Weekend romantic la munte, ~800€"]
      : ["A wedding in Constanța, 150 guests, ~€20k", "Highschool banquet in Cluj, 60 students", "A romantic mountain weekend, ~€800"];
  return (
    <div className="mx-auto w-full max-w-2xl py-10 sm:py-14">
      <div className="animate-rise text-center">
        <div className="text-[11px] uppercase tracking-[0.2em] text-gold-deep/80">
          {lang === "ro" ? "Spune-mi într-o frază" : "Tell me in one line"}
        </div>
        <h1 className="text-display mt-2 text-3xl text-ink sm:text-4xl">
          {lang === "ro" ? "Ce planificăm?" : "What are we planning?"}
        </h1>
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
          placeholder={lang === "ro" ? "ex. O nuntă în Constanța pentru 150 de invitați, buget ~20.000€…" : "e.g. A wedding in Constanța for 150 guests, budget ~€20k…"}
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

      <div className="my-8 flex items-center gap-3 text-[11px] uppercase tracking-widest text-ink-soft/60">
        <span className="h-px flex-1 bg-ink/10" /> {lang === "ro" ? "sau alege" : "or pick"} <span className="h-px flex-1 bg-ink/10" />
      </div>

      <EventPicker lang={lang} onPick={onPick} />
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
