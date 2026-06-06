import type { BookingRecord } from "@/lib/bookings";
import { EVENT_TYPES } from "@/lib/catalog";
import { money, ron, tr } from "@/lib/format";
import type { Lang } from "@/lib/types";

const L = {
  proforma: { en: "Proforma invoice", ro: "Factură proformă" },
  demo: { en: "DEMO — not a fiscal document", ro: "DEMO — nu este document fiscal" },
  seller: { en: "Seller", ro: "Furnizor" },
  buyer: { en: "Client", ro: "Client" },
  no: { en: "No.", ro: "Nr." },
  date: { en: "Date", ro: "Data" },
  item: { en: "Description", ro: "Descriere" },
  qty: { en: "Qty", ro: "Cant." },
  unit: { en: "Unit", ro: "Preț unitar" },
  amount: { en: "Amount", ro: "Valoare" },
  subtotal: { en: "Subtotal", ro: "Subtotal" },
  total: { en: "Total", ro: "Total" },
  vat: { en: "incl. VAT 19%", ro: "din care TVA 19%" },
  paid: { en: "PAID (deposit, demo)", ro: "ACHITAT (avans, demo)" },
};
const t = (k: keyof typeof L, lang: Lang) => L[k][lang];

export function Invoice({ booking, lang }: { booking: BookingRecord; lang: Lang }) {
  const q = booking.quote;
  const evt = EVENT_TYPES.find((e) => e.id === booking.event_type);
  const vat = Math.round((q.total - q.total / 1.19) * 100) / 100;
  const date = booking.created_at.slice(0, 10);

  return (
    <div className="card-soft overflow-hidden text-ink">
      <div className="flex items-start justify-between gap-3 border-b border-gold/15 p-5">
        <div>
          <div className="text-display text-lg">{t("proforma", lang)}</div>
          <div className="text-[12px] text-ink-soft">{t("no", lang)} PRO-{booking.ref} · {t("date", lang)} {date}</div>
        </div>
        <div className="text-right">
          {booking.paid ? (
            <span className="rounded-full bg-green-600/10 px-3 py-1 text-[11px] font-semibold text-green-700">✓ {t("paid", lang)}</span>
          ) : (
            <span className="rounded-full bg-gold/12 px-3 py-1 text-[11px] font-semibold text-gold-deep">{t("demo", lang)}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-5 text-[12px]">
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wide text-ink-soft">{t("seller", lang)}</div>
          <div className="font-medium">Start Global Events SRL</div>
          <div className="text-ink-soft">CIF RO00000000 · J40/0000/2026</div>
          <div className="text-ink-soft">Constanța, România</div>
        </div>
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wide text-ink-soft">{t("buyer", lang)}</div>
          <div className="font-medium">{booking.contact?.name ?? "—"}</div>
          <div className="text-ink-soft">{booking.contact?.email ?? ""}</div>
          {evt && <div className="text-ink-soft">{tr(evt.name, lang)}{booking.state.context?.city ? ` · ${booking.state.context.city}` : ""}</div>}
        </div>
      </div>

      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-y border-gold/15 text-left text-ink-soft">
            <th className="p-2 pl-5 font-medium">{t("item", lang)}</th>
            <th className="p-2 text-center font-medium">{t("qty", lang)}</th>
            <th className="p-2 text-right font-medium">{t("unit", lang)}</th>
            <th className="p-2 pr-5 text-right font-medium">{t("amount", lang)}</th>
          </tr>
        </thead>
        <tbody>
          {q.lines.map((l) => (
            <tr key={l.itemId} className="border-b border-ink/5">
              <td className="p-2 pl-5">{tr(l.name, lang)}</td>
              <td className="p-2 text-center">{l.quantity}</td>
              <td className="p-2 text-right">{money(l.unitPrice)}</td>
              <td className="p-2 pr-5 text-right">{money(l.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto max-w-xs space-y-1 p-5 text-[13px]">
        <Row label={t("subtotal", lang)} value={money(q.subtotal)} muted />
        {q.discounts.map((d) => (
          <Row key={d.code} label={`− ${tr(d.label, lang)}`} value={`−${money(d.amount)}`} tone />
        ))}
        <div className="my-1 h-px bg-gold/20" />
        <div className="flex items-center justify-between">
          <span className="text-display text-base">{t("total", lang)}</span>
          <span className="text-display text-lg text-gold-deep">{money(q.total)}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-ink-soft">
          <span>{t("vat", lang)}</span>
          <span>{money(vat)}</span>
        </div>
        <div className="text-right text-[11px] text-ink-soft">{ron(q.total)}</div>
      </div>
    </div>
  );
}

function Row({ label, value, muted, tone }: { label: string; value: string; muted?: boolean; tone?: boolean }) {
  const c = tone ? "text-wine" : muted ? "text-ink-soft" : "text-ink";
  return (
    <div className="flex items-center justify-between">
      <span className={c}>{label}</span>
      <span className={c}>{value}</span>
    </div>
  );
}
