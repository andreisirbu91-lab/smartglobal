"use client";

import { useEffect, useState } from "react";

const COLORS = ["#c8a24b", "#e3cf9c", "#6d2b3a", "#1a1a2e", "#a9842f", "#f0c2cf"];

type Piece = { l: number; delay: number; dur: number; c: string; r: number; w: number };

export function Confetti() {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    setPieces(
      Array.from({ length: 70 }, () => ({
        l: Math.random() * 100,
        delay: Math.random() * 0.7,
        dur: 1.8 + Math.random() * 1.6,
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
        r: Math.random() * 360,
        w: 6 + Math.random() * 6,
      }))
    );
    const t = setTimeout(() => setPieces([]), 3600);
    return () => clearTimeout(t);
  }, []);

  if (!pieces.length) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.l}%`,
            width: p.w,
            height: p.w * 1.6,
            background: p.c,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            transform: `rotate(${p.r}deg)`,
          }}
        />
      ))}
      <style>{`.confetti-piece{position:absolute;top:-16px;border-radius:2px;animation-name:confetti-fall;animation-timing-function:cubic-bezier(.25,.6,.45,1);animation-fill-mode:forwards}@keyframes confetti-fall{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:.85;transform:translateY(108vh) rotate(720deg)}}`}</style>
    </div>
  );
}
