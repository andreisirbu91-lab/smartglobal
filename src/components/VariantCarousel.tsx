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

  // Few options (packages, genres) → big, info-rich cards in a row (no sparse orbit).
  if (items.length <= 4) {
    return (
      <div className="space-y-3">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, minmax(0, 1fr))` }}>
          {items.map((it) => {
            const sel = it.id === selectedId;
            const win = winner === it.id;
            return (
              <div key={it.id} className={`group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-[0_1px_2px_rgba(38,35,32,.04),0_22px_50px_-32px_rgba(38,35,32,.34)] transition hover:-translate-y-1 ${win || sel ? "border-gold/60 ring-1 ring-gold/30" : "border-gold/20 hover:border-gold/55"}`}>
                <div className="relative h-44 w-full cursor-pointer overflow-hidden" onClick={() => onSelect(it.id)}>
                  {it.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.src} alt={it.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : <div className="h-full w-full bg-ivory-deep" />}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
                  <button onClick={(e) => { e.stopPropagation(); setInfo(it); }} className="absolute right-2 top-2 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-medium text-ink shadow transition hover:bg-white">ⓘ {lang === "ro" ? "Info" : "Info"}</button>
                  {win && voting && <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-white">★ {voting.count(it.id)}</span>}
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <div className="text-display text-[17px] leading-tight text-ink">{it.title}</div>
                  {it.subtitle && <div className="line-clamp-2 text-[12.5px] leading-snug text-ink-soft">{it.subtitle}</div>}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    {it.price ? <span className="text-display text-[15px] text-gold-deep">{it.price}</span> : <span />}
                    <div className="flex items-center gap-2">
                      {voting && (
                        <button onClick={() => voting.onVote(it.id)} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${voting.mine(it.id) ? "border-gold bg-gold/12 text-gold-deep" : "border-ink/15 text-ink-soft hover:border-gold"}`}>
                          {voting.mine(it.id) ? `✓ ${voting.count(it.id)}` : (lang === "ro" ? "Votează" : "Vote")}
                        </button>
                      )}
                      <button onClick={() => onSelect(it.id)} className="btn-champagne px-4 py-1.5 text-[12px] font-medium">{sel ? (lang === "ro" ? "Ales" : "Chosen") : (lang === "ro" ? "Alege" : "Choose")}</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {info && <CarouselInfo item={info} lang={lang} onClose={() => setInfo(null)} onChoose={() => { onSelect(info.id); setInfo(null); }} chosen={selectedId === info.id} />}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="relative h-[340px] w-full select-none sm:h-[392px]"
        style={{ perspective: "1300px" }}
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
            const x = Math.cos(a) * 260 + (mouse.x - 0.5) * 30;
            const y = -depth * 26;
            const scale = 0.6 + ((depth + 1) / 2) * 0.6; // back .6 .. front 1.2
            const opacity = 0.35 + ((depth + 1) / 2) * 0.65;
            const z = Math.round(depth * 100);
            const sel = item.id === selectedId;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className="absolute h-[160px] w-[124px] overflow-hidden rounded-2xl border bg-card text-left shadow-[0_24px_48px_-24px_rgba(38,35,32,.5)] transition-[border-color] sm:h-[188px] sm:w-[146px]"
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
                {voting && voting.count(item.id) > 0 && (
                  <div className={`absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${winner === item.id ? "bg-gold text-white" : "bg-white/90 text-ink"}`}>
                    {voting.count(item.id)} {lang === "ro" ? "vot" : ""}{winner === item.id ? " ★" : ""}
                  </div>
                )}
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
          <div className="flex shrink-0 items-center gap-2.5">
            {focus.price && <span className="text-display text-[15px] text-gold-deep">{focus.price}</span>}
            <button
              onClick={() => setInfo(focus)}
              className="rounded-full border border-ink/15 px-3 py-2 text-[12px] font-medium text-ink-soft transition hover:border-gold hover:text-ink"
            >
              ⓘ {lang === "ro" ? "Info" : "Info"}
            </button>
            {voting && (
              <button
                onClick={() => voting.onVote(focus.id)}
                className={`rounded-full border px-3 py-2 text-[12px] font-medium transition ${voting.mine(focus.id) ? "border-gold bg-gold/12 text-gold-deep" : "border-ink/15 text-ink-soft hover:border-gold"}`}
              >
                {voting.mine(focus.id) ? (lang === "ro" ? `✓ Votat (${voting.count(focus.id)})` : `✓ Voted (${voting.count(focus.id)})`) : (lang === "ro" ? `Votează (${voting.count(focus.id)})` : `Vote (${voting.count(focus.id)})`)}
              </button>
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

      {info && (
        <CarouselInfo
          item={info}
          lang={lang}
          onClose={() => setInfo(null)}
          onChoose={() => { onSelect(info.id); setInfo(null); }}
          chosen={selectedId === info.id}
        />
      )}
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
