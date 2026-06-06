"use client";

import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/types";
import { topVoted, type Voting } from "@/components/voting";

export type CarouselItem = {
  id: string;
  src?: string;
  title: string;
  subtitle?: string;
  price?: string;
  href?: string;
  /** Extra photos for the Info modal gallery. */
  images?: string[];
  /** Bullet details for the Info modal (address, included items…). */
  bullets?: string[];
};

/**
 * A slowly rotating 3D carousel of variant images (venues / providers).
 * Front card is large & in focus; back cards recede and fade. Rotation pauses
 * on hover so the customer can read and click a card to choose it.
 */
export function VariantCarousel({
  items,
  selectedId,
  onSelect,
  lang,
  voting,
}: {
  items: CarouselItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  lang: Lang;
  voting?: Voting;
}) {
  const winner = voting ? topVoted(items.map((it) => it.id), voting.count) : null;
  const [base, setBase] = useState(0);
  const [hover, setHover] = useState(false);
  const [mouse, setMouse] = useState({ x: 0.5 });
  const [info, setInfo] = useState<CarouselItem | null>(null);
  const [offset, setOffset] = useState(0);
  const raf = useRef<number | null>(null);

  const LIMIT = 8;
  // Show at most LIMIT cards at once; "more variants" rotates the window.
  const windowItems = items.length <= LIMIT
    ? items
    : Array.from({ length: LIMIT }, (_, i) => items[(offset + i) % items.length]);
  const n = windowItems.length;

  // Continuous slow rotation; paused while hovering.
  useEffect(() => {
    if (hover || n <= 1) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setBase((b) => (b + dt * 0.01) % 360); // slow & elegant
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [hover, n]);

  const renderInfo = () => info && <CarouselInfo item={info} lang={lang} onClose={() => setInfo(null)} onChoose={() => { onSelect(info.id); setInfo(null); }} chosen={selectedId === info.id} />;

  // MANY options → elegant rotating 3D carousel (max 8 shown), with "more variants".
  let focusIdx = 0, bestD = 999;
  windowItems.forEach((_, i) => {
    const a = ((base + i * (360 / n)) % 360 + 360) % 360;
    const d = Math.abs(a - 90);
    if (d < bestD) { bestD = d; focusIdx = i; }
  });
  const focus = windowItems[focusIdx];

  return (
    <div className="space-y-3">
      <div
        className="relative h-[260px] w-full select-none sm:h-[300px]"
        style={{ perspective: "1200px" }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => { setHover(false); setMouse({ x: 0.5 }); }}
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setMouse({ x: (e.clientX - r.left) / r.width }); }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {windowItems.map((item, i) => {
            const a = (((base + i * (360 / n)) % 360 + 360) % 360) * (Math.PI / 180);
            const depth = Math.sin(a);
            const R = Math.min(250, 96 + n * 20);
            const x = Math.cos(a) * R + (mouse.x - 0.5) * 26;
            const y = -depth * 22;
            const scale = 0.6 + ((depth + 1) / 2) * 0.55;
            const opacity = 0.4 + ((depth + 1) / 2) * 0.6;
            const z = Math.round(depth * 100);
            const sel = item.id === selectedId;
            return (
              <button
                key={item.id + i}
                onClick={() => onSelect(item.id)}
                className="absolute h-[150px] w-[114px] overflow-hidden rounded-2xl border bg-card text-left shadow-[0_24px_48px_-24px_rgba(38,35,32,.5)] transition-[border-color] sm:h-[172px] sm:w-[132px]"
                style={{ transform: `translate(${x}px, ${y}px) scale(${scale})`, opacity, zIndex: z + 100, borderColor: sel ? "var(--color-gold)" : "rgba(38,35,32,.10)" }}
              >
                {item.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.src} alt={item.title} className="h-full w-full object-cover" />
                ) : <div className="h-full w-full bg-ivory-deep" />}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-2">
                  <div className="truncate text-[11px] font-medium text-white">{item.title}</div>
                  {item.price && <div className="text-[10px] text-white/85">{item.price}</div>}
                </div>
                {sel && <div className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-gold text-[11px] text-white">✓</div>}
                {voting && voting.count(item.id) > 0 && (
                  <div className={`absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${winner === item.id ? "bg-gold text-white" : "bg-white/90 text-ink"}`}>
                    {voting.count(item.id)}{winner === item.id ? " ★" : ""}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {focus && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/20 bg-card px-4 py-2.5">
          <div className="min-w-0">
            <div className="text-display truncate text-[15px] text-ink">{focus.title}</div>
            {focus.subtitle && <div className="truncate text-[12px] text-ink-soft">{focus.subtitle}</div>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {focus.price && <span className="text-display text-[15px] text-gold-deep">{focus.price}</span>}
            <button onClick={() => setInfo(focus)} className="rounded-full border border-ink/15 px-3 py-1.5 text-[12px] font-medium text-ink-soft transition hover:border-gold hover:text-ink">ⓘ {lang === "ro" ? "Info" : "Info"}</button>
            {voting && (
              <button onClick={() => voting.onVote(focus.id)} className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${voting.mine(focus.id) ? "border-gold bg-gold/12 text-gold-deep" : "border-ink/15 text-ink-soft hover:border-gold"}`}>
                {voting.mine(focus.id) ? `✓ ${voting.count(focus.id)}` : (lang === "ro" ? "Votează" : "Vote")}
              </button>
            )}
            <button onClick={() => onSelect(focus.id)} className="btn-champagne px-4 py-2 text-[13px] font-medium">{selectedId === focus.id ? (lang === "ro" ? "Ales" : "Chosen") : (lang === "ro" ? "Alege" : "Choose")}</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 text-[11px] text-ink-soft/70">
        <span>{lang === "ro" ? "click pe un card ca să alegi" : "click a card to choose"}</span>
        {items.length > LIMIT && (
          <button onClick={() => setOffset((o) => (o + LIMIT) % items.length)} className="rounded-full border border-ink/15 px-3 py-1 font-medium text-ink-soft transition hover:border-gold hover:text-ink">
            {lang === "ro" ? `Vezi alte variante (${items.length})` : `More variants (${items.length})`}
          </button>
        )}
      </div>
      {renderInfo()}
    </div>
  );
}

function CarouselInfo({ item, lang, onClose, onChoose, chosen }: { item: CarouselItem; lang: Lang; onClose: () => void; onChoose: () => void; chosen: boolean }) {
  const gallery = (item.images && item.images.length ? item.images : item.src ? [item.src] : []).slice(0, 6);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl bg-card shadow-2xl scroll-thin" onClick={(e) => e.stopPropagation()}>
        {gallery.length > 0 && (
          <div className={`grid gap-1 ${gallery.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {gallery.map((g, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={g} alt={item.title} className={`h-32 w-full object-cover ${gallery.length === 1 ? "rounded-t-2xl" : i === 0 ? "rounded-tl-2xl" : i === 1 ? "rounded-tr-2xl" : ""}`} />
            ))}
          </div>
        )}
        <div className="space-y-2.5 p-5">
          <h3 className="text-display text-xl text-ink">{item.title}</h3>
          {item.subtitle && <p className="text-sm text-ink-soft">{item.subtitle}</p>}
          {item.bullets && item.bullets.length > 0 && (
            <ul className="space-y-1">
              {item.bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-ink"><span className="text-gold-deep">✓</span> {b}</li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between pt-1">
            {item.price ? <span className="text-display text-xl text-gold-deep">{item.price}</span> : <span />}
            {item.href && (
              <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-[13px] text-ink-soft underline-offset-2 hover:text-ink hover:underline">
                {lang === "ro" ? "Vezi pe hartă ↗" : "View on map ↗"}
              </a>
            )}
          </div>
          <button onClick={onChoose} className="btn-champagne mt-2 w-full py-2.5 text-sm font-semibold">
            {chosen ? (lang === "ro" ? "Ales ✓" : "Chosen ✓") : (lang === "ro" ? "Alege" : "Choose")}
          </button>
        </div>
      </div>
    </div>
  );
}
