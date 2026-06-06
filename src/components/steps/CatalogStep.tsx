"use client";

import { useEffect, useMemo, useState } from "react";
import type { Lang, OrderState } from "@/lib/types";
import { CATEGORIES, itemsForStep } from "@/lib/catalog";
import { tr } from "@/lib/format";
import { CatalogCard } from "@/components/CatalogCard";

/**
 * One category of variants at a time. Items already in the cart are hidden
 * (they "disappear" once added) so only the next choices are visible.
 */
export function CatalogStep({
  order,
  lang,
  categories,
  onToggle,
}: {
  order: OrderState;
  lang: Lang;
  categories: string[] | undefined;
  onToggle: (id: string) => void;
}) {
  const items = useMemo(() => itemsForStep(order.eventType, categories), [order.eventType, categories]);
  const selected = new Set(order.lines.map((l) => l.itemId));

  const order_ = categories ?? CATEGORIES.map((c) => c.id);
  const groups = useMemo(
    () =>
      CATEGORIES.filter((c) => items.some((i) => i.category === c.id)).sort(
        (a, b) => order_.indexOf(a.id) - order_.indexOf(b.id)
      ),
    [items, order_.join(",")]
  );

  const [cat, setCat] = useState(0);
  // Reset to the first category whenever the step's categories change.
  useEffect(() => setCat(0), [order_.join(","), order.eventType]);
  const idx = Math.min(cat, Math.max(0, groups.length - 1));
  const current = groups[idx];
  if (!current) return null;

  const remaining = items.filter((i) => i.category === current.id && !selected.has(i.id));
  const addedHere = items.filter((i) => i.category === current.id && selected.has(i.id)).length;

  return (
    <div className="animate-rise space-y-3">
      {/* Category sub-nav */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-gold-deep/80">
          <span>{current.icon}</span> {tr(current.name, lang)}
        </span>
        <span className="text-[11px] text-ink-soft">{idx + 1}/{groups.length}</span>
      </div>

      {remaining.length > 0 ? (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))" }}>
          {remaining.map((item) => (
            <CatalogCard key={item.id} item={item} lang={lang} selected={false} onToggle={onToggle} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gold/30 bg-gold/5 p-6 text-center text-sm text-ink-soft">
          {addedHere > 0
            ? lang === "ro"
              ? "✓ Adăugat. Treci la următoarea categorie."
              : "✓ Added. Move on to the next category."
            : lang === "ro"
              ? "Nicio variantă rămasă aici."
              : "No options left here."}
        </div>
      )}

      {/* Prev / Next category within this step */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => setCat((c) => Math.max(0, c - 1))}
          disabled={idx === 0}
          className="rounded-full border border-ink/10 px-3 py-1.5 text-[12px] text-ink-soft transition enabled:hover:border-gold disabled:opacity-40"
        >
          ← {lang === "ro" ? "Înapoi" : "Prev"}
        </button>
        {idx < groups.length - 1 ? (
          <button
            onClick={() => setCat((c) => Math.min(groups.length - 1, c + 1))}
            className="rounded-full bg-ink px-4 py-1.5 text-[12px] font-medium text-ivory transition hover:bg-ink/90"
          >
            {lang === "ro" ? "Următoarea categorie" : "Next category"} →
          </button>
        ) : (
          <span className="text-[11px] text-gold-deep">{lang === "ro" ? "Ultima categorie · apasă Continuă" : "Last one · press Continue"}</span>
        )}
      </div>
    </div>
  );
}
