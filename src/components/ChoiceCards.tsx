"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ChoiceOption, Lang } from "@/lib/types";
import { Calendar } from "@/components/Calendar";
import { topVoted, VoteBar, type Voting } from "@/components/voting";

export function ChoiceCards({
  question,
  options,
  input,
  lang,
  onPick,
  onOther,
  voting,
}: {
  question?: string;
  options: ChoiceOption[];
  input?: "number" | "date" | "text";
  lang: Lang;
  onPick: (label: string) => void;
  onOther: () => void;
  voting?: Voting;
}) {
  const winner = voting ? topVoted(options.map((o) => o.label), voting.count) : null;
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
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
          {options.map((o, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onPick(o.label)}
              className={`group relative flex min-h-[128px] cursor-pointer flex-col items-start gap-2 overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-ivory/40 p-6 text-left shadow-[0_1px_2px_rgba(38,35,32,.04),0_22px_50px_-32px_rgba(38,35,32,.34)] transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(177,144,76,.5)] ${winner === o.label ? "border-gold/60 ring-1 ring-gold/30" : "border-gold/20 hover:border-gold/55"}`}
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gold/10 blur-2xl transition group-hover:bg-gold/20" />
              <span className="text-display text-[15px] text-gold-deep">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-display text-[20px] leading-tight text-ink">{o.label}</span>
              {o.desc && <span className="text-[13px] leading-snug text-ink-soft">{o.desc}</span>}
              <span className="mt-auto text-[13px] font-medium text-gold-deep opacity-0 transition group-hover:opacity-100">{lang === "ro" ? "Alege" : "Choose"} →</span>
              {voting && <div className="w-full"><VoteBar id={o.label} voting={voting} lang={lang} winner={winner === o.label} /></div>}
            </motion.div>
          ))}
        </div>
      )}

      <button onClick={onOther} className="text-[13px] text-ink-soft underline-offset-2 transition hover:text-ink hover:underline">
        {lang === "ro" ? "Altceva? Scrie în chat" : "Something else? Type in the chat"}
      </button>
    </div>
  );
}
