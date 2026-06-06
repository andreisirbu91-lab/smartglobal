"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Contact, EventTypeId, Lang, OrderState, Venue } from "@/lib/types";
import { eventById, itemById } from "@/lib/catalog";
import {
  addVenue,
  applyPromo,
  clearDiscovery,
  clearSpotlight,
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
import { SocialProof } from "@/components/SocialProof";
import { ChoiceCards } from "@/components/ChoiceCards";
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
    const instruction = `[SYSTEM NOTE (always English) — reply ONLY in ${lang === "ro" ? "Romanian" : "English"} and do NOT call set_language. On-screen actions by the customer: ${labels.join("; ")}. React warmly and briefly (1-2 sentences). If they ADDED items/places: acknowledge with one concrete detail AND suggest one tasteful complementary upgrade — call recommend_items for 1-2 things that pair well and are NOT already in the package. If they CHOSE A LOCATION or SET A DATE: just acknowledge it in one line and let them continue — do NOT search venues (venues load at the Venue step) and do NOT recommend_items for that. NEVER re-ask for anything already set. Do NOT re-add items already added.]`;
    setLoading(true);
    setStatus(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const data = await streamChat({ messages: [...messagesRef.current, { role: "user", content: instruction }], order: orderRef.current }, setStatus, ctrl.signal);
      if (data.assistantMessage) setMessages((m) => [...m, { role: "assistant", content: data.assistantMessage! }]);
      // Keep the agent's fresh recommendations AND discovered places (show them in the middle).
      const spotlight = data.order?.spotlight;
      const discovery = data.order?.discovery;
      if (spotlight || discovery) {
        setOrder((o) => ({ ...o, ...(spotlight ? { spotlight } : {}), ...(discovery ? { discovery } : {}) }));
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

  function handleSelectVenue(v: Venue) {
    setOrder((o) => nextStep(selectVenue(o, v)));
    queueReaction(`chose the venue "${v.name}"`);
  }

  // Custom events: add multiple discovered places (stay + food + transport + activity).
  function handleAddPlace(v: Venue) {
    const present = orderRef.current.lines.some((l) => l.itemId === `venue:${v.placeId}`);
    setOrder((o) => addVenue(o, v));
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

  function pickEvent(id: EventTypeId) {
    closeShownRef.current = false;
    setOrder(setEventType(emptyOrder(lang), id));
    const q = eventById(id)?.steps[0]?.question;
    if (q) setMessages([{ role: "assistant", content: tr(q, lang) }]);
    setTab("chat");
  }

  async function send(text: string) {
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);
    setStatus(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const data = await streamChat({ messages: next, order }, setStatus, ctrl.signal);
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

  async function runClose() {
    const ro = lang === "ro";
    setTab("chat");
    setLoading(true);
    // Theatrical "calling the owner" sequence (~12s of suspense, shown live).
    const stages = ro
      ? ["🔎 Caut la furnizorii noștri o ofertă mai bună pentru tine…", "⏳ Verific reducerile disponibile la parteneri…", "✅ Am găsit ceva!", "🎉 Am deblocat un discount special pentru pachetul tău!"]
      : ["🔎 Searching our partner suppliers for a better deal…", "⏳ Checking available discounts across partners…", "✅ Found something!", "🎉 Unlocked a special discount on your package!"];
    for (let i = 0; i < stages.length; i++) {
      setStatus(stages[i]);
      await new Promise((r) => setTimeout(r, i < stages.length - 1 ? 3500 : 1400));
    }
    setStatus(null);

    // Now the agent frames the deal in PRODUCTS (not raw prices) and locks the discount.
    const instr = `[SYSTEM NOTE (always English) — reply ONLY in ${ro ? "Romanian" : "English"} and do NOT call set_language. You've just run an extended search across partner suppliers and UNLOCKED a special discount (no fake phone calls — frame it as "I searched our suppliers and unlocked a deal"). In their language, 2-3 short warm sentences framed in PRODUCTS — never raw percentages:
1) CALL negotiate_discount(5), and JUSTIFY it with a specific item ALREADY in their package: "because you chose **<one item they already have>**, I unlocked a special discount on the whole package" (don't quote the % coldly).
2) Then a conditional gift the supplier offers: "and there's more — if you ALSO add **<Z: a nicer/pricier item they DON'T have yet>**, you get **<W: a smaller delight, ~€100-200>** for FREE". recommend_items Z and W so they appear on screen to tap.
Do NOT finalize the booking; invite them to press Finalize again when ready.]`;
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

  async function confirm() {
    // First press of Finalize → the agent runs a closing negotiation (deal + upsell).
    if (!closeShownRef.current && quote.total > 0) {
      closeShownRef.current = true;
      await runClose();
      return;
    }
    setConfirming(true);
    try {
      const res = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      const data = await res.json();
      if (data.id) router.push(`/booking/${data.id}`);
      else throw new Error();
    } catch {
      setConfirming(false);
    }
  }

  const isLast = evt ? order.stepIndex >= evt.steps.length - 1 : false;
  const canContinue = step?.kind === "basics" && step.field === "location" ? Boolean(order.context.city) : true;
  const paneH = "h-[calc(100dvh-150px)] lg:h-[calc(100dvh-104px)]";
  const show = (which: Tab) => (tab === which ? "flex" : "hidden") + " lg:flex";

  // The agent's current surface, rendered inline in the conversation under the chat.
  const surface = order.choices?.options?.length ? (
    <ChoiceCards
      question={order.choices.question}
      options={order.choices.options}
      input={order.choices.input}
      lang={lang}
      onPick={(l) => send(l)}
      onOther={openOther}
    />
  ) : order.spotlight && order.spotlight.length > 0 ? (
    <SpotlightPanel
      ids={order.spotlight}
      lang={lang}
      selectedIds={new Set(order.lines.map((l) => l.itemId))}
      onToggle={handleToggle}
      onDismiss={() => mut(clearSpotlight)}
    />
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
      />

      {!evt ? (
        <Landing lang={lang} loading={loading} onStart={startFromText} onPick={pickEvent} />
      ) : (
        <>
          {/* Mobile tab bar */}
          <div className="no-print mb-3 flex gap-1 rounded-full border border-ink/10 bg-white p-1 text-sm lg:hidden">
            <TabBtn active={tab === "chat"} onClick={() => setTab("chat")}>💬 {lang === "ro" ? "Conversație" : "Conversation"}</TabBtn>
            <TabBtn active={tab === "cart"} onClick={() => setTab("cart")}>🛒 {money(quote.total)}</TabBtn>
          </div>

          <div className="grid flex-1 gap-4 lg:grid-cols-12">
            {/* Conversation — chat + inline choice/venue/product cards in ONE column */}
            <section className={`card-soft ${show("chat")} ${paneH} flex-col p-4 lg:col-span-8`}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <PanelTitle>💬 {t("brand", lang)}</PanelTitle>
                <SocialProof lang={lang} />
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
        </>
      )}
    </main>
  );
}

function Header({
  lang,
  eventName,
  onHome,
  onToggleLang,
}: {
  lang: Lang;
  eventName: string | null;
  onHome: () => void;
  onToggleLang: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 py-3 sm:py-4">
      <div className="flex min-w-0 items-center gap-2">
        <button onClick={onHome} className="text-display text-lg tracking-tight text-ink transition hover:opacity-70 sm:text-xl" aria-label="home">
          <span className="text-gold-deep">✦</span> <span className="hidden sm:inline">{t("brand", lang)}</span>
        </button>
        {eventName && (
          <button onClick={onHome} className="no-print inline-flex max-w-[60vw] items-center gap-1 truncate rounded-full border border-gold/30 bg-gold/8 px-2.5 py-1 text-[12px] text-gold-deep transition hover:bg-gold/15 sm:max-w-none">
            {eventName} <span className="opacity-60">· ⌂ {t("home", lang)}</span>
          </button>
        )}
      </div>
      <div className="no-print flex items-center rounded-full border border-ink/10 bg-white p-0.5 text-sm">
        {(["en", "ro"] as const).map((l) => (
          <button key={l} onClick={() => l !== lang && onToggleLang()} className={`rounded-full px-3 py-1 font-medium transition ${lang === l ? "bg-ink text-ivory" : "text-ink-soft hover:text-ink"}`}>
            {l.toUpperCase()}
          </button>
        ))}
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
    <div className="animate-rise flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-gold/40 bg-gradient-to-b from-gold/[0.06] to-transparent p-8 text-center">
      <div className="text-4xl">✨</div>
      <p className="mt-3 max-w-sm text-sm text-ink-soft">
        {lang === "ro"
          ? "Spune-mi ce-ți dorești și-ți aduc aici variante reale — locații, foto, muzică — pe care le alegi cu un click."
          : "Tell me what you'd like and I'll bring real options here — venues, photo, music — to pick with one tap."}
      </p>
      <button onClick={onOther} className="btn-gold mt-4 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold">
        {lang === "ro" ? "✍️ Scrie ce vrei" : "✍️ Type what you want"}
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
    <div className="mb-4 rounded-2xl border border-gold/40 bg-gold/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-deep">
          ✦ {lang === "ro" ? "Recomandate de concierge" : "Concierge picks"}
        </span>
        <button onClick={onDismiss} className="text-ink-soft/60 hover:text-ink" aria-label="dismiss">✕</button>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))" }}>
        {items.map((item) => (
          <CatalogCard key={item!.id} item={item!} lang={lang} selected={selectedIds.has(item!.id)} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}
