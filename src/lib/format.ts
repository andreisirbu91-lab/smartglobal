import type { Lang, Localized, Unit } from "./types";

/** App currency is RON (the real Star Global catalog). Approx € equivalent shown as a hint. */
export const RON_PER_EUR = 4.97;

/** Primary price label in RON, e.g. "245 RON" / "24.500 RON". */
export const money = (n: number): string =>
  `${Math.round(n).toLocaleString("ro-RO")} RON`;

/** Secondary € equivalent, e.g. "≈ €49". */
export const ron = (lei: number): string =>
  `≈ €${Math.round(lei / RON_PER_EUR).toLocaleString("en-IE")}`;

export const tr = (l: Localized, lang: Lang): string => l[lang];

export const unitLabel: Record<Unit, Localized> = {
  per_graduate: { en: "per graduate", ro: "per absolvent" },
  per_guest: { en: "per guest", ro: "per invitat" },
  flat: { en: "flat", ro: "fix" },
};
