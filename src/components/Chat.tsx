"use client";

import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/types";
import { t } from "@/lib/i18n";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export function Chat({
  messages,
  lang,
  loading,
  statusText,
  onSend,
  onStop,
  focusSignal,
  surface,
}: {
  messages: ChatMessage[];
  lang: Lang;
  loading: boolean;
  statusText?: string | null;
  onSend: (text: string) => void;
  onStop?: () => void;
  focusSignal?: number;
  surface?: React.ReactNode;
}) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, surface]);

  useEffect(() => {
    if (focusSignal) inputRef.current?.focus();
  }, [focusSignal]);

  function submit() {
    const v = text.trim();
    if (!v || loading) return;
    onSend(v);
    setText("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 scroll-thin">
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {loading && (
          <div className="animate-rise flex items-center gap-2 text-sm text-ink-soft">
            <Dots />
            <span>{statusText ?? t("thinking", lang)}</span>
          </div>
        )}
        {surface && <div className="animate-rise pt-1">{surface}</div>}
        <div ref={endRef} />
      </div>

      <div className="no-print mt-3 flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={t("chatPlaceholder", lang)}
          className="max-h-32 min-h-[46px] flex-1 resize-none rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none focus:border-gold"
        />
        {loading ? (
          <button
            onClick={onStop}
            className="grid h-[46px] w-[46px] place-items-center rounded-2xl border border-wine/30 bg-wine/10 text-wine transition hover:bg-wine/20"
            aria-label="stop"
            title={lang === "ro" ? "Oprește" : "Stop"}
          >
            ■
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!text.trim()}
            className="btn-gold grid h-[46px] w-[46px] place-items-center rounded-2xl text-lg disabled:opacity-50"
            aria-label={t("send", lang)}
          >
            ↑
          </button>
        )}
      </div>
    </div>
  );
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`animate-rise flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-ink text-ivory rounded-br-md"
            : "card-soft rounded-bl-md text-ink"
        }`}
      >
        {renderMarkdown(content)}
      </div>
    </div>
  );
}

/** Render **bold** safely and NEVER leak literal markdown symbols (**, ***, `, stray *). */
function renderMarkdown(text: string): React.ReactNode {
  const clean = text.replace(/\*\*\*+/g, "").replace(/`+/g, ""); // drop *** runs and backticks
  return clean.split("\n").map((line, li) => (
    <span key={li}>
      {li > 0 && <br />}
      {line.split(/(\*\*[^*\n]+\*\*)/g).map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        return <span key={i}>{part.replace(/\*/g, "")}</span>; // strip any leftover single asterisks
      })}
    </span>
  ));
}

function Dots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
