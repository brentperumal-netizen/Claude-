-- Template migration for a new per-app Supabase project.
-- Assumes Clerk is wired up as a Third-Party Auth provider (Authentication ->
-- Sign In / Providers -> Clerk in the Supabase dashboard), so auth.jwt() is
-- the Clerk-issued JWT and auth.jwt()->>'sub' is the Clerk user id.

create table if not exists profiles (
  clerk_user_id text primary key,
  display_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can read their own profile"
  on profiles for select
  using (clerk_user_id = auth.jwt()->>'sub');

create policy "Users can update their own profile"
  on profiles for update
  using (clerk_user_id = auth.jwt()->>'sub');

create policy "Users can insert their own profile"
  on profiles for insert
  with check (clerk_user_id = auth.jwt()->>'sub');

-- Add app-specific tables below, scoping rows to clerk_user_id and reusing
-- the same auth.jwt()->>'sub' pattern in their RLS policies.
