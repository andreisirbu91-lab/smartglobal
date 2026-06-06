"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ChoiceOption, Lang } from "@/lib/types";
import { Calendar } from "@/components/Calendar";

export function ChoiceCards({
  question,
  options,
  input,
  lang,
  onPick,
  onOther,
}: {
  question?: string;
  options: ChoiceOption[];
  input?: "number" | "date" | "text";
  lang: Lang;
  onPick: (label: string) => void;
  onOther: () => void;
}) {
  const [val, setVal] = useState("");
  const [showCal, setShowCal] = useState(false);

  return (
    <div className="space-y-4">
      {question && (
        <motion.h3 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-display text-[22px] leading-snug text-ink">
          {question}
        </motion.h3>
      )}

      {/* Typed input for numbers (graduates/guests) and dates */}
      {input === "number" && (
        <div className="flex items-end gap-2">
          <input
            type="number"
            min={1}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && val) onPick(val); }}
            placeholder={lang === "ro" ? "scrie numărul…" : "type the number…"}
            className="card-soft w-40 rounded-xl px-4 py-3 text-lg outline-none focus:border-gold"
            autoFocus
          />
          <button onClick={() => val && onPick(val)} className="btn-gold rounded-xl px-5 py-3 text-sm font-semibold">OK</button>
        </div>
      )}
      {input === "date" && (
        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <input
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) onPick(val); }}
              placeholder={lang === "ro" ? "ex. 15 iulie 2026" : "e.g. 15 July 2026"}
              className="card-soft flex-1 rounded-xl px-4 py-3 text-base outline-none focus:border-gold"
            />
            <button onClick={() => setShowCal((s) => !s)} className={`rounded-xl border px-3 py-3 text-lg transition ${showCal ? "border-gold bg-gold/10" : "border-ink/10 hover:border-gold"}`}>📅</button>
            <button onClick={() => val.trim() && onPick(val)} className="btn-gold rounded-xl px-5 py-3 text-sm font-semibold">OK</button>
          </div>
          {showCal && <Calendar lang={lang} onPick={(d) => onPick(d)} />}
        </div>
      )}

      {/* Quick-pick choice cards */}
      {options.length > 0 && (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
          {options.map((o, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 280, damping: 24 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPick(o.label)}
              className="group relative flex min-h-[104px] flex-col items-start gap-2 overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-white to-ivory/60 p-4 text-left shadow-[0_1px_2px_rgba(26,26,46,.04),0_12px_30px_-20px_rgba(26,26,46,.25)] transition hover:border-gold hover:shadow-[0_18px_40px_-20px_rgba(200,162,75,.55)]"
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gold/10 blur-xl transition group-hover:bg-gold/20" />
              {o.emoji ? (
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/10 text-2xl">{o.emoji}</span>
              ) : (
                <span className="grid h-7 w-7 place-items-center rounded-full bg-ink/5 text-[12px] font-semibold text-gold-deep">{i + 1}</span>
              )}
              <span className="text-display text-[15px] leading-tight text-ink">{o.label}</span>
              {o.desc && <span className="text-[12px] leading-snug text-ink-soft">{o.desc}</span>}
            </motion.button>
          ))}
        </div>
      )}

      {!input && (
        <button onClick={onOther} className="inline-flex items-center gap-2 rounded-full border border-dashed border-gold/40 bg-gold/[0.04] px-4 py-2 text-sm text-ink-soft transition hover:border-gold hover:text-ink">
          ✍️ {lang === "ro" ? "Altceva… (scrie)" : "Other… (type)"}
        </button>
      )}
    </div>
  );
}
