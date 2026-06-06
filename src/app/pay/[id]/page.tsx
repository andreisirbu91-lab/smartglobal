import { notFound } from "next/navigation";
import Link from "next/link";
import { getBooking } from "@/lib/bookings";
import { PayForm } from "@/components/PayForm";
import type { Lang } from "@/lib/types";

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await getBooking(id);
  if (!b) notFound();
  const lang = (b.language as Lang) ?? "en";
  const deposit = Math.round(b.total * 0.2);

  return (
    <main className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <div className="mb-4 text-center">
        <span className="text-display text-lg text-ink"><span className="text-gold-deep">✦</span> Start Global</span>
      </div>
      <PayForm id={id} deposit={deposit} total={b.total} ref_={b.ref} lang={lang} />
      <div className="mt-4 text-center">
        <Link href={`/booking/${id}`} className="text-[13px] text-ink-soft underline-offset-4 hover:underline">
          ← {lang === "ro" ? "Înapoi la rezervare" : "Back to booking"}
        </Link>
      </div>
    </main>
  );
}
