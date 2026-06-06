import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import type { OrderState, Quote } from "./types";

/**
 * Booking store. Uses Supabase when configured; otherwise falls back to an
 * in-process map so the demo still works end-to-end (links live as long as the
 * server process does). Swap nothing — set the env vars and it persists.
 */

export type BookingRecord = {
  id: string;
  ref: string;
  event_type: string | null;
  contact: OrderState["contact"];
  state: OrderState;
  quote: Quote;
  total: number;
  language: string;
  status: string;
  paid?: boolean;
  /** Simulated SmartBill invoice issued on deposit payment. */
  invoice?: { series: string; number: number; issuedAt: string; deposit: number };
  created_at: string;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: SupabaseClient | null = null;
if (url && key) {
  supabase = createClient(url, key, { auth: { persistSession: false } });
}

// File-based fallback: survives across dev workers and a single container.
const DATA_DIR = join(process.cwd(), ".data", "bookings");
const fileFor = (id: string) => join(DATA_DIR, `${id}.json`);

export const usingSupabase = () => supabase !== null;

export async function saveBooking(record: BookingRecord): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("bookings").insert(record);
    if (error) throw new Error(error.message);
    return;
  }
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(fileFor(record.id), JSON.stringify(record), "utf8");
}

const hashNum = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % 900000) + 100000; // stable 6-digit
};

/** A SmartBill-style invoice for a booking (simulation — no real SmartBill call). */
export function buildInvoice(rec: BookingRecord): NonNullable<BookingRecord["invoice"]> {
  return { series: "SGA", number: hashNum(rec.ref || rec.id), issuedAt: new Date().toISOString(), deposit: Math.round(rec.total * 0.2) };
}

/** Mark paid and issue the SmartBill invoice. Returns the invoice for the receipt. */
export async function markPaid(id: string): Promise<BookingRecord["invoice"] | null> {
  const rec = await getBooking(id);
  if (!rec) return null;
  const invoice = rec.invoice ?? buildInvoice(rec);
  if (supabase) {
    await supabase.from("bookings").update({ paid: true, status: "paid", invoice }).eq("id", id);
    return invoice;
  }
  rec.paid = true;
  rec.status = "paid";
  rec.invoice = invoice;
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(fileFor(id), JSON.stringify(rec), "utf8");
  return invoice;
}

export async function getBooking(id: string): Promise<BookingRecord | null> {
  if (supabase) {
    const { data, error } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as BookingRecord) ?? null;
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    return JSON.parse(await readFile(fileFor(id), "utf8")) as BookingRecord;
  } catch {
    return null;
  }
}
