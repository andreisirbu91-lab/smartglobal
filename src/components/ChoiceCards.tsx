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
        <div className="space-y-2">
          <div className="rule-gold" />
          <h3 className="text-display text-[26px] leading-[1.12] text-ink">{question}</h3>
        </div>
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
              className="group flex min-h-[96px] flex-col items-start gap-2 rounded-[0.9rem] border border-gold/20 bg-card p-5 text-left shadow-[0_1px_2px_rgba(38,35,32,.03),0_18px_42px_-30px_rgba(38,35,32,.3)] transition hover:-translate-y-0.5 hover:border-gold/55 hover:shadow-[0_24px_50px_-28px_rgba(177,144,76,.42)]"
            >
              <span className="text-display text-[13px] text-gold-deep">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-display text-[16px] leading-tight text-ink">{o.label}</span>
              {o.desc && <span className="text-[12.5px] leading-snug text-ink-soft">{o.desc}</span>}
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
