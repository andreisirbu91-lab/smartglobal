import OpenAI from "openai";
import { CATALOG } from "./catalog";
import type { OrderState } from "./types";

/**
 * The "solutions" agent — a second specialist the concierge orchestrates via a
 * tool call. Given the event, headcount and budget, it assembles a sensible,
 * attractive, budget-fitting package and returns the item ids to add. This is a
 * real agent-calls-agent step (the concierge confirms; this one finds options).
 */

const client = new OpenAI({
  apiKey: process.env.LLMOK_API_KEY,
  baseURL: process.env.LLMOK_BASE_URL ?? "https://burn.llmok.app/v1",
  defaultHeaders: { "User-Agent": "Mozilla/5.0" },
});
const MODEL = process.env.LLMOK_MODEL ?? "gpt-5.4-mini";

export type PackageProposal = { itemIds: string[]; note: string };

/** Translate the whole chat history when the customer switches language. */
export async function translateMessages(texts: string[], target: "en" | "ro"): Promise<string[]> {
  if (!texts.length) return texts;
  const lang = target === "ro" ? "Romanian" : "English";
  try {
    const resp = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `Translate each string in the JSON array to ${lang}. Keep markdown (**bold**), emojis and prices exactly. Return ONLY a JSON array of the translated strings, same length and order.`,
        },
        { role: "user", content: JSON.stringify(texts) },
      ],
    });
    const parsed = extractJson(resp.choices[0].message.content ?? "");
    if (Array.isArray(parsed) && parsed.length === texts.length) return parsed.map(String);
    return texts;
  } catch {
    return texts;
  }
}

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        /* fall through */
      }
    }
    return null;
  }
}

export async function proposePackage(state: OrderState, preferences?: string): Promise<PackageProposal> {
  const items = CATALOG.filter((i) => i.eventTypes.length === 0 || (state.eventType && i.eventTypes.includes(state.eventType)));
  const list = items.map((i) => `${i.id} | ${i.name.en} | ${i.category} | ${i.price} ${i.currency === "EUR" ? "EUR" : "RON"} ${i.unit}${i.popular ? " | popular" : ""}`).join("\n");

  const system = `You assemble ONE COMPLETE graduation package that fits the budget. The CORE is a graduation PACKAGE — you MUST include EXACTLY ONE of: sga_base (125/grad) / sga_expert (245/grad) / sga_vip (320/grad). Pick the HIGHEST tier whose total (price × graduates) still leaves room for a couple of extras inside the budget. The package ALREADY includes the photo session, photography, gown, cap and diploma — so do NOT add separate photo/gown/diploma items. After the package, if budget allows, add IN THIS ORDER: a yearbook album (album_2030 else album_2020), a custom cap (toca_digital), an afterparty (sga_afterparty), then 1-2 nice extras (candy_bar / prosecco_bar). Add the banquet (sga_banquet, 625/grad) only if the budget is clearly large enough. RULES: never add an album cover (album_plush/leather) without an album; never replace the package with loose items like a lone welcome_cocktail or DJ; a graduation package without sga_base/expert/vip is WRONG. Order itemIds PACKAGE FIRST, then album, cap, extras. Most prices are RON; artists (art_*) are in EUR — avoid them unless the budget is very large. Respect the budget: per_graduate × graduates, per_guest × guests, flat once; total within budget (build UP TO it, never over). Return ONLY JSON: {"itemIds": string[], "note": string} using catalog ids. The note is one short, warm sentence.`;

  const user = `Event: ${state.eventType}
Honorees: ${state.graduates}
Guests: ${state.guests}
Budget (RON): ${state.context.budget ?? "flexible"}
City: ${state.context.city ?? "?"}
Customer preferences: ${preferences ?? "none stated"}

Catalog:
${list}`;

  try {
    const resp = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const parsed = extractJson(resp.choices[0].message.content ?? "") as PackageProposal | null;
    if (!parsed || !Array.isArray(parsed.itemIds)) return { itemIds: [], note: "" };
    const valid = new Set(items.map((i) => i.id));
    return { itemIds: parsed.itemIds.filter((id) => valid.has(id)), note: String(parsed.note ?? "") };
  } catch (err) {
    console.error("proposePackage failed:", err);
    return { itemIds: [], note: "" };
  }
}
