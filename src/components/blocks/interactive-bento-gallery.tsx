"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type MediaItem = {
  id: number | string;
  type: "image" | "video";
  title: string;
  desc?: string;
  url: string;
  span?: string;
};

/**
 * Interactive bento gallery: a tidy, organized masonry of photos/videos that
 * looks great whether there are 3 items or 30. Click a tile for a lightbox.
 * Adapted for the Event Concierge (Gold & Ivory) theme.
 */
export default function InteractiveBentoGallery({
  mediaItems,
  title,
  description,
}: {
  mediaItems: MediaItem[];
  title?: string;
  description?: string;
}) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (active === null) return;
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight") setActive((i) => (i === null ? null : (i + 1) % mediaItems.length));
      if (e.key === "ArrowLeft") setActive((i) => (i === null ? null : (i - 1 + mediaItems.length) % mediaItems.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, mediaItems.length]);

  if (!mediaItems.length) return null;
  const current = active === null ? null : mediaItems[active];

  return (
    <div className="w-full">
      {(title || description) && (
        <div className="mb-3">
          {title && <h3 className="text-display text-lg text-ink">{title}</h3>}
          {description && <p className="text-[12px] text-ink-soft">{description}</p>}
        </div>
      )}

      <div className="grid auto-rows-[64px] grid-cols-2 gap-2.5 sm:auto-rows-[72px] md:grid-cols-4">
        {mediaItems.map((item, i) => (
          <motion.button
            key={item.id}
            layoutId={`tile-${item.id}`}
            onClick={() => setActive(i)}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, type: "spring", stiffness: 260, damping: 26 }}
            className={`group relative overflow-hidden rounded-xl ring-1 ring-gold/15 ${item.span ?? "col-span-1 row-span-2"}`}
          >
            <Media item={item} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
            <div className="pointer-events-none absolute inset-x-2 bottom-2 translate-y-1 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
              <p className="truncate text-[11px] font-medium text-white drop-shadow">{item.title}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {current && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <motion.div
              layoutId={`tile-${current.id}`}
              className="relative max-h-[82vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative max-h-[68vh] w-full bg-ink/5">
                <Media item={current} large />
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-display truncate text-base text-ink">{current.title}</p>
                  {current.desc && <p className="truncate text-[12px] text-ink-soft">{current.desc}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <NavBtn onClick={() => setActive((i) => (i! - 1 + mediaItems.length) % mediaItems.length)}>‹</NavBtn>
                  <NavBtn onClick={() => setActive((i) => (i! + 1) % mediaItems.length)}>›</NavBtn>
                  <NavBtn onClick={() => setActive(null)}>✕</NavBtn>
                </div>
              </div>
              {mediaItems.length > 1 && (
                <div className="flex gap-2 overflow-x-auto px-4 pb-4 scroll-thin">
                  {mediaItems.map((m, i) => (
                    <button
                      key={m.id}
                      onClick={() => setActive(i)}
                      className={`h-12 w-16 shrink-0 overflow-hidden rounded-md ring-1 transition ${
                        i === active ? "ring-2 ring-gold" : "ring-gold/15 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Media item={m} thumb />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Media({ item, large, thumb }: { item: MediaItem; large?: boolean; thumb?: boolean }) {
  const cls = `h-full w-full object-cover ${large ? "object-contain" : ""}`;
  if (item.type === "video") {
    return (
      <video
        src={item.url}
        className={cls}
        muted
        loop
        playsInline
        autoPlay={!thumb}
        controls={large}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={item.url} alt={item.title} className={cls} loading="lazy" />;
}

function NavBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full border border-ink/10 text-ink-soft transition hover:border-gold hover:text-gold-deep"
    >
      {children}
    </button>
  );
}
