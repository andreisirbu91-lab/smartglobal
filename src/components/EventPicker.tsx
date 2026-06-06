"use client";

import type { EventTypeId, Lang } from "@/lib/types";
import { EVENT_TYPES } from "@/lib/catalog";
import { tr } from "@/lib/format";
import { t } from "@/lib/i18n";
import { SectionTitle } from "./ui";

export function EventPicker({ lang, onPick }: { lang: Lang; onPick: (id: EventTypeId) => void }) {
  return (
    <div className="mx-auto max-w-3xl animate-rise py-10 text-center">
      <div className="mb-8">
        <SectionTitle kicker={t("chooseEventSub", lang)}>{t("chooseEvent", lang)}</SectionTitle>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {EVENT_TYPES.map((e) => (
          <button
            key={e.id}
            onClick={() => onPick(e.id)}
            className="card-soft group flex flex-col items-center gap-2 px-4 py-8 text-center transition hover:-translate-y-1 hover:ring-2 hover:ring-gold"
          >
            <span className="text-5xl transition group-hover:scale-110">{e.icon}</span>
            <span className="text-display text-lg text-ink">{tr(e.name, lang)}</span>
            <span className="text-[12px] text-ink-soft">{tr(e.tagline, lang)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
