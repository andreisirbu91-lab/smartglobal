"use client";

import { useState } from "react";
import type { Lang } from "@/lib/types";
import { Button } from "./ui";

const L = {
  share: { en: "Share", ro: "Distribuie" },
  copied: { en: "Link copied!", ro: "Link copiat!" },
  print: { en: "Print / Save PDF", ro: "Printează / Salvează PDF" },
  whatsapp: { en: "WhatsApp", ro: "WhatsApp" },
};

export function BookingActions({ lang, waMessage }: { lang: Lang; waMessage?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Event booking", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user dismissed */
    }
  }

  function whatsapp() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${waMessage ?? "Event package"} ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="no-print flex flex-col gap-2 sm:flex-row sm:justify-center">
      <Button variant="gold" onClick={whatsapp}>💬 {L.whatsapp[lang]}</Button>
      <Button variant="ghost" onClick={share}>↗ {copied ? L.copied[lang] : L.share[lang]}</Button>
      <Button variant="ghost" onClick={() => window.print()}>⎙ {L.print[lang]}</Button>
    </div>
  );
}
