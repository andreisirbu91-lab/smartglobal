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
  const list = items.map((i) => `${i.id} | ${i.name.en} | ${i.category} | €${i.price} ${i.unit}${i.popular ? " | popular" : ""}`).join("\n");

  const system = `You are a senior event-planning specialist. Given an event, headcount and budget, you assemble ONE COMPLETE, well-rounded package that covers EVERYTHING an event of this type needs — not just a few items. (The real venue is booked separately from live listings, so do NOT include a venue id, but cover everything else.) MUST-HAVE essentials that you must ALWAYS include and NEVER skip: the dinner/banquet MENU and PHOTO (photo/video). List these FIRST (pick the cheapest photo/menu option if the budget is tight) so they always survive the budget. Then the album/USB keepsakes, the gown/cap and DIPLOMAS for graduations, a welcome drink, music/DJ, décor, cake, and 1-2 delightful extras — ordered most-essential to least. A package without a photo is wrong. Respect the budget — per_guest items multiply by guests, per_graduate by honorees, flat are one-off; the package total must stay within budget (build UP TO it, never over). Return ONLY JSON: {"itemIds": string[], "note": string}. Use ONLY ids from the catalog. The note is one short, warm sentence.`;

  const user = `Event: ${state.eventType}
Honorees: ${state.graduates}
Guests: ${state.guests}
Budget (EUR): ${state.context.budget ?? "flexible"}
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
