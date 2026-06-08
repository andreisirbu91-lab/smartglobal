import OpenAI from "openai";
import { systemPrompt } from "./prompt";
import { TOOLS, executeTool } from "./tools";
import { quote } from "./engine";
import { logTurn, capturedOf } from "./logger";
import type { OrderState, Quote } from "./types";

const client = new OpenAI({
  apiKey: process.env.LLMOK_API_KEY,
  baseURL: process.env.LLMOK_BASE_URL ?? "https://burn.llmok.app/v1",
  // The LLMok proxy's WAF blocks the SDK's default "OpenAI/JS" user-agent.
  defaultHeaders: { "User-Agent": "Mozilla/5.0" },
});

const MODEL = process.env.LLMOK_MODEL ?? "claude-sonnet-4-6";

export type TextMessage = { role: "user" | "assistant"; content: string };

export type ConversationResult = {
  assistantMessage: string;
  order: OrderState;
  quote: Quote;
};

/** Real-time status of the exact tool the agent is calling. */
function statusFor(tool: string, lang: string): string | null {
  const ro = lang === "ro";
  const m: Record<string, [string, string]> = {
    discover_places: ["Caut locuri reale lângă tine…", "Searching real places near you…"],
    search_venues: ["Caut locații potrivite…", "Finding the right venues…"],
    propose_package: ["🧩 Compun pachetul tău complet…", "🧩 Putting your full package together…"],
    recommend_items: ["Aduc variante pe ecran…", "Bringing options to your screen…"],
    recommend_tiers: ["Pregătesc pachete pe niveluri…", "Building bundle tiers…"],
    add_item: ["Adaug în pachet…", "Adding to your package…"],
    add_place: ["Adaug locul în plan…", "Adding the place to your plan…"],
    select_venue: ["Aleg locația…", "Selecting the venue…"],
    remove_item: ["Scot din pachet…", "Removing from your package…"],
    add_custom_addon: ["Creez un add-on personalizat…", "Creating a custom add-on…"],
    set_context: ["Notez detaliile…", "Noting the details…"],
    set_graduates: ["Actualizez numărul…", "Updating the headcount…"],
    set_guests: ["Actualizez invitații…", "Updating the guest count…"],
    set_event_type: ["Pregătesc evenimentul…", "Setting up the event…"],
    apply_promo: ["🏷Aplic codul…", "🏷Applying the code…"],
    negotiate_discount: ["🤝 Discut cu furnizorul pentru o reducere…", "🤝 Talking to the provider for a deal…"],
    set_contact: ["Salvez datele tale…", "Saving your details…"],
    goto_step: ["Trec la pasul următor…", "Moving to the next step…"],
    get_quote: ["Verific totalul…", "Checking the total…"],
  };
  const e = m[tool];
  return e ? (ro ? e[0] : e[1]) : null;
}

/**
 * Runs one assistant turn: feeds history + current order to the model, lets it
 * call tools (which mutate the order via the engine), and returns the final
 * narration plus the updated order. Stateless — the client owns the order.
 *
 * Note: token streaming is NOT used — the LLMok metered gateway rejects stream:true
 * ("Streaming is disabled for metered gateway routes"). We return the full turn at once.
 */
export async function runConversation(
  history: TextMessage[],
  initial: OrderState,
  onStatus?: (text: string) => void
): Promise<ConversationResult> {
  let order = initial;
  const toolLog: { name: string; args: unknown }[] = [];
  const lastUser = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  const done = (assistantMessage: string): ConversationResult => {
    void logTurn({
      at: new Date().toISOString(),
      lang: order.language,
      lastUser,
      in: capturedOf(initial),
      tools: toolLog,
      reply: assistantMessage,
      out: capturedOf(order),
      nextChoice: order.choices?.question,
    });
    return { assistantMessage, order, quote: quote(order) };
  };

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt(order) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  // Allow several tool rounds within a single turn.
  for (let round = 0; round < 7; round++) {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages,
      tools: TOOLS,
      tool_choice: "auto",
    });
    const choice = completion.choices[0].message;

    if (choice.tool_calls?.length) {
      messages.push(choice);
      for (const call of choice.tool_calls) {
        if (call.type !== "function") continue;
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          args = {};
        }
        toolLog.push({ name: call.function.name, args });
        const status = statusFor(call.function.name, order.language);
        if (status) onStatus?.(status);
        const { state, result } = await executeTool(call.function.name, args, order);
        order = state;
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
      // Refresh the system prompt so the model sees the updated package.
      messages[0] = { role: "system", content: systemPrompt(order) };
      continue;
    }

    return done(choice.content ?? "");
  }

  // Loop exhausted: force a final narration (no more tools) so we never return
  // a canned "I updated your package" — the model summarizes what it just did.
  try {
    const final = await client.chat.completions.create({
      model: MODEL,
      messages,
      tools: TOOLS,
      tool_choice: "none",
    });
    const text = final.choices[0].message.content;
    if (text) return done(text);
  } catch {
    /* fall through */
  }

  return done(
    order.language === "ro"
      ? "Am actualizat pachetul. Vrei să mai adăugăm ceva?"
      : "I've updated your package. Anything else you'd like to add?"
  );
}
