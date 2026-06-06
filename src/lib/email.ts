import { Resend } from "resend";
import { EVENT_TYPES } from "./catalog";
import type { BookingRecord } from "./bookings";
import type { Lang } from "./types";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM ?? "Start Global Events <events@startglobal.rzs-it.ro>";

const money = (n: number) =>
  `€${n.toLocaleString("en-IE", { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;

const L = {
  subject: { en: "Your event booking is confirmed", ro: "Rezervarea ta este confirmată" },
  title: { en: "Booking confirmed", ro: "Rezervare confirmată" },
  hi: { en: "Hi", ro: "Salut" },
  thanks: {
    en: "Thank you! Your event package is reserved. Here is your itemized invoice.",
    ro: "Mulțumim! Pachetul tău este rezervat. Mai jos găsești factura detaliată.",
  },
  ref: { en: "Reference", ro: "Referință" },
  item: { en: "Item", ro: "Articol" },
  qty: { en: "Qty", ro: "Cant." },
  amount: { en: "Amount", ro: "Sumă" },
  subtotal: { en: "Subtotal", ro: "Subtotal" },
  total: { en: "Total", ro: "Total" },
  view: { en: "View booking", ro: "Vezi rezervarea" },
  footer: { en: "Start Global Events · Graduation Concierge", ro: "Start Global Events · Graduation Concierge" },
};
const tr = (k: keyof typeof L, lang: Lang) => L[k][lang];

export async function sendBookingEmail(record: BookingRecord): Promise<{ sent: boolean; error?: string }> {
  const to = record.contact?.email;
  if (!resend) return { sent: false, error: "no_api_key" };
  if (!to) return { sent: false, error: "no_recipient" };

  const lang = (record.language as Lang) ?? "en";
  const evt = EVENT_TYPES.find((e) => e.id === record.event_type);
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://startglobal.rzs-it.ro";
  const link = `${base}/booking/${record.id}`;
  const q = record.quote;

  const rows = q.lines
    .map(
      (l) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee2c8;color:#1a1a2e;font-size:14px">${l.name[lang]}<br><span style="color:#8a8a9a;font-size:12px">${money(l.unitPrice)} × ${l.quantity}</span></td>
        <td style="padding:10px 0;border-bottom:1px solid #eee2c8;text-align:right;color:#1a1a2e;font-size:14px;white-space:nowrap">${money(l.total)}</td>
      </tr>`
    )
    .join("");

  const discounts = q.discounts
    .map(
      (d) => `<tr><td style="padding:4px 0;color:#6d2b3a;font-size:13px">− ${d.label[lang]}</td>
        <td style="padding:4px 0;text-align:right;color:#6d2b3a;font-size:13px">−${money(d.amount)}</td></tr>`
    )
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#fbf8f1;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fbf8f1;padding:24px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e8d9ab;border-radius:18px;overflow:hidden">
        <tr><td style="background:#1a1a2e;padding:30px;text-align:center">
          <div style="font-size:30px">${evt?.icon ?? "🎉"}</div>
          <div style="color:#fbf8f1;font-size:22px;margin-top:6px">${tr("title", lang)}</div>
          <div style="color:#e3cf9c;font-size:13px;letter-spacing:2px;margin-top:6px">${tr("ref", lang)}: ${record.ref}</div>
        </td></tr>
        <tr><td style="padding:28px">
          <p style="color:#1a1a2e;font-size:15px;margin:0 0 4px">${tr("hi", lang)} ${record.contact?.name ?? ""},</p>
          <p style="color:#4a4a5e;font-size:14px;margin:0 0 18px">${tr("thanks", lang)}</p>
          <p style="color:#8a8a9a;font-size:13px;margin:0 0 16px">
            ${evt ? evt.name[lang] : ""} ${record.state.context?.city ? "· 📍 " + record.state.context.city : ""} ${record.state.context?.date ? "· " + record.state.context.date : ""}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px">
            <tr><td style="color:#8a8a9a;font-size:13px">${tr("subtotal", lang)}</td><td style="text-align:right;color:#8a8a9a;font-size:13px">${money(q.subtotal)}</td></tr>
            ${discounts}
            <tr><td style="padding-top:10px;color:#1a1a2e;font-size:18px;font-weight:bold">${tr("total", lang)}</td>
                <td style="padding-top:10px;text-align:right;color:#a9842f;font-size:22px;font-weight:bold">${money(q.total)}</td></tr>
            <tr><td></td><td style="text-align:right;color:#8a8a9a;font-size:11px">≈ ${Math.round(q.total * 4.97).toLocaleString("ro-RO")} RON</td></tr>
          </table>
          <div style="text-align:center;margin-top:24px">
            <a href="${link}" style="display:inline-block;background:#c8a24b;color:#fff;text-decoration:none;padding:12px 26px;border-radius:999px;font-size:14px;font-weight:bold">${tr("view", lang)}</a>
          </div>
        </td></tr>
        <tr><td style="background:#f3ecdd;padding:16px;text-align:center;color:#8a8a9a;font-size:12px">${tr("footer", lang)}</td></tr>
      </table>
    </td></tr>
  </table></body></html>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `${tr("subject", lang)} · ${record.ref}`,
      html,
    });
    if (error) return { sent: false, error: String(error.message ?? error) };
    return { sent: true };
  } catch (err) {
    return { sent: false, error: String(err) };
  }
}
