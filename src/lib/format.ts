import type { Lang, Localized, Unit } from "./types";

/** App currency is EUR. Approx. conversion to show the RON equivalent. */
export const RON_PER_EUR = 4.97;

export const money = (n: number): string =>
  `€${n.toLocaleString("en-IE", { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;

/** RON equivalent label, e.g. "≈ 99.400 RON". */
export const ron = (eur: number): string =>
  `≈ ${Math.round(eur * RON_PER_EUR).toLocaleString("ro-RO")} RON`;

export const tr = (l: Localized, lang: Lang): string => l[lang];

export const unitLabel: Record<Unit, Localized> = {
  per_graduate: { en: "per graduate", ro: "per absolvent" },
  per_guest: { en: "per guest", ro: "per invitat" },
  flat: { en: "flat", ro: "fix" },
};
