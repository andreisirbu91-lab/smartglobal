"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CatalogItem, Lang } from "@/lib/types";
import { categoryById } from "@/lib/catalog";
import { CATEGORY_GRADIENT, itemImage } from "@/lib/images";
import { money, ron, tr, unitLabel } from "@/lib/format";
import { t } from "@/lib/i18n";
import { Button, Pill } from "./ui";

export function CatalogCard({
  item,
  lang,
  selected,
  onToggle,
}: {
  item: CatalogItem;
  lang: Lang;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const cat = categoryById(item.category);
  const src = itemImage(item);
  const objPos = item.category === "artists" ? "object-top" : "object-center";

  const Photo = ({ className }: { className?: string }) =>
    imgOk && src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={tr(item.name, lang)} onError={() => setImgOk(false)} className={`${className} ${objPos}`} />
    ) : (
      <div className={`grid place-items-center text-3xl ${className}`} style={{ background: CATEGORY_GRADIENT[item.category] }}>
        <span className="opacity-70">{cat?.icon}</span>
      </div>
    );

  return (
    <>
      {/* One tap = select. The "more" button opens details. */}
      <div
        onClick={() => onToggle(item.id)}
        className={`card-soft animate-rise group relative cursor-pointer overflow-hidden transition hover:-translate-y-0.5 ${selected ? "ring-2 ring-gold" : ""}`}
      >
        <div className="relative h-28 w-full overflow-hidden">
          <Photo className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          {item.popular && <div className="absolute left-2 top-2"><Pill tone="gold">★ {t("popular", lang)}</Pill></div>}
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-ink shadow transition hover:bg-white"
          >
            ⓘ {t("more", lang)}
          </button>
          {selected && (
            <div className="absolute inset-0 flex items-center justify-center bg-gold/15">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gold text-lg text-white shadow">✓</span>
            </div>
          )}
        </div>
        <div className="space-y-1 p-3">
          <h3 className="text-display text-[14px] leading-tight text-ink">{tr(item.name, lang)}</h3>
          <p className="line-clamp-1 text-[11px] text-ink-soft">{tr(item.description, lang)}</p>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-display text-base text-gold-deep">{money(item.price)}</span>
            <span className="text-[10px] text-ink-soft">{tr(unitLabel[item.unit], lang)}</span>
          </div>
          <div className="text-[9px] text-ink-soft/70">{ron(item.price)}</div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl"
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-48 w-full">
                <Photo className="h-full w-full object-cover" />
                {item.popular && <div className="absolute left-3 top-3"><Pill tone="gold">★ {t("popular", lang)}</Pill></div>}
                <button onClick={() => setOpen(false)} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink hover:bg-white">✕</button>
              </div>
              <div className="space-y-3 p-5">
                <span className="text-[11px] uppercase tracking-wide text-gold-deep/80">{cat?.icon} {cat ? tr(cat.name, lang) : ""}</span>
                <h3 className="text-display text-xl text-ink">{tr(item.name, lang)}</h3>
                <p className="text-sm leading-relaxed text-ink-soft">{item.long ? tr(item.long, lang) : tr(item.description, lang)}</p>
                {item.includes && (
                  <ul className="space-y-1.5">
                    {item.includes[lang].map((b, i) => (
                      <li key={i} className="flex gap-2 text-[13px] text-ink"><span className="text-gold-deep">✓</span> {b}</li>
                    ))}
                  </ul>
                )}
                <div className="flex items-end justify-between rounded-xl bg-ivory/60 px-4 py-3">
                  <div>
                    <div className="text-display text-2xl text-gold-deep">{money(item.price)}</div>
                    <div className="text-[11px] text-ink-soft">{tr(unitLabel[item.unit], lang)} · {ron(item.price)}</div>
                  </div>
                  <Button variant={selected ? "ghost" : "gold"} onClick={() => { onToggle(item.id); setOpen(false); }}>
                    {selected ? `✓ ${t("selected", lang)}` : `+ ${t("add", lang)}`}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
