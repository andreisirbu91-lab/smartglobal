import { notFound } from "next/navigation";
import Link from "next/link";
import { getBooking } from "@/lib/bookings";
import { EVENT_TYPES } from "@/lib/catalog";
import { money, ron, tr } from "@/lib/format";
import type { Lang } from "@/lib/types";
import { BookingActions } from "@/components/BookingActions";
import { Invoice } from "@/components/Invoice";
import { Confetti } from "@/components/Confetti";

const L = {
  confirmed: { en: "Booking confirmed", ro: "Rezervare confirmată" },
  ref: { en: "Reference", ro: "Referință" },
  thanks: {
    en: "Thank you — your package is reserved. A copy of this summary is yours to share.",
    ro: "Mulțumim — pachetul tău este rezervat. Acest sumar îți aparține și îl poți distribui.",
  },
  summary: { en: "Order summary", ro: "Sumar comandă" },
  subtotal: { en: "Subtotal", ro: "Subtotal" },
  total: { en: "Total", ro: "Total" },
  graduates: { en: "Graduates", ro: "Absolvenți" },
  guests: { en: "Guests", ro: "Invitați" },
  for: { en: "For", ro: "Pentru" },
  back: { en: "Start a new package", ro: "Începe un pachet nou" },
  payDeposit: { en: "Pay deposit", ro: "Plătește avansul" },
  depositNote: { en: "Secure your date with a 20% deposit.", ro: "Rezervă-ți data cu un avans de 20%." },
  depositPaid: { en: "Deposit paid — your date is secured.", ro: "Avans plătit — data ta este rezervată." },
  draftTitle: { en: "Shared package", ro: "Pachet trimis" },
  draftThanks: { en: "Someone shared this event package with you. Take a look!", ro: "Cineva ți-a trimis acest pachet de eveniment. Aruncă un ochi!" },
  bookThis: { en: "Build your own package", ro: "Construiește-ți pachetul" },
  waMsg: { en: "Check out our event package", ro: "Uite pachetul nostru de eveniment" },
};

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) notFound();

  const lang = (booking.language as Lang) ?? "en";
  const q = booking.quote;
  const evt = EVENT_TYPES.find((e) => e.id === booking.event_type);
  const isDraft = booking.status === "draft";
  const waMessage = `${tr(L.waMsg, lang)}${evt ? ` (${tr(evt.name, lang)})` : ""} · ${money(q.total)}`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {!isDraft && <Confetti />}
      <div className="card-soft animate-rise overflow-hidden">
        {/* Header band */}
        <div className="bg-ink px-7 py-8 text-center text-ivory">
          <div className="text-3xl">{evt?.icon ?? "🎉"}</div>
          <h1 className="text-display mt-2 text-2xl">{tr(isDraft ? L.draftTitle : L.confirmed, lang)}</h1>
          <p className="mt-1 text-sm text-ivory/70">
            {tr(L.ref, lang)}: <span className="font-mono tracking-widest text-gold-soft">{booking.ref}</span>
          </p>
        </div>

        <div className="space-y-5 p-7">
          <p className="text-center text-sm text-ink-soft">{tr(isDraft ? L.draftThanks : L.thanks, lang)}</p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[13px]">
            {evt && (
              <span className="rounded-full border border-gold/30 bg-gold/8 px-3 py-1 text-gold-deep">
                {tr(evt.name, lang)}
              </span>
            )}
            <span className="rounded-full border border-ink/10 px-3 py-1 text-ink-soft">
              {tr(L.graduates, lang)}: {booking.state.graduates}
            </span>
            <span className="rounded-full border border-ink/10 px-3 py-1 text-ink-soft">
              {tr(L.guests, lang)}: {booking.state.guests}
            </span>
          </div>

          {booking.contact?.name && (
            <p className="text-center text-sm text-ink">
              {tr(L.for, lang)} <strong>{booking.contact.name}</strong>
              {booking.contact.email ? ` · ${booking.contact.email}` : ""}
            </p>
          )}

          <div className="gold-hairline" />

          <div>
            <h2 className="text-display mb-3 text-lg text-ink">{tr(L.summary, lang)}</h2>
            <ul className="space-y-2">
              {q.lines.map((l) => (
                <li key={l.itemId} className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-ink">
                    {tr(l.name, lang)}
                    <span className="ml-1 text-ink-soft">
                      ({money(l.unitPrice)} × {l.quantity})
                    </span>
                  </span>
                  <span className="text-display text-ink">{money(l.total)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-1.5 text-sm">
              <Row label={tr(L.subtotal, lang)} value={money(q.subtotal)} muted />
              {q.discounts.map((d) => (
                <Row key={d.code} label={`− ${tr(d.label, lang)}`} value={`−${money(d.amount)}`} tone />
              ))}
              <div className="gold-hairline my-2" />
              <div className="flex items-center justify-between">
                <span className="text-display text-lg text-ink">{tr(L.total, lang)}</span>
                <span className="text-display text-2xl text-gold-deep">{money(q.total)}</span>
              </div>
              <div className="text-right text-[11px] text-ink-soft">{ron(q.total)}</div>
            </div>
          </div>

          {!isDraft && (
            <>
              {/* Deposit (demo Stripe) */}
              <div className="no-print rounded-2xl border border-gold/25 bg-gold/5 p-4 text-center">
                {booking.paid ? (
                  <p className="text-sm font-medium text-green-700">✓ {tr(L.depositPaid, lang)}</p>
                ) : (
                  <>
                    <p className="mb-2 text-[13px] text-ink-soft">{tr(L.depositNote, lang)}</p>
                    <Link href={`/pay/${booking.id}`} className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
                      💳 {tr(L.payDeposit, lang)} · {money(Math.round(booking.total * 0.2))}
                    </Link>
                  </>
                )}
              </div>

              <Invoice booking={booking} lang={lang} />
            </>
          )}

          {isDraft && (
            <div className="no-print text-center">
              <Link href="/" className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
                ✦ {tr(L.bookThis, lang)}
              </Link>
            </div>
          )}

          <BookingActions lang={lang} waMessage={waMessage} />

          <div className="no-print text-center">
            <Link href="/" className="text-sm text-gold-deep underline-offset-4 hover:underline">
              {tr(L.back, lang)}
            </Link>
          </div>
        </div>
      </div>
    </main>
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
