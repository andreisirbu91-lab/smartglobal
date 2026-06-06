import { runConversation, type TextMessage } from "@/lib/llm";
import { emptyOrder } from "@/lib/engine";
import type { OrderState } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Streams newline-delimited JSON events so the customer is never left waiting:
 *   {"type":"status","text":"🔎 Searching…"}   (zero or more, while tools run)
 *   {"type":"final","assistantMessage":"…","order":{…}}
 */
export async function POST(req: Request) {
  const body = (await req.json()) as { messages?: TextMessage[]; order?: OrderState };
  const messages = (body.messages ?? []).filter((m) => m.role === "user" || m.role === "assistant");
  const order = body.order ?? emptyOrder("en");

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        if (!process.env.LLMOK_API_KEY) {
          send({
            type: "final",
            assistantMessage:
              order.language === "ro"
                ? "Configurarea AI lipsește (LLMOK_API_KEY). Catalogul și coșul funcționează în continuare."
                : "AI is not configured yet (LLMOK_API_KEY). The catalog and cart still work.",
            order,
          });
          return;
        }
        const result = await runConversation(messages, order, (text) => send({ type: "status", text }));
        send({ type: "final", assistantMessage: result.assistantMessage, order: result.order });
      } catch (err) {
        console.error("/api/chat error", err);
        send({
          type: "final",
          assistantMessage: order.language === "ro" ? "Am întâmpinat o problemă. Mai încearcă." : "I hit a snag. Please try again.",
          order,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
