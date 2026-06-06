-- Bookings table for the Event Concierge.
-- Run in the Supabase SQL editor (or via the CLI) before enabling persistence.

create table if not exists public.bookings (
  id          uuid primary key default gen_random_uuid(),
  ref         text unique not null,
  event_type  text,
  contact     jsonb,
  state       jsonb not null,
  quote       jsonb not null,
  total       numeric not null default 0,
  language    text not null default 'en',
  status      text not null default 'confirmed',
  created_at  timestamptz not null default now()
);

-- The server writes/reads with the service-role key (bypasses RLS).
-- Enable RLS and allow public read-by-id if you later read from the browser.
alter table public.bookings enable row level security;

create policy "public can read bookings by id"
  on public.bookings for select
  using (true);
