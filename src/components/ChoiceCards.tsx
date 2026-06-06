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
    <div className="space-y-3.5">
      {question && (
        <h3 className="text-display text-[20px] leading-snug text-ink">{question}</h3>
      )}

      {(input === "number" || input === "text") && (
        <div className="flex items-end gap-2">
          <input
            type={input === "number" ? "number" : "text"}
            min={input === "number" ? 1 : undefined}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) onPick(val); }}
            placeholder={input === "number" ? (lang === "ro" ? "scrie numărul" : "type the number") : (lang === "ro" ? "scrie aici (ex. alt oraș)" : "type here (e.g. another city)")}
            className={`rounded-lg border border-ink/15 bg-white px-3.5 py-2.5 text-base outline-none focus:border-ink/40 ${input === "number" ? "w-36" : "flex-1"}`}
            autoFocus
          />
          <button onClick={() => val.trim() && onPick(val)} className="btn-gold px-5 py-2.5 text-sm font-medium">OK</button>
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
              className="flex-1 rounded-lg border border-ink/15 bg-white px-3.5 py-2.5 text-base outline-none focus:border-ink/40"
            />
            <button onClick={() => setShowCal((s) => !s)} className={`rounded-lg border px-3.5 py-2.5 text-sm transition ${showCal ? "border-ink/40 bg-ivory" : "border-ink/15 hover:border-ink/30"}`}>
              {lang === "ro" ? "Calendar" : "Calendar"}
            </button>
            <button onClick={() => val.trim() && onPick(val)} className="btn-gold px-5 py-2.5 text-sm font-medium">OK</button>
          </div>
          {showCal && <Calendar lang={lang} onPick={(d) => onPick(d)} />}
        </div>
      )}

      {options.length > 0 && (
        <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}>
          {options.map((o, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onPick(o.label)}
              className="group flex min-h-[92px] flex-col items-start gap-1.5 rounded-xl border border-ink/8 bg-white p-4 text-left shadow-[0_1px_2px_rgba(35,34,32,.04),0_14px_34px_-26px_rgba(35,34,32,.26)] transition hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-[0_20px_44px_-24px_rgba(169,133,69,.4)]"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-gold/12 text-[11px] font-semibold text-gold-deep">{i + 1}</span>
              <span className="text-display text-[15px] leading-tight text-ink">{o.label}</span>
              {o.desc && <span className="text-[12px] leading-snug text-ink-soft">{o.desc}</span>}
            </motion.button>
          ))}
        </div>
      )}

      <button onClick={onOther} className="text-[13px] text-ink-soft underline-offset-2 transition hover:text-ink hover:underline">
        {lang === "ro" ? "Altceva? Scrie în chat" : "Something else? Type in the chat"}
      </button>
    </div>
  );
}
