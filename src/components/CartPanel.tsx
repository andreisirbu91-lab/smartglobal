"use client";

import { useState } from "react";
import type { CategoryId, Lang, OrderState, Quote } from "@/lib/types";
import { canConfirm, validate } from "@/lib/engine";
import { itemById } from "@/lib/catalog";
import { CATEGORY_GRADIENT, itemImage } from "@/lib/images";
import { money, ron, tr } from "@/lib/format";
import { t } from "@/lib/i18n";
import { Button, Hairline, Pill } from "./ui";

export function CartPanel({
  order,
  quote,
  lang,
  confirming,
  honoreeLabel,
  onSetGraduates,
  onSetGuests,
  onRemove,
  onSetContact,
  onConfirm,
  onShare,
  onChooseVenue,
}: {
  order: OrderState;
  quote: Quote;
  lang: Lang;
  confirming: boolean;
  honoreeLabel: string;
  onSetGraduates: (n: number) => void;
  onSetGuests: (n: number) => void;
  onRemove: (id: string) => void;
  onSetContact: (c: { name?: string; email?: string; phone?: string }) => void;
  onConfirm: () => void;
  onShare: () => void;
  onChooseVenue?: () => void;
}) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const ready = canConfirm(order);
  const blocker = ready ? null : validate(order)[0];

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-display text-xl text-ink">{t("yourPackage", lang)}</h2>
        <div className="flex items-center gap-2">
          {quote.lines.length > 0 && (
            <button
              onClick={() => onRemove(quote.lines[quote.lines.length - 1].itemId)}
              className="no-print rounded-full border border-ink/15 px-2.5 py-1 text-[11px] font-medium text-ink-soft transition hover:border-gold hover:text-ink"
              title={lang === "ro" ? "Anulează ultima alegere" : "Undo last"}
            >
              ↶ {lang === "ro" ? "Înapoi" : "Undo"}
            </button>
          )}
          <Pill tone="ink">{quote.lines.length}</Pill>
        </div>
      </div>

      {/* Attendee counters */}
      <div className="grid grid-cols-2 gap-2.5">
        <Counter label={honoreeLabel} value={order.graduates} min={1} onChange={onSetGraduates} />
        <Counter label={t("guests", lang)} value={order.guests} min={0} onChange={onSetGuests} />
      </div>

      <Hairline className="my-3" />

      {/* Lines */}
      <div className="pr-1">
        {quote.lines.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft">{t("empty", lang)}</p>
        ) : (
          <div className="space-y-3">
            {(() => {
              const sec = (c: string) => (c === "venues" ? 0 : c === "package" ? 1 : c === "banquet" ? 2 : 3);
              const secLabel = (c: string) => [lang === "ro" ? "Locație" : "Venue", lang === "ro" ? "Pachet" : "Package", lang === "ro" ? "Banchet" : "Banquet", "Extra"][sec(c)];
              const sorted = [...quote.lines].sort((a, b) => sec(a.category) - sec(b.category));
              let last = -1;
              return sorted.map((l) => {
                const s = sec(l.category);
                const header = s !== last ? secLabel(l.category) : null;
                last = s;
                return (
              <div key={l.itemId}>
                {header && <div className="kicker mb-1 mt-2 text-[10px] text-ink-soft/70">{header}</div>}
              <div className="animate-rise flex items-start gap-2.5 rounded-xl bg-ivory/60 px-2.5 py-2">
                <div onClick={() => setDetailId(l.itemId)} className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5" title={t("more", lang)}>
                  <LineThumb itemId={l.itemId} order={order} category={l.category} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ink underline-offset-2 hover:underline">{tr(l.name, lang)}</div>
                    <div className="text-[11px] text-ink-soft">
                      {money(l.unitPrice, l.currency)} × {l.quantity}
                      {l.savings ? (
                        <span className="ml-1 text-wine">· {t("savings", lang)} {money(l.savings)}</span>
                      ) : null}
                    </div>
                    {(l.category === "artists" || l.category === "venues") && (
                      <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-gold/10 px-1.5 py-0.5 text-[10px] text-gold-deep">
                        ◷ {lang === "ro" ? "disponibilitate confirmată telefonic" : "availability confirmed by phone"}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-display text-[15px] text-ink">{money(l.total, l.currency)}</span>
                  <button
                    onClick={() => onRemove(l.itemId)}
                    aria-label={t("remove", lang)}
                    className="no-print grid h-5 w-5 place-items-center rounded-full text-ink-soft/60 transition hover:bg-wine/10 hover:text-wine"
                  >
                    ×
                  </button>
                </div>
              </div>
              </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      <Hairline className="my-3" />

      {/* Totals */}
      <div className="mt-3 space-y-1.5 text-sm">
        <Row label={t("subtotal", lang)} value={money(quote.subtotal)} muted />
        {quote.discounts.map((d) => (
          <Row key={d.code} label={`− ${tr(d.label, lang)}`} value={`−${money(d.amount)}`} tone="wine" />
        ))}
        <Hairline className="my-1.5" />
        <div className="flex items-center justify-between">
          <span className="text-display text-lg text-ink">{t("total", lang)}</span>
          <span className="text-display text-2xl text-gold-deep">{money(quote.total)}</span>
        </div>
        {quote.total > 0 && (
          <div className="rounded-lg bg-gold/[0.08] px-3 py-2 text-[12.5px] font-semibold text-ink">
            {lang === "ro" ? "Avans acum " : "Deposit now "}
            <span className="text-gold-deep">{money(Math.round(quote.total * 0.2))}</span> (20%) · {lang === "ro" ? "restul " : "rest "}
            <span className="text-ink">{money(quote.total - Math.round(quote.total * 0.2))}</span> {lang === "ro" ? "înainte de eveniment" : "before the event"}
            <div className="text-[11px] font-normal text-ink-soft">🧾 {lang === "ro" ? "Factură proformă SmartBill, automat." : "SmartBill proforma, issued automatically."}</div>
          </div>
        )}
        {quote.total > 0 && (() => {
          const people = Math.max(1, order.graduates + order.guests);
          return (
            <div className="flex items-center justify-between text-[11px] text-ink-soft">
              <span>{money(Math.round(quote.total / people))}/{lang === "ro" ? "persoană" : "person"} · {people} {lang === "ro" ? "persoane" : "people"}</span>
              <span>{ron(quote.total)}</span>
            </div>
          );
        })()}
        {order.context.budget ? <BudgetBar total={quote.total} budget={order.context.budget} lang={lang} /> : null}
        {order.context.budget && quote.total > 0 ? (
          quote.total <= order.context.budget ? (
            order.context.budget - quote.total > 500 ? (
              <p className="text-[11px] text-gold-deep">{lang === "ro"
                ? `Mai ai ${money(order.context.budget - quote.total)} în buget — e loc de încă un extra premium (artist, album sau bar).`
                : `You have ${money(order.context.budget - quote.total)} left — room for one more premium add-on (artist, album or bar).`}</p>
            ) : null
          ) : (
            <p className="text-[11px] text-wine">{lang === "ro"
              ? `${money(quote.total - order.context.budget)} peste buget — pot încadra dacă scoatem un extra.`
              : `${money(quote.total - order.context.budget)} over budget — I can fit it by trimming an extra.`}</p>
          )
        ) : null}
      </div>


      {/* Contact + confirm */}
      <div className="no-print mt-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            value={order.contact?.name ?? ""}
            onChange={(e) => onSetContact({ name: e.target.value })}
            placeholder={t("contactName", lang)}
            className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-gold"
          />
          <input
            value={order.contact?.email ?? ""}
            onChange={(e) => onSetContact({ email: e.target.value })}
            placeholder={t("contactEmail", lang)}
            className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-gold"
          />
        </div>
        <input
          value={order.contact?.phone ?? ""}
          onChange={(e) => onSetContact({ phone: e.target.value })}
          placeholder={lang === "ro" ? "Telefon (te sunăm să confirmăm disponibilitatea)" : "Phone (we'll call to confirm availability)"}
          className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-gold"
        />
        {blocker && <p className="text-center text-[11px] text-wine">{tr(blocker.message, lang)}</p>}
        {blocker?.field === "venue" && onChooseVenue && (
          <Button variant="ghost" className="w-full" onClick={onChooseVenue}>
            {lang === "ro" ? "Alege o locație →" : "Choose a venue →"}
          </Button>
        )}
        <Button variant="gold" className="w-full" disabled={!ready || confirming} onClick={onConfirm}>
          {confirming ? t("confirming", lang) : `${t("confirm", lang)} · ${money(quote.total)}`}
        </Button>
        {quote.lines.length > 0 && (
          <Button variant="ghost" className="w-full" onClick={onShare}>
            {t("sharePackage", lang)}
          </Button>
        )}
        {quote.lines.length > 0 && (
          <p className="text-center text-[11px] leading-snug text-ink-soft/80">
            {lang === "ro"
              ? "Rezervarea se înregistrează pe loc. Pentru locație și artiști te sunăm în 24h să confirmăm disponibilitatea pentru data aleasă — dacă ceva e ocupat, îți propunem o alternativă, fără costuri."
              : "Your booking is registered instantly. For the venue & artists we'll call within 24h to confirm availability for your date — if anything is taken, we'll propose an alternative, at no cost."}
          </p>
        )}
      </div>

      <CartItemModal id={detailId} order={order} lang={lang} onClose={() => setDetailId(null)} />
    </div>
  );
}

function CartItemModal({ id, order, lang, onClose }: { id: string | null; order: OrderState; lang: Lang; onClose: () => void }) {
  if (!id) return null;
  const ol = order.lines.find((l) => l.itemId === id);
  const item = itemById(id);
  const name = item ? tr(item.name, lang) : ol?.custom ? tr(ol.custom.name, lang) : id;
  const desc = item ? (item.long ? tr(item.long, lang) : tr(item.description, lang)) : ol?.custom?.description ? tr(ol.custom.description, lang) : "";
  const src = ol?.custom?.image ?? (item ? itemImage(item) : "");
  const unit = item?.unit ?? ol?.custom?.unit ?? "flat";
  const price = item?.price ?? ol?.custom?.price ?? 0;
  const meta = (ol?.custom?.meta ?? {}) as Record<string, unknown>;
  const unitNote =
    unit === "per_guest"
      ? (lang === "ro" ? "Preț per invitat — se înmulțește cu numărul de invitați." : "Per guest — multiplied by your guest count.")
      : unit === "per_graduate"
        ? (lang === "ro" ? "Preț per absolvent — se înmulțește cu numărul de absolvenți." : "Per graduate — multiplied by the number of graduates.")
        : (lang === "ro" ? "Preț fix, o singură dată." : "Flat price, one-off.");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} className="h-44 w-full object-cover" />
        )}
        <div className="space-y-2.5 p-5">
          <h3 className="text-display text-xl text-ink">{name}</h3>
          {desc && <p className="text-sm leading-relaxed text-ink-soft">{desc}</p>}
          {item?.includes && (
            <ul className="space-y-1">
              {item.includes[lang].map((b, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-ink"><span className="text-gold-deep">✓</span> {b}</li>
              ))}
            </ul>
          )}
          {typeof meta.address === "string" && <p className="text-[12px] text-ink-soft">{meta.address}</p>}
          <p className="rounded-lg bg-gold/[0.07] px-3 py-2 text-[12px] text-ink-soft">{unitNote}</p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-display text-xl text-gold-deep">{money(price, item?.currency)}{unit !== "flat" ? <span className="text-[12px] text-ink-soft">/{unit === "per_guest" ? t("perGuest", lang) : lang === "ro" ? "absolvent" : "graduate"}</span> : null}</span>
            {typeof meta.mapsUrl === "string" && (
              <a href={meta.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] text-ink-soft underline-offset-2 hover:text-ink hover:underline">Maps ↗</a>
            )}
          </div>
          <button onClick={onClose} className="btn-gold mt-2 w-full py-2.5 text-sm font-medium">{lang === "ro" ? "Închide" : "Close"}</button>
        </div>
      </div>
    </div>
  );
}

function LineThumb({ itemId, order, category }: { itemId: string; order: OrderState; category: CategoryId }) {
  const [ok, setOk] = useState(true);
  const ol = order.lines.find((l) => l.itemId === itemId);
  const item = itemById(itemId);
  const src = ol?.custom?.image ?? (item ? itemImage(item) : "");
  if (src && ok) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} onError={() => setOk(false)} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />;
  }
  return <div className="h-9 w-9 shrink-0 rounded-lg" style={{ background: CATEGORY_GRADIENT[category] }} />;
}

function BudgetBar({ total, budget, lang }: { total: number; budget: number; lang: Lang }) {
  const pct = budget > 0 ? Math.round((total / budget) * 100) : 0;
  const over = total > budget;
  const near = !over && pct >= 90;
  const color = over ? "bg-wine" : near ? "bg-gold" : "bg-green-600";
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] text-ink-soft">
        <span>{lang === "ro" ? "Buget" : "Budget"} {money(budget)}</span>
        <span className={over ? "font-medium text-wine" : ""}>
          {over ? `+${money(total - budget)} ${lang === "ro" ? "peste" : "over"}` : `${pct}%`}
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink/10">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

function Counter({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="mt-1 flex items-center justify-between">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="grid h-7 w-7 place-items-center rounded-full border border-ink/10 text-ink-soft hover:border-gold hover:text-gold-deep"
        >
          −
        </button>
        <input
          type="number"
          min={min}
          value={value || ""}
          onChange={(e) => onChange(Math.max(min, parseInt(e.target.value || String(min), 10)))}
          className="w-14 bg-transparent text-center text-display text-lg text-ink outline-none"
        />
        <button
          onClick={() => onChange(value + 1)}
          className="grid h-7 w-7 place-items-center rounded-full border border-ink/10 text-ink-soft hover:border-gold hover:text-gold-deep"
        >
          +
        </button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  tone,
}: {
  label: string;
  value: string;
  muted?: boolean;
  tone?: "wine";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={tone === "wine" ? "text-wine" : muted ? "text-ink-soft" : "text-ink"}>{label}</span>
      <span className={tone === "wine" ? "text-wine" : muted ? "text-ink-soft" : "text-ink"}>{value}</span>
    </div>
  );
}
