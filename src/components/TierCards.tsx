"use client";

import { motion } from "framer-motion";
import type { Lang, TierOption } from "@/lib/types";
import { itemById } from "@/lib/catalog";
import { money, ron, tr } from "@/lib/format";
import { topVoted, VoteBar, type Voting } from "@/components/voting";

/** Escalating bundle tiers (e.g. Photo-Video / +Booth / +Drone) — sober cards. */
export function TierCards({
  question,
  options,
  lang,
  onPick,
  voting,
}: {
  question?: string;
  options: TierOption[];
  lang: Lang;
  onPick: (itemIds: string[]) => void;
  voting?: Voting;
}) {
  const ro = lang === "ro";
  const winner = voting ? topVoted(options.map((o) => o.label), voting.count) : null;
  return (
    <div className="space-y-4">
      {question && (
        <div className="space-y-2">
          <div className="rule-gold" />
          <h3 className="text-display text-[26px] leading-[1.12] text-ink">{question}</h3>
        </div>
      )}
      <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
        {options.map((o, i) => {
          const items = o.itemIds.map((id) => itemById(id)).filter((x): x is NonNullable<typeof x> => Boolean(x));
          const best = voting ? winner === o.label : options.length > 1 && i === options.length - 1;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onPick(o.itemIds)}
              className={`group relative flex cursor-pointer flex-col gap-2 rounded-[0.9rem] border bg-card p-5 text-left shadow-[0_1px_2px_rgba(38,35,32,.03),0_18px_42px_-30px_rgba(38,35,32,.3)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-28px_rgba(177,144,76,.42)] ${
                best ? "border-gold/55 ring-1 ring-gold/25" : "border-gold/20 hover:border-gold/55"
              }`}
            >
              {best && (
                <span className="absolute right-3 top-3 rounded-full border border-gold/40 bg-gold/8 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold-deep">
                  {voting ? (ro ? "Câștigă" : "Winning") : (ro ? "Recomandat" : "Recommended")}
                </span>
              )}
              <span className="text-display pr-24 text-[15px] leading-tight text-ink">{o.label}</span>
              <ul className="space-y-0.5">
                {items.map((it) => (
                  <li key={it.id} className="flex items-start gap-1.5 text-[12px] leading-snug text-ink-soft">
                    <span className="text-gold-deep/70">✓</span> {tr(it.name, lang)}
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
              {voting && <VoteBar id={o.label} voting={voting} lang={lang} winner={winner === o.label} />}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
