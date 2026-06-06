"use client";

import { useState } from "react";
import type { EventType, Lang, OrderState } from "@/lib/types";
import { tr } from "@/lib/format";
import { t } from "@/lib/i18n";
import { Calendar } from "@/components/Calendar";

const CITIES = ["Constanța", "București", "Cluj-Napoca", "Iași", "Timișoara", "Brașov"];
const BUDGETS = [5000, 10000, 20000, 30000];

export function BasicsStep({
  order,
  event,
  lang,
  field,
  onCity,
  onDate,
  onBudget,
  onHonorees,
  onGuests,
  onAdvance,
  onLocationChosen,
  onDateChosen,
}: {
  order: OrderState;
  event: EventType;
  lang: Lang;
  field?: "location" | "date" | "people";
  onCity: (v: string) => void;
  onDate: (v: string) => void;
  onBudget: (v: number) => void;
  onHonorees: (n: number) => void;
  onGuests: (n: number) => void;
  onAdvance?: () => void;
  onLocationChosen?: (city: string) => void;
  onDateChosen?: (date: string) => void;
}) {
  const [showCal, setShowCal] = useState(true);
  const city = order.context.city ?? "";

  if (field === "location") {
    return (
      <div className="animate-rise space-y-4">
        <div className="flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <Chip key={c} big active={city.toLowerCase() === c.toLowerCase()} onClick={() => { onCity(c); onLocationChosen?.(c); onAdvance?.(); }}>📍 {c}</Chip>
          ))}
        </div>
        <div>
          <Label>{t("city", lang)}</Label>
          <input
            value={city}
            onChange={(e) => onCity(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && city.trim()) { onLocationChosen?.(city); onAdvance?.(); } }}
            placeholder={t("cityPlaceholder", lang)}
            className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-base outline-none focus:border-gold"
          />
        </div>
      </div>
    );
  }

  if (field === "date") {
    return (
      <div className="animate-rise space-y-4">
        <div>
          <Label>{t("dateLabel", lang)}</Label>
          <input
            value={order.context.date ?? ""}
            onChange={(e) => onDate(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (order.context.date ?? "").trim()) { onDateChosen?.(order.context.date ?? ""); onAdvance?.(); } }}
            placeholder={t("datePlaceholder", lang)}
            className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-base outline-none focus:border-gold"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setShowCal((s) => !s)} className={`rounded-full border px-4 py-2 text-sm transition ${showCal ? "border-gold bg-gold/10 text-gold-deep" : "border-ink/10 text-ink-soft hover:border-gold"}`}>
            📅 {showCal ? "—" : "+"} {lang === "ro" ? "Calendar" : "Calendar"}
          </button>
        </div>
        {showCal && <Calendar lang={lang} selectedLabel={order.context.date} onPick={(d) => { onDate(d); onDateChosen?.(d); onAdvance?.(); }} />}
      </div>
    );
  }

  // field === "people" (or fallback)
  return (
    <div className="animate-rise space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-ink/10 bg-white px-4 py-3">
          <Label inline>{tr(event.honoreeLabel, lang)}</Label>
          <div className="mt-2 flex items-center justify-between">
            <Round onClick={() => onHonorees(Math.max(1, order.graduates - 1))}>−</Round>
            <input
              type="number"
              min={1}
              value={order.graduates || ""}
              onChange={(e) => onHonorees(Math.max(1, parseInt(e.target.value || "1", 10)))}
              className="w-16 bg-transparent text-center text-display text-2xl text-ink outline-none"
            />
            <Round onClick={() => onHonorees(order.graduates + 1)}>+</Round>
          </div>
        </div>
        <div className="rounded-xl border border-ink/10 bg-white px-4 py-3">
          <Label inline>👥 {t("guestsQ", lang)}</Label>
          <input
            type="number"
            min={0}
            value={order.guests || ""}
            onChange={(e) => onGuests(Math.max(0, parseInt(e.target.value || "0", 10)))}
            placeholder="0"
            className="mt-1 w-full bg-transparent text-display text-2xl text-ink outline-none"
          />
        </div>
      </div>
      <div>
        <Label>💶 {t("budgetLabel", lang)}</Label>
        <div className="flex flex-wrap items-center gap-2">
          {BUDGETS.map((b) => (
            <Chip key={b} active={order.context.budget === b} onClick={() => onBudget(b)}>€{b.toLocaleString()}</Chip>
          ))}
          <input
            type="number"
            value={order.context.budget ?? ""}
            onChange={(e) => onBudget(Number(e.target.value))}
            placeholder="—"
            className="w-28 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-gold"
          />
        </div>
      </div>
    </div>
  );
}

function Label({ children, inline }: { children: React.ReactNode; inline?: boolean }) {
  return <span className={`block text-[11px] uppercase tracking-wide text-ink-soft ${inline ? "" : "mb-1.5"}`}>{children}</span>;
}

function Chip({ children, active, big, onClick }: { children: React.ReactNode; active?: boolean; big?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border font-medium transition ${big ? "px-4 py-2.5 text-sm" : "px-3.5 py-1.5 text-[13px]"} ${
        active ? "border-gold bg-gold/15 text-gold-deep" : "border-ink/10 text-ink-soft hover:border-gold/40 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Round({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="grid h-8 w-8 place-items-center rounded-full border border-ink/10 text-ink-soft hover:border-gold hover:text-gold-deep">
      {children}
    </button>
  );
}
