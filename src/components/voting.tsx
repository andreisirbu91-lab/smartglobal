"use client";

import type { Lang } from "@/lib/types";

export type Voting = {
  count: (id: string) => number;
  mine: (id: string) => boolean;
  onVote: (id: string) => void;
};

/** The option id with the most votes (or null if nobody voted yet). */
export function topVoted(ids: string[], count: (id: string) => number): string | null {
  let best: string | null = null;
  let b = 0;
  for (const id of ids) {
    const c = count(id);
    if (c > b) { b = c; best = id; }
  }
  return b > 0 ? best : null;
}

/** Vote count + toggle for a shared session; stops click bubbling to the card. */
export function VoteBar({ id, voting, lang, winner }: { id: string; voting: Voting; lang: Lang; winner: boolean }) {
  const c = voting.count(id);
  const mine = voting.mine(id);
  const votesWord = c === 1 ? (lang === "ro" ? "vot" : "vote") : (lang === "ro" ? "voturi" : "votes");
  return (
    <div className="mt-2 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
      <span className={`text-[11px] ${winner && c > 0 ? "font-medium text-gold-deep" : "text-ink-soft"}`}>
        {c} {votesWord}{winner && c > 0 ? ` · ${lang === "ro" ? "câștigă" : "winning"}` : ""}
      </span>
      <button
        onClick={() => voting.onVote(id)}
        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
          mine ? "border-gold bg-gold/12 text-gold-deep" : "border-ink/15 text-ink-soft hover:border-gold"
        }`}
      >
        {mine ? (lang === "ro" ? "✓ Votat" : "✓ Voted") : (lang === "ro" ? "Votează" : "Vote")}
      </button>
    </div>
  );
}
