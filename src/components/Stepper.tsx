"use client";

import { useEffect, useRef } from "react";
import type { Lang, Step } from "@/lib/types";
import { tr } from "@/lib/format";

export function Stepper({
  steps,
  current,
  lang,
  onJump,
}: {
  steps: Step[];
  current: number;
  lang: Lang;
  onJump: (i: number) => void;
}) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [current]);

  return (
    <div className="no-print w-full overflow-x-auto pb-1 scroll-thin">
      <div className="flex min-w-max items-start">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const reachable = i <= current;
          return (
            <div key={s.id} className="flex items-start">
              <button
                ref={active ? activeRef : undefined}
                disabled={!reachable}
                onClick={() => reachable && onJump(i)}
                className="flex w-16 flex-col items-center gap-1 sm:w-20"
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full text-[12px] font-semibold transition ${
                    active
                      ? "bg-gold text-white ring-4 ring-gold/20"
                      : done
                        ? "bg-gold/20 text-gold-deep"
                        : "bg-ink/8 text-ink-soft/50"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className={`text-center text-[10px] leading-tight ${active ? "font-semibold text-ink" : "text-ink-soft/70"}`}>
                  {tr(s.title, lang)}
                </span>
              </button>
              {i < steps.length - 1 && (
                <span className={`mt-4 h-0.5 w-4 rounded sm:w-6 ${i < current ? "bg-gold/50" : "bg-ink/10"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
