"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/types";
import { money, ron } from "@/lib/format";

const L = {
  pay: { en: "Pay deposit", ro: "Plătește avansul" },
  paying: { en: "Processing…", ro: "Se procesează…" },
  card: { en: "Card number", ro: "Număr card" },
  exp: { en: "Expiry", ro: "Expirare" },
  name: { en: "Name on card", ro: "Nume pe card" },
  deposit: { en: "Deposit (20%)", ro: "Avans (20%)" },
  total: { en: "Package total", ro: "Total pachet" },
  demo: { en: "Demo checkout — no real payment is taken.", ro: "Checkout demo — nu se încasează bani reali." },
  secure: { en: "Processed via SmartBill (demo)", ro: "Procesat prin SmartBill (demo)" },
  invoiceNote: { en: "A SmartBill proforma invoice is issued automatically.", ro: "Se emite automat factura proformă SmartBill." },
};
const tr = (k: keyof typeof L, lang: Lang) => L[k][lang];

export function PayForm({ id, deposit, total, ref_, lang }: { id: string; deposit: number; total: number; ref_: string; lang: Lang }) {
  const router = useRouter();
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [exp, setExp] = useState("12 / 28");
  const [cvc, setCvc] = useState("123");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function pay() {
    setLoading(true);
    try {
      const res = await fetch("/api/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error();
      await new Promise((r) => setTimeout(r, 700)); // simulate processing
      router.push(`/booking/${id}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="card-soft overflow-hidden">
      <div className="bg-ink px-6 py-5 text-ivory">
        <div className="text-[12px] text-ivory/60">Start Global Events · {ref_}</div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-sm text-ivory/80">{tr("deposit", lang)}</span>
          <span className="text-display text-2xl text-gold-soft">{money(deposit)}</span>
        </div>
        <div className="mt-0.5 flex items-baseline justify-between text-[12px] text-ivory/50">
          <span>{tr("total", lang)} {money(total)}</span>
          <span>{ron(deposit)}</span>
        </div>
      </div>

      <div className="space-y-3 p-6">
        <Field label={tr("name", lang)}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="—" className="input" />
        </Field>
        <Field label={tr("card", lang)}>
          <div className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-3">
            <span>💳</span>
            <input value={card} onChange={(e) => setCard(e.target.value)} className="w-full bg-transparent py-2.5 outline-none" />
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={tr("exp", lang)}><input value={exp} onChange={(e) => setExp(e.target.value)} className="input" /></Field>
          <Field label="CVC"><input value={cvc} onChange={(e) => setCvc(e.target.value)} className="input" /></Field>
        </div>

        <button onClick={pay} disabled={loading} className="btn-gold mt-2 w-full rounded-full py-3 text-sm font-semibold disabled:opacity-60">
          {loading ? tr("paying", lang) : `${tr("pay", lang)} · ${money(deposit)}`}
        </button>
        <p className="text-center text-[11px] text-ink-soft">🔒 {tr("secure", lang)}</p>
        <p className="text-center text-[11px] text-ink-soft">🧾 {tr("invoiceNote", lang)}</p>
        <p className="text-center text-[11px] text-gold-deep">{tr("demo", lang)}</p>
      </div>

      <style>{`.input{width:100%;border:1px solid rgba(26,26,46,.1);border-radius:.75rem;background:#fff;padding:.625rem .75rem;outline:none}.input:focus{border-color:#c8a24b}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
