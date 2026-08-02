# Supabase project template

A starting point for the per-app Supabase backend described in
`docs/INFRASTRUCTURE.md`. Every app gets its own Supabase project (its own
database and Edge Functions), but all of them trust the same Clerk-issued
JWT for auth instead of using Supabase's own user table.

## Using this for a new app

1. `cd apps/<your-app>`
2. `supabase init`
3. Copy `migrations/` and `functions/` from this template into the new
   `supabase/` directory, and copy `config.toml`'s function settings in.
4. In the Supabase dashboard: Authentication -> Sign In / Providers ->
   add Clerk as a third-party auth provider (needs your Clerk domain).
5. `supabase link --project-ref <ref>` then `supabase db push`.
6. `supabase secrets set RESEND_API_KEY=... EMAIL_FROM="App <noreply@yourdomain.com>" RESEND_INBOUND_WEBHOOK_SECRET=...`
7. `supabase functions deploy send-email`
8. `supabase functions deploy inbound-email --no-verify-jwt`
9. In Resend, point the inbound webhook at the deployed `inbound-email` URL.
