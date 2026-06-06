"use client";

import type { Contact, Lang, OrderState, Quote } from "@/lib/types";
import { canConfirm } from "@/lib/engine";
import { eventById } from "@/lib/catalog";
import { money, ron, tr } from "@/lib/format";
import { t } from "@/lib/i18n";
import { Button, Hairline } from "@/components/ui";

export function ReviewStep({
  order,
  quote,
  lang,
  confirming,
  onSetContact,
  onConfirm,
}: {
  order: OrderState;
  quote: Quote;
  lang: Lang;
  confirming: boolean;
  onSetContact: (c: Contact) => void;
  onConfirm: () => void;
}) {
  const ready = canConfirm(order);
  const evt = eventById(order.eventType);

  return (
    <div className="animate-rise mx-auto max-w-xl space-y-4">
      <div className="text-center">
        <div className="text-3xl">{evt?.icon}</div>
        <h3 className="text-display text-xl text-ink">{evt ? tr(evt.name, lang) : ""}</h3>
        <p className="text-[12px] text-ink-soft">
          {order.context.city && `📍 ${order.context.city}`} {order.context.date && `· ${order.context.date}`}
        </p>
      </div>

      <div className="card-soft p-4">
        <ul className="space-y-2">
          {quote.lines.map((l) => (
            <li key={l.itemId} className="flex items-start justify-between gap-3 text-sm">
              <span className="text-ink">
                {tr(l.name, lang)}
                <span className="ml-1 text-ink-soft">({money(l.unitPrice)} × {l.quantity})</span>
              </span>
              <span className="text-display text-ink">{money(l.total)}</span>
            </li>
          ))}
        </ul>
        <Hairline className="my-3" />
        <div className="space-y-1 text-sm">
          <Row label={t("subtotal", lang)} value={money(quote.subtotal)} muted />
          {quote.discounts.map((d) => (
            <Row key={d.code} label={`− ${tr(d.label, lang)}`} value={`−${money(d.amount)}`} tone />
          ))}
          <div className="flex items-center justify-between pt-1">
            <span className="text-display text-lg text-ink">{t("total", lang)}</span>
            <span className="text-display text-2xl text-gold-deep">{money(quote.total)}</span>
          </div>
          {quote.total > 0 && <div className="text-right text-[11px] text-ink-soft">{ron(quote.total)}</div>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          value={order.contact?.name ?? ""}
          onChange={(e) => onSetContact({ name: e.target.value })}
          placeholder={t("contactName", lang)}
          className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
        <input
          value={order.contact?.email ?? ""}
          onChange={(e) => onSetContact({ email: e.target.value })}
          placeholder={t("contactEmail", lang)}
          className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
      </div>
      {!ready && <p className="text-center text-[11px] text-ink-soft">{t("needContact", lang)}</p>}
      <Button variant="gold" className="w-full" disabled={!ready || confirming} onClick={onConfirm}>
        {confirming ? t("confirming", lang) : `${t("confirm", lang)} · ${money(quote.total)}`}
      </Button>
    </div>
  );
}

function Row({ label, value, muted, tone }: { label: string; value: string; muted?: boolean; tone?: boolean }) {
  const c = tone ? "text-wine" : muted ? "text-ink-soft" : "text-ink";
  return (
    <div className="flex items-center justify-between">
      <span className={c}>{label}</span>
      <span className={c}>{value}</span>
    </div>
  );
}
