import { promises as fs } from "fs";
import path from "path";
import type { OrderState } from "./types";

const LOG_PATH = path.join(process.cwd(), ".data", "chat-log.jsonl");

/** A compact snapshot of what's captured, to spot re-asks at a glance. */
export function capturedOf(o: OrderState) {
  return {
    event: o.eventType,
    city: o.context.city ?? null,
    guests: o.guests,
    graduates: o.graduates,
    date: o.context.date ?? null,
    budget: o.context.budget ?? null,
    items: o.lines.length,
  };
}

export type TurnLog = {
  at: string;
  lang: string;
  lastUser: string;
  in: ReturnType<typeof capturedOf>;
  tools: { name: string; args: unknown }[];
  reply: string;
  out: ReturnType<typeof capturedOf>;
  nextChoice?: string;
};

export async function logTurn(entry: TurnLog): Promise<void> {
  try {
    await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
    await fs.appendFile(LOG_PATH, JSON.stringify(entry) + "\n", "utf8");
  } catch {
    /* logging must never break a turn */
  }
}

/** Read the last `n` turns (newest last). */
export async function readLog(n = 60): Promise<string> {
  try {
    const raw = await fs.readFile(LOG_PATH, "utf8");
    const lines = raw.trim().split("\n").filter(Boolean);
    return lines.slice(-n).join("\n");
  } catch {
    return "";
  }
}
