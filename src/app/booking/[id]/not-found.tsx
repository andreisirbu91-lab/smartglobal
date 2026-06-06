import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="text-4xl">🔍</div>
      <h1 className="text-display mt-3 text-2xl text-ink">Booking not found</h1>
      <p className="mt-2 text-sm text-ink-soft">
        This booking link is invalid or the server was restarted before Supabase was configured.
      </p>
      <Link href="/" className="mt-5 text-sm text-gold-deep underline-offset-4 hover:underline">
        Start a new package →
      </Link>
    </main>
  );
}
