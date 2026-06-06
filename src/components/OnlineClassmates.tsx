"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/types";

const POOL = [
  "1633332755192-727a05c4013d",
  "1535713875002-d1d0cf377fde",
  "1438761681033-6461ffad8d80",
  "1494790108377-be9c29b29330",
  "1500648767791-00dcc994a43e",
  "1472099645785-5658abf4ff4e",
  "1544005313-94ddf0286df2",
  "1517841905240-472988babdf9",
].map((id) => `https://images.unsplash.com/photo-${id}?q=80&w=80&h=80&auto=format&fit=crop&crop=faces`);

/** A subtle "classmates online" presence cluster — avatars quietly come & go. */
export function OnlineClassmates({ lang, label }: { lang: Lang; label?: string }) {
  const [idxs, setIdxs] = useState([0, 1, 2]);
  const [count, setCount] = useState(4);

  useEffect(() => {
    const iv = setInterval(() => {
      setIdxs((prev) => {
        const a = [...prev];
        const pos = Math.floor(Math.random() * a.length);
        let next = Math.floor(Math.random() * POOL.length);
        let guard = 0;
        while (a.includes(next) && guard++ < 10) next = Math.floor(Math.random() * POOL.length);
        a[pos] = next;
        return a;
      });
      setCount(3 + Math.floor(Math.random() * 3));
    }, 3600);
    return () => clearInterval(iv);
  }, []);

  const text = label ?? (lang === "ro" ? "colegi online" : "classmates online");

  return (
    <div className="no-print flex items-center gap-2">
      <div className="flex -space-x-2">
        {idxs.map((ix, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${i}-${ix}`}
            src={POOL[ix]}
            alt=""
            className="animate-rise h-6 w-6 rounded-full border-2 border-card object-cover shadow-sm"
          />
        ))}
      </div>
      <span className="flex items-center gap-1.5 text-[11px] text-ink-soft">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500/50" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
        </span>
        {count} {text}
      </span>
    </div>
  );
}
