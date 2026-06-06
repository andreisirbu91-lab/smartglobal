"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Lang, TierOption } from "@/lib/types";
import { itemById } from "@/lib/catalog";
import { CATEGORY_GRADIENT, itemImage } from "@/lib/images";
import { money, ron, tr } from "@/lib/format";
import { topVoted, VoteBar, type Voting } from "@/components/voting";

/** Big, image-led escalating bundle tiers with an Info detail modal. */
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
  const [detail, setDetail] = useState<TierOption | null>(null);
  const winner = voting ? topVoted(options.map((o) => o.label), voting.count) : null;

  return (
    <div className="space-y-4">
      {question && (
        <div className="space-y-2">
          <div className="rule-gold" />
          <h3 className="text-display text-[26px] leading-[1.12] text-ink">{question}</h3>
        </div>
      )}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(238px, 1fr))" }}>
        {options.map((o, i) => {
          const items = o.itemIds.map((id) => itemById(id)).filter((x): x is NonNullable<typeof x> => Boolean(x));
          const hero = items[0];
          const best = voting ? winner === o.label : options.length > 1 && i === options.length - 1;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onPick(o.itemIds)}
              className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-[0_1px_2px_rgba(38,35,32,.04),0_22px_50px_-32px_rgba(38,35,32,.34)] transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(177,144,76,.5)] ${
                best ? "border-gold/60 ring-1 ring-gold/30" : "border-gold/20 hover:border-gold/55"
              }`}
            >
              <div className="relative h-32 w-full overflow-hidden">
                {hero ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={itemImage(hero)} alt={tr(hero.name, lang)} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="h-full w-full" style={{ background: CATEGORY_GRADIENT[hero?.category ?? "venues"] }} />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                {best && (
                  <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                    {voting ? (ro ? "Câștigă" : "Winning") : (ro ? "Recomandat" : "Recommended")}
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setDetail(o); }}
                  className="absolute right-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-medium text-ink shadow transition hover:bg-white"
                >
                  ⓘ {ro ? "Info" : "Info"}
                </button>
                <div className="absolute bottom-2 left-3 right-3 text-display text-[15px] leading-tight text-white">{o.label}</div>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
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
                  <span className="rounded-full bg-ink px-3 py-1.5 text-[12px] font-medium text-ivory transition group-hover:bg-black">{ro ? "Alege" : "Choose"}</span>
                </div>
                {voting && <VoteBar id={o.label} voting={voting} lang={lang} winner={winner === o.label} />}
              </div>
            </motion.div>
          );
        })}
      </div>

      {detail && <TierDetailModal tier={detail} lang={lang} onClose={() => setDetail(null)} onPick={() => { onPick(detail.itemIds); setDetail(null); }} />}
    </div>
  );
}

function TierDetailModal({ tier, lang, onClose, onPick }: { tier: TierOption; lang: Lang; onClose: () => void; onPick: () => void }) {
  const ro = lang === "ro";
  const items = tier.itemIds.map((id) => itemById(id)).filter((x): x is NonNullable<typeof x> => Boolean(x));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl bg-card shadow-2xl scroll-thin" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gold/15 p-5">
          <h3 className="text-display text-xl text-ink">{tier.label}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full border border-ink/10 text-ink-soft hover:border-gold">✕</button>
        </div>
        <div className="space-y-3 p-5">
          {items.map((it) => (
            <div key={it.id} className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={itemImage(it)} alt={tr(it.name, lang)} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0">
                <div className="text-display text-[15px] text-ink">{tr(it.name, lang)}</div>
                <p className="text-[12px] leading-snug text-ink-soft">{it.long ? tr(it.long, lang) : tr(it.description, lang)}</p>
                <div className="text-[12px] text-gold-deep">{money(it.price)}{it.unit !== "flat" ? <span className="text-ink-soft">/{it.unit === "per_guest" ? (ro ? "invitat" : "guest") : (ro ? "absolvent" : "graduate")}</span> : null}</div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-gold/15 pt-3">
            <span className="text-display text-xl text-gold-deep">{money(tier.total)}</span>
            <button onClick={onPick} className="btn-champagne px-5 py-2.5 text-sm font-semibold">{ro ? "Alege pachetul" : "Choose package"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
