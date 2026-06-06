"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/types";

/** Rotating, credible social-proof / live-demand lines (client-side theatrics). */
export function SocialProof({ lang }: { lang: Lang }) {
  const [i, setI] = useState(0);
  const [online, setOnline] = useState(18);
  const [planning, setPlanning] = useState(4);
  const [booked, setBooked] = useState(9);

  useEffect(() => {
    const t = setInterval(() => {
      setI((x) => (x + 1) % 4);
      setOnline(12 + Math.floor(Math.random() * 28)); // 12..39
      setPlanning(3 + Math.floor(Math.random() * 6)); // 3..8
      setBooked(6 + Math.floor(Math.random() * 14)); // 6..19
    }, 5500);
    return () => clearInterval(t);
  }, []);

  const lines =
    lang === "ro"
      ? [
          `🟢 ${online} utilizatori online acum`,
          `👀 ${planning} planifică un eveniment chiar acum`,
          `🔥 ${booked} pachete rezervate săptămâna asta`,
          `📈 Cerere mare în zona ta pentru sezonul acesta`,
        ]
      : [
          `🟢 ${online} users online now`,
          `👀 ${planning} people planning an event right now`,
          `🔥 ${booked} packages booked this week`,
          `📈 High demand in your area this season`,
        ];

  return (
    <div className="no-print flex items-center gap-2 overflow-hidden rounded-full border border-gold/25 bg-gold/8 px-3 py-1 text-[11px] text-gold-deep">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500/50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      <span key={i} className="animate-rise truncate">{lines[i]}</span>
    </div>
  );
}
