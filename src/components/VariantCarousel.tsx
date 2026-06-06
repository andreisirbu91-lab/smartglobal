"use client";

import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/types";

export type CarouselItem = {
  id: string;
  src?: string;
  title: string;
  subtitle?: string;
  price?: string;
  href?: string;
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
}: {
  items: CarouselItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  lang: Lang;
}) {
  const [base, setBase] = useState(0);
  const [hover, setHover] = useState(false);
  const [mouse, setMouse] = useState({ x: 0.5 });
  const raf = useRef<number | null>(null);

  // Continuous slow rotation; paused while hovering.
  useEffect(() => {
    if (hover || items.length <= 1) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setBase((b) => (b + dt * 0.012) % 360); // ~ slow
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [hover, items.length]);

  const n = items.length;
  const focusIdx = (() => {
    // The card nearest the front (angle ~90°) is "focused".
    let best = 0, bestD = 999;
    items.forEach((_, i) => {
      const a = ((base + i * (360 / n)) % 360 + 360) % 360;
      const d = Math.abs(a - 90);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  })();
  const focus = items[focusIdx];

  return (
    <div className="space-y-4">
      <div
        className="relative h-[320px] w-full select-none sm:h-[360px]"
        style={{ perspective: "1200px" }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => { setHover(false); setMouse({ x: 0.5 }); }}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setMouse({ x: (e.clientX - r.left) / r.width });
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {items.map((item, i) => {
            const a = (((base + i * (360 / n)) % 360 + 360) % 360) * (Math.PI / 180);
            const depth = Math.sin(a);            // -1 back .. 1 front
            const x = Math.cos(a) * 230 + (mouse.x - 0.5) * 30;
            const y = -depth * 26;
            const scale = 0.62 + ((depth + 1) / 2) * 0.62; // back .62 .. front 1.24
            const opacity = 0.35 + ((depth + 1) / 2) * 0.65;
            const z = Math.round(depth * 100);
            const sel = item.id === selectedId;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className="absolute h-[150px] w-[116px] overflow-hidden rounded-2xl border bg-card text-left shadow-[0_24px_48px_-24px_rgba(38,35,32,.5)] transition-[border-color] sm:h-[176px] sm:w-[136px]"
                style={{
                  transform: `translate(${x}px, ${y}px) scale(${scale})`,
                  opacity,
                  zIndex: z + 100,
                  borderColor: sel ? "var(--color-gold)" : "rgba(38,35,32,.10)",
                }}
              >
                {item.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.src} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-ivory-deep" />
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-2">
                  <div className="truncate text-[11px] font-medium text-white">{item.title}</div>
                  {item.price && <div className="text-[10px] text-white/85">{item.price}</div>}
                </div>
                {sel && <div className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-gold text-[11px] text-white">✓</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Focused item detail + choose */}
      {focus && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/20 bg-card px-4 py-3">
          <div className="min-w-0">
            <div className="text-display truncate text-[15px] text-ink">{focus.title}</div>
            {focus.subtitle && <div className="truncate text-[12px] text-ink-soft">{focus.subtitle}</div>}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {focus.price && <span className="text-display text-[15px] text-gold-deep">{focus.price}</span>}
            {focus.href && (
              <a href={focus.href} target="_blank" rel="noopener noreferrer" className="text-[12px] text-ink-soft underline-offset-2 hover:text-ink hover:underline">
                {lang === "ro" ? "Detalii ↗" : "Details ↗"}
              </a>
            )}
            <button onClick={() => onSelect(focus.id)} className="btn-champagne px-4 py-2 text-[13px] font-medium">
              {selectedId === focus.id ? (lang === "ro" ? "Ales" : "Chosen") : (lang === "ro" ? "Alege" : "Choose")}
            </button>
          </div>
        </div>
      )}
      <p className="text-center text-[11px] text-ink-soft/70">
        {lang === "ro" ? "Treci cu mouse-ul ca să se oprească · click pe un card ca să alegi" : "Hover to pause · click a card to choose"}
      </p>
    </div>
  );
}
