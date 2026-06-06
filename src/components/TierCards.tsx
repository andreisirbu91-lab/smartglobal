"use client";

import { motion } from "framer-motion";
import type { Lang, TierOption } from "@/lib/types";
import { itemById } from "@/lib/catalog";
import { money, ron, tr } from "@/lib/format";

/** Escalating bundle tiers (e.g. Photo-Video / +Booth / +Drone) — sober cards. */
export function TierCards({
  question,
  options,
  lang,
  onPick,
}: {
  question?: string;
  options: TierOption[];
  lang: Lang;
  onPick: (itemIds: string[]) => void;
}) {
  const ro = lang === "ro";
  return (
    <div className="space-y-3.5">
      {question && <h3 className="text-display text-[20px] leading-snug text-ink">{question}</h3>}
      <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
        {options.map((o, i) => {
          const items = o.itemIds.map((id) => itemById(id)).filter((x): x is NonNullable<typeof x> => Boolean(x));
          const best = options.length > 1 && i === options.length - 1;
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onPick(o.itemIds)}
              className={`group relative flex flex-col gap-2 rounded-xl border bg-white p-4 text-left transition hover:bg-ivory/50 ${
                best ? "border-ink/30" : "border-ink/10 hover:border-ink/30"
              }`}
            >
              {best && (
                <span className="absolute right-3 top-3 rounded-full border border-ink/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-soft">
                  {ro ? "Recomandat" : "Recommended"}
                </span>
              )}
              <span className="text-display pr-20 text-[15px] leading-tight text-ink">{o.label}</span>
              <ul className="space-y-0.5">
                {items.map((it) => (
                  <li key={it.id} className="flex items-start gap-1.5 text-[12px] leading-snug text-ink-soft">
                    <span className="text-ink-soft/50">✓</span> {tr(it.name, lang)}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-end justify-between pt-1">
                <div>
                  <div className="text-display text-lg text-ink">{money(o.total)}</div>
                  <div className="text-[9px] text-ink-soft/70">{ron(o.total)}</div>
                </div>
                <span className="text-[12px] font-medium text-ink-soft opacity-0 transition group-hover:opacity-100">{ro ? "Alege" : "Choose"} →</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
