-- Raw store for inbound email events from the inbound-email Edge Function.
-- Written only by the service role (the edge function), never by app clients.

create table if not exists inbound_emails (
  id bigint generated always as identity primary key,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

alter table inbound_emails enable row level security;
-- No policies: only the service role (which bypasses RLS) can read/write this table.
