"use client";

import { useState } from "react";
import type { Lang } from "@/lib/types";

const MONTHS: Record<Lang, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ro: ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"],
};
const WD: Record<Lang, string[]> = {
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  ro: ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"],
};

export function Calendar({
  lang,
  selectedLabel,
  onPick,
}: {
  lang: Lang;
  selectedLabel?: string;
  onPick: (label: string) => void;
}) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [picked, setPicked] = useState<string | null>(null);

  const first = new Date(view.y, view.m, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function shift(delta: number) {
    setView((v) => {
      const m = v.m + delta;
      return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
    });
  }

  function choose(day: number) {
    const label = `${day} ${MONTHS[lang][view.m]} ${view.y}`;
    setPicked(label);
    onPick(label);
  }

  const key = (day: number) => `${day}-${view.m}-${view.y}`;
  const isPicked = (day: number) => picked === `${day} ${MONTHS[lang][view.m]} ${view.y}` || selectedLabel === `${day} ${MONTHS[lang][view.m]} ${view.y}`;
  const isPast = (day: number) => new Date(view.y, view.m, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="w-64 rounded-xl border border-gold/20 bg-card p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <button onClick={() => shift(-1)} className="grid h-7 w-7 place-items-center rounded-full text-ink-soft hover:bg-gold/10 hover:text-gold-deep">‹</button>
        <span className="text-display text-sm text-ink">{MONTHS[lang][view.m]} {view.y}</span>
        <button onClick={() => shift(1)} className="grid h-7 w-7 place-items-center rounded-full text-ink-soft hover:bg-gold/10 hover:text-gold-deep">›</button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] text-ink-soft">
        {WD[lang].map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) =>
          day === null ? (
            <span key={`e${i}`} />
          ) : (
            <button
              key={key(day)}
              disabled={isPast(day)}
              onClick={() => choose(day)}
              className={`grid h-8 place-items-center rounded-lg text-[12px] transition ${
                isPicked(day)
                  ? "bg-gold text-white"
                  : isPast(day)
                    ? "text-ink-soft/30"
                    : "text-ink hover:bg-gold/15"
              }`}
            >
              {day}
            </button>
          )
        )}
      </div>
    </div>
  );
}
