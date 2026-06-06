"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Lang, Venue } from "@/lib/types";
import { money, ron } from "@/lib/format";
import { t } from "@/lib/i18n";

function priceOf(v: Venue): { amount: number; perGuest: boolean } {
  if (v.estFlatPrice) return { amount: v.estFlatPrice, perGuest: false };
  if (v.estPricePerGuest) return { amount: v.estPricePerGuest, perGuest: true };
  return { amount: 0, perGuest: false };
}
import { Button, Pill } from "@/components/ui";

export function VenueStep({
  query,
  city,
  lang,
  selectedIds,
  onSelect,
  presetVenues,
  headerLabel,
}: {
  query: string;
  city: string;
  lang: Lang;
  selectedIds: Set<string>;
  onSelect: (v: Venue) => void;
  /** When provided (discovery), these are shown instead of fetching. */
  presetVenues?: Venue[];
  headerLabel?: string;
}) {
  const [fetched, setFetched] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Venue | null>(null);
  const preset = presetVenues !== undefined;

  useEffect(() => {
    if (preset || !city) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/places?q=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setFetched(d.venues ?? []))
      .catch(() => !cancelled && setFetched([]))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [query, city, preset]);

  const venues = presetVenues ?? fetched;
  if (!preset && !city) return <p className="py-10 text-center text-sm text-ink-soft">{t("noVenues", lang)}</p>;
  if (loading) return <LoadingVenues lang={lang} />;
  if (!venues.length) return <p className="py-10 text-center text-sm text-ink-soft">{t("noVenues", lang)}</p>;

  return (
    <div className="animate-rise space-y-4">
      <div className="flex items-center justify-between">
        <Pill tone="gold">{headerLabel ?? `${city} · ${t("recommended", lang)}`}</Pill>
        <span className="text-[12px] text-ink-soft">{venues.length}</span>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
        {venues.map((v) => {
          const isSel = selectedIds.has(`venue:${v.placeId}`);
          return (
            <div
              key={v.placeId}
              onClick={() => onSelect(v)}
              className={`card-soft group cursor-pointer overflow-hidden transition hover:-translate-y-0.5 ${isSel ? "ring-2 ring-gold" : ""}`}
            >
              <div className="relative h-32 w-full overflow-hidden">
                {v.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.photoUrl} alt={v.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-ivory-deep text-3xl"></div>
                )}
                {v.rating && (
                  <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ink">★ {v.rating}</span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setDetail(v); }}
                  className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-ink shadow transition hover:bg-white"
                >
                  ⓘ {t("more", lang)}{v.photos && v.photos.length > 1 ? ` · ⊞ ${v.photos.length}` : ""}
                </button>
                {isSel && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gold/15">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-gold text-lg text-white shadow">✓</span>
                  </div>
                )}
              </div>
              <div className="space-y-1 p-3">
                <h3 className="text-display text-[14px] leading-tight text-ink">{v.name}</h3>
                <p className="text-[11px] text-ink-soft">{v.reviews ? `${v.reviews} ${t("reviews", lang)}` : ""}</p>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[12px] text-ink">
                    {t("from", lang)} <span className="text-display text-gold-deep">{money(priceOf(v).amount)}</span>
                    {priceOf(v).perGuest ? <span className="text-[10px] text-ink-soft">/{t("perGuest", lang)}</span> : null}
                  </span>
                  <span className="text-[11px] font-medium text-gold-deep">{isSel ? `✓ ${t("selected", lang)}` : t("select", lang)}</span>
                </div>
                <div className="text-[9px] text-ink-soft/70">{ron(priceOf(v).amount)}{priceOf(v).perGuest ? `/${t("perGuest", lang)}` : ""}</div>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {detail && (
          <VenueDetailModal
            venue={detail}
            lang={lang}
            selected={selectedIds.has(`venue:${detail.placeId}`)}
            onClose={() => setDetail(null)}
            onSelect={(v) => { onSelect(v); setDetail(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function VenueDetailModal({
  venue,
  lang,
  selected,
  onClose,
  onSelect,
}: {
  venue: Venue;
  lang: Lang;
  selected: boolean;
  onClose: () => void;
  onSelect: (v: Venue) => void;
}) {
  const photos = venue.photos?.length ? venue.photos : venue.photoUrl ? [venue.photoUrl] : [];
  const [hero, setHero] = useState(0);
  const [zoom, setZoom] = useState(false);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-3 backdrop-blur-sm sm:p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
    >
      <motion.div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
        initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gold/10 p-4">
          <div className="min-w-0">
            <h3 className="text-display truncate text-xl text-ink">{venue.name}</h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-ink-soft">
              {venue.rating && <span className="text-gold-deep">★ {venue.rating} · {venue.reviews} {t("reviews", lang)}</span>}
            </div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink/10 text-ink-soft hover:border-gold">✕</button>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">
          {photos.length > 0 && (
            <div className="p-4 pb-0">
              <button onClick={() => setZoom(true)} className="block aspect-[16/10] w-full overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photos[hero]} alt={venue.name} className="h-full w-full object-cover" />
              </button>
              {photos.length > 1 && (
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scroll-thin">
                  {photos.map((p, i) => (
                    <button key={i} onClick={() => setHero(i)} className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-1 transition ${i === hero ? "ring-2 ring-gold" : "opacity-70 ring-gold/15 hover:opacity-100"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="space-y-3 p-4">
            {venue.address && <p className="text-[12px] text-ink-soft">{venue.address}</p>}
            {venue.reviewQuote && <p className="rounded-xl bg-ivory/60 p-3 text-sm italic text-ink-soft">“{venue.reviewQuote}”</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-gold/15 bg-card p-4">
          <div>
            <div className="text-[11px] text-ink-soft">{t("from", lang)}</div>
            <div className="text-display text-xl text-gold-deep">
              {money(priceOf(venue).amount)}{priceOf(venue).perGuest ? <span className="text-[11px] text-ink-soft">/{t("perGuest", lang)}</span> : null}
            </div>
            <div className="text-[10px] text-ink-soft/70">{ron(priceOf(venue).amount)}</div>
          </div>
          <div className="flex items-center gap-2">
            {venue.mapsUrl && (
              <a href={venue.mapsUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-ink/10 px-3 py-2.5 text-[13px] text-ink-soft hover:border-gold hover:text-gold-deep">
                Maps ↗
              </a>
            )}
            <Button variant="gold" onClick={() => onSelect(venue)}>
              {selected ? `✓ ${t("selected", lang)}` : t("select", lang)}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Fullscreen zoom */}
      <AnimatePresence>
        {zoom && photos[hero] && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { e.stopPropagation(); setZoom(false); }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[hero]} alt={venue.name} className="max-h-[90vh] max-w-full rounded-lg object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LoadingVenues({ lang }: { lang: Lang }) {
  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-ink-soft">{t("loadingVenues", lang)}</p>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
        {[0, 1, 2].map((i) => <div key={i} className="card-soft h-52 animate-pulse bg-ivory-deep/40" />)}
      </div>
    </div>
  );
}
