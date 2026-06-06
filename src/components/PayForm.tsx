"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/types";
import { money, ron } from "@/lib/format";

type Mode = "deposit" | "full" | "invoice";

const L = {
  paying: { en: "Processing…", ro: "Se procesează…" },
  card: { en: "Card number", ro: "Număr card" },
  exp: { en: "Expiry", ro: "Expirare" },
  name: { en: "Name on card", ro: "Nume pe card" },
  total: { en: "Package total", ro: "Total pachet" },
  toPay: { en: "To pay now", ro: "De plată acum" },
  demo: { en: "Demo checkout — no real payment is taken.", ro: "Checkout demo — nu se încasează bani reali." },
  secure: { en: "Card via Stripe · invoice via SmartBill (demo)", ro: "Card prin Stripe · factură prin SmartBill (demo)" },
  invoiceNote: { en: "A SmartBill invoice is issued automatically.", ro: "Se emite automat factura SmartBill." },
  choose: { en: "How would you like to pay?", ro: "Cum doriți să plătiți?" },
  mDeposit: { en: "20% deposit", ro: "Avans 20%" },
  mFull: { en: "Pay in full", ro: "Plată integrală" },
  mInvoice: { en: "Full on invoice", ro: "Integral pe factură" },
  mDepositSub: { en: "card now, rest before the event", ro: "card acum, restul înainte de eveniment" },
  mFullSub: { en: "card, all settled", ro: "card, totul achitat" },
  mInvoiceSub: { en: "bank transfer, pay later", ro: "transfer bancar, plată ulterioară" },
  payNow: { en: "Pay", ro: "Plătește" },
  confirmInvoice: { en: "Confirm — invoice by transfer", ro: "Confirmă — factură prin transfer" },
  transferNote: { en: "We'll email the SmartBill invoice with bank details; pay by transfer before the event.", ro: "Trimitem pe email factura SmartBill cu datele bancare; achitați prin transfer înainte de eveniment." },
};
const tr = (k: keyof typeof L, lang: Lang) => L[k][lang];

export function PayForm({ id, deposit, total, ref_, lang }: { id: string; deposit: number; total: number; ref_: string; lang: Lang }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("deposit");
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [exp, setExp] = useState("12 / 28");
  const [cvc, setCvc] = useState("123");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const amountNow = mode === "full" ? total : mode === "deposit" ? deposit : 0;

  async function pay() {
    setLoading(true);
    try {
      const res = await fetch("/api/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, mode }) });
      if (!res.ok) throw new Error();
      await new Promise((r) => setTimeout(r, 700)); // simulate processing
      router.push(`/booking/${id}`);
    } catch {
      setLoading(false);
    }
  }

  const opts: { m: Mode; label: string; sub: string; amt: number }[] = [
    { m: "deposit", label: tr("mDeposit", lang), sub: tr("mDepositSub", lang), amt: deposit },
    { m: "full", label: tr("mFull", lang), sub: tr("mFullSub", lang), amt: total },
    { m: "invoice", label: tr("mInvoice", lang), sub: tr("mInvoiceSub", lang), amt: 0 },
  ];

  return (
    <div className="card-soft overflow-hidden">
      <div className="bg-ink px-6 py-5 text-ivory">
        <div className="text-[12px] text-ivory/60">Start Global Events · {ref_}</div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-sm text-ivory/80">{tr("toPay", lang)}</span>
          <span className="text-display text-2xl text-gold-soft">{money(amountNow)}</span>
        </div>
        <div className="mt-0.5 flex items-baseline justify-between text-[12px] text-ivory/50">
          <span>{tr("total", lang)} {money(total)}</span>
          <span>{ron(amountNow)}</span>
        </div>
      </div>

      <div className="space-y-3 p-6">
        <div>
          <span className="mb-1.5 block text-[11px] uppercase tracking-wide text-ink-soft">{tr("choose", lang)}</span>
          <div className="space-y-2">
            {opts.map((o) => (
              <button
                key={o.m}
                onClick={() => setMode(o.m)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left transition ${mode === o.m ? "border-gold bg-gold/8" : "border-ink/10 hover:border-gold/50"}`}
              >
                <span>
                  <span className="block text-sm font-medium text-ink">{o.label}</span>
                  <span className="block text-[11px] text-ink-soft">{o.sub}</span>
                </span>
                <span className="text-display text-[15px] text-gold-deep">{o.amt > 0 ? money(o.amt) : money(total)}</span>
              </button>
            ))}
          </div>
        </div>

        {mode === "invoice" ? (
          <p className="rounded-xl bg-ivory px-4 py-3 text-[12px] leading-snug text-ink-soft">{tr("transferNote", lang)}</p>
        ) : (
          <>
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
          </>
        )}

        <button onClick={pay} disabled={loading} className="btn-gold mt-2 w-full rounded-full py-3 text-sm font-semibold disabled:opacity-60">
          {loading ? tr("paying", lang) : mode === "invoice" ? tr("confirmInvoice", lang) : `${tr("payNow", lang)} · ${money(amountNow)}`}
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
