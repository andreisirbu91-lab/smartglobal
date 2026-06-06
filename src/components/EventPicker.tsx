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
            className="card-soft group flex flex-col items-start gap-1 p-5 text-left transition hover:border-ink/25 hover:bg-ivory/40"
          >
            <span className="text-display text-lg text-ink">{tr(e.name, lang)}</span>
            <span className="text-[13px] leading-snug text-ink-soft">{tr(e.tagline, lang)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
