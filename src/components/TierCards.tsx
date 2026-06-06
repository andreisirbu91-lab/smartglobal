"use client";

import { motion } from "framer-motion";
import type { Lang, TierOption } from "@/lib/types";
import { itemById } from "@/lib/catalog";
import { money, ron, tr } from "@/lib/format";

/** Escalating bundle tiers (e.g. Photo-Video / +Booth / +Drone) as premium cards. */
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
    <div className="space-y-4">
      {question && (
        <motion.h3 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-display text-[22px] leading-snug text-ink">
          {question}
        </motion.h3>
      )}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
        {options.map((o, i) => {
          const items = o.itemIds.map((id) => itemById(id)).filter((x): x is NonNullable<typeof x> => Boolean(x));
          const best = options.length > 1 && i === options.length - 1;
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 280, damping: 24 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPick(o.itemIds)}
              className={`group relative flex flex-col gap-2 overflow-hidden rounded-2xl border p-4 text-left shadow-[0_1px_2px_rgba(26,26,46,.04),0_14px_34px_-22px_rgba(26,26,46,.3)] transition hover:-translate-y-0.5 ${
                best ? "border-gold bg-gradient-to-br from-gold/[0.1] to-white" : "border-gold/20 bg-gradient-to-br from-white to-ivory/60 hover:border-gold"
              }`}
            >
              {best && (
                <span className="absolute right-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                  ★ {ro ? "Cel mai ales" : "Best value"}
                </span>
              )}
              <span className="text-display pr-16 text-[15px] leading-tight text-ink">{o.label}</span>
              <ul className="space-y-0.5">
                {items.map((it) => (
                  <li key={it.id} className="flex items-start gap-1 text-[12px] leading-snug text-ink-soft">
                    <span className="text-gold-deep">✓</span> {tr(it.name, lang)}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-end justify-between pt-1">
                <div>
                  <div className="text-display text-lg text-gold-deep">{money(o.total)}</div>
                  <div className="text-[9px] text-ink-soft/70">{ron(o.total)}</div>
                </div>
                <span className="text-[12px] font-medium text-gold-deep opacity-0 transition group-hover:opacity-100">{ro ? "Alege" : "Choose"} →</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
