"use client";

import type { Lang } from "@/lib/types";
import { itemById } from "@/lib/catalog";
import { money, tr } from "@/lib/format";
import { itemImage } from "@/lib/images";

/**
 * Premium side-by-side comparison of the three graduation packs (Base / Expert / VIP).
 * Rows are the full VIP contents; a ✓ marks which packs include each line — so the
 * customer sees EXACTLY what they buy. Shown instead of the carousel for pack tiers.
 */
export function PackageCompare({
  lang,
  grads,
  onSelect,
}: {
  lang: Lang;
  grads: number;
  onSelect: (packId: string) => void;
}) {
  const base = itemById("sga_base");
  const expert = itemById("sga_expert");
  const vip = itemById("sga_vip");
  if (!base || !expert || !vip) return null;

  const rows = vip.includes?.[lang] ?? [];
  const baseSet = new Set(base.includes?.[lang] ?? []);
  const expertSet = new Set(expert.includes?.[lang] ?? []);
  const n = Math.max(1, grads);

  const cols = [
    { pack: base, popular: false },
    { pack: expert, popular: true },
    { pack: vip, popular: false },
  ];
  const has = (idx: number, packId: string) => {
    const line = rows[idx];
    if (packId === "sga_vip") return true;
    if (packId === "sga_expert") return expertSet.has(line);
    return baseSet.has(line);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="kicker text-[10px] text-gold-deep">{lang === "ro" ? "Compară pachetele" : "Compare the packs"}</div>
        <h3 className="text-display text-[22px] leading-tight text-ink">{lang === "ro" ? "Ce conține fiecare pachet" : "What each pack includes"}</h3>
      </div>

      <div className="overflow-x-auto scroll-thin">
        <table className="w-full min-w-[460px] border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card pb-2 pr-2 align-bottom text-[11px] font-normal text-ink-soft">
                {lang === "ro" ? `pentru ${n} absolvenți` : `for ${n} graduates`}
              </th>
              {cols.map(({ pack, popular }) => (
                <th key={pack.id} className={`relative w-[32%] rounded-t-2xl px-2.5 pb-2 pt-3 text-center align-bottom ${popular ? "bg-gold/[0.07]" : ""}`}>
                  {popular && (
                    <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                      {lang === "ro" ? "Popular" : "Popular"}
                    </span>
                  )}
                  <div className="mx-auto mb-1.5 h-12 w-full max-w-[88px] overflow-hidden rounded-lg" style={{ background: "linear-gradient(135deg,#f3ecdd,#e3cf9c)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={itemImage(pack)} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  </div>
                  <div className="text-display text-[15px] leading-none text-ink">{tr(pack.name, lang).replace(/.*—\s*/, "").replace(/\s*Pack$/i, "")}</div>
                  <div className="mt-1 text-[12px] font-semibold text-gold-deep">{money(pack.price)}/{lang === "ro" ? "abs" : "grad"}</div>
                  <div className="text-[10px] text-ink-soft">{money(pack.price * n)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((line, i) => (
              <tr key={i} className="group">
                <td className="sticky left-0 z-10 bg-card border-t border-ink/[0.06] py-1.5 pr-2 text-[12px] leading-snug text-ink">{line}</td>
                {cols.map(({ pack, popular }) => (
                  <td key={pack.id} className={`border-t border-ink/[0.06] py-1.5 text-center align-middle ${popular ? "bg-gold/[0.04]" : ""}`}>
                    {has(i, pack.id)
                      ? <span className="text-gold-deep">✓</span>
                      : <span className="text-ink-soft/25">–</span>}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="sticky left-0 z-10 bg-card" />
              {cols.map(({ pack, popular }) => (
                <td key={pack.id} className={`px-2 pb-3 pt-3 text-center ${popular ? "rounded-b-2xl bg-gold/[0.07]" : ""}`}>
                  <button
                    onClick={() => onSelect(pack.id)}
                    className={`w-full rounded-full px-2 py-2 text-[12px] font-semibold transition ${popular ? "btn-gold" : "border border-gold/40 text-gold-deep hover:bg-gold/10"}`}
                  >
                    {lang === "ro" ? "Alege" : "Choose"}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
