import type { ReactNode } from "react";

export function Hairline({ className = "" }: { className?: string }) {
  return <div className={`gold-hairline ${className}`} />;
}

export function Pill({
  children,
  tone = "gold",
}: {
  children: ReactNode;
  tone?: "gold" | "ink" | "wine";
}) {
  const tones = {
    gold: "bg-gold/12 text-gold-deep border-gold/30",
    ink: "bg-ink/5 text-ink-soft border-ink/10",
    wine: "bg-wine/8 text-wine border-wine/20",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function SectionTitle({
  children,
  kicker,
}: {
  children: ReactNode;
  kicker?: string;
}) {
  return (
    <div className="space-y-1">
      {kicker && (
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold-deep/80">{kicker}</div>
      )}
      <h2 className="text-display text-2xl text-ink">{children}</h2>
    </div>
  );
}

type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "gold" | "ghost" | "ink";
  className?: string;
  type?: "button" | "submit";
};

export function Button({
  children,
  onClick,
  disabled,
  variant = "gold",
  className = "",
  type = "button",
}: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed";
  const variants = {
    gold: "btn-gold",
    ghost: "border border-gold/40 text-gold-deep hover:bg-gold/8 disabled:opacity-50",
    ink: "bg-ink text-ivory hover:bg-ink/90 disabled:opacity-50",
  } as const;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}
