import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { OrderState } from "./types";

/**
 * Shared collaborative sessions — a link the whole class (or the godparents)
 * open to see & edit the SAME package + chat. File-backed, last-write-wins,
 * with a lightweight presence heartbeat. Opt-in; normal solo use never touches it.
 */

const DIR = path.join(process.cwd(), ".data", "sessions");
const PRESENCE_WINDOW = 15_000; // a client is "online" if seen in the last 15s

export type SessionMsg = { role: string; content: string };
export type SessionData = {
  rev: number;
  order: OrderState;
  messages: SessionMsg[];
  lastWriter?: string;
  presence: Record<string, number>;
  /** Group voting: optionId -> list of voter clientIds. */
  votes?: Record<string, string[]>;
  updatedAt: number;
};

const file = (id: string) => path.join(DIR, id.replace(/[^a-z0-9]/gi, "") + ".json");

async function read(id: string): Promise<SessionData | null> {
  try {
    return JSON.parse(await fs.readFile(file(id), "utf8")) as SessionData;
  } catch {
    return null;
  }
}

async function write(id: string, d: SessionData): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(file(id), JSON.stringify(d), "utf8");
}

export function activeCount(d: SessionData): number {
  const cutoff = Date.now() - PRESENCE_WINDOW;
  return Object.values(d.presence || {}).filter((t) => t > cutoff).length;
}

export async function createSession(order: OrderState, messages: SessionMsg[]): Promise<string> {
  const id = crypto.randomUUID().split("-")[0] + crypto.randomUUID().split("-")[0];
  await write(id, { rev: 1, order, messages, presence: {}, updatedAt: Date.now() });
  return id;
}

export async function getSession(id: string, clientId?: string): Promise<SessionData | null> {
  const d = await read(id);
  if (!d) return null;
  if (clientId) {
    d.presence = d.presence || {};
    d.presence[clientId] = Date.now();
    await write(id, d);
  }
  return d;
}

/** Toggle a participant's vote for an option; returns the updated session. */
export async function voteSession(id: string, clientId: string, optionId: string): Promise<SessionData | null> {
  const d = await read(id);
  if (!d) return null;
  d.votes = d.votes || {};
  const voters = new Set(d.votes[optionId] || []);
  if (voters.has(clientId)) voters.delete(clientId);
  else {
    // one vote per person across the currently-voted set: remove their other votes,
    // then add this one (a person has ONE current intention).
    for (const k of Object.keys(d.votes)) d.votes[k] = (d.votes[k] || []).filter((c) => c !== clientId);
    voters.add(clientId);
  }
  d.votes[optionId] = [...voters];
  d.rev += 1;
  d.updatedAt = Date.now();
  d.presence = d.presence || {};
  d.presence[clientId] = Date.now();
  await write(id, d);
  return d;
}

export async function putSession(
  id: string,
  order: OrderState,
  messages: SessionMsg[],
  clientId: string
): Promise<SessionData | null> {
  const d = await read(id);
  if (!d) return null;
  d.rev += 1;
  d.order = order;
  d.messages = messages;
  d.lastWriter = clientId;
  d.updatedAt = Date.now();
  d.presence = d.presence || {};
  if (clientId) d.presence[clientId] = Date.now();
  await write(id, d);
  return d;
}
