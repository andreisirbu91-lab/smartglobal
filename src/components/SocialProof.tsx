"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/types";

/** Rotating, credible social-proof / live-demand lines (client-side theatrics). */
export function SocialProof({ lang }: { lang: Lang }) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(3);
  const [booked, setBooked] = useState(7);

  useEffect(() => {
    const t = setInterval(() => {
      setI((x) => (x + 1) % 4);
      setN(2 + Math.floor(Math.random() * 5)); // 2..6
      setBooked(5 + Math.floor(Math.random() * 14)); // 5..18
    }, 5500);
    return () => clearInterval(t);
  }, []);

  const lines =
    lang === "ro"
      ? [
          `🔴 Chiar acum oferta e accesată de pe ${n} IP-uri`,
          `👀 ${n} persoane se uită la acest pachet acum`,
          `🔥 ${booked} pachete rezervate săptămâna asta`,
          `📈 Cerere mare în zona ta pentru sezonul acesta`,
        ]
      : [
          `🔴 Right now this offer is open on ${n} devices`,
          `👀 ${n} people are viewing this package now`,
          `🔥 ${booked} packages booked this week`,
          `📈 High demand in your area this season`,
        ];

  return (
    <div className="no-print flex items-center gap-2 overflow-hidden rounded-full border border-gold/25 bg-gold/8 px-3 py-1 text-[11px] text-gold-deep">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-wine/50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-wine" />
      </span>
      <span key={i} className="animate-rise truncate">{lines[i]}</span>
    </div>
  );
}
