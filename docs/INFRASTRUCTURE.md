# Infrastructure overview

This repo is a monorepo for multiple, independently-launchable apps
(mobile via Expo/React Native, web) that share identity, a common data/email
pattern, and reusable code — without sharing a single database.

```
apps/            one folder per app (mobile and/or web)
packages/
  auth/          Clerk <-> Supabase glue, shared by every app
  data-client/   per-app Supabase client factory
  email/         Resend send + inbound-webhook verification
infra/
  supabase-template/  starting point for a new app's Supabase project
```

## Architecture

- **Identity: Clerk.** One Clerk application covers every app (web +
  Expo/React Native both have first-class Clerk SDKs). Users sign in once
  per app but are the same underlying account across apps if you choose to
  reuse the Clerk instance for all of them.
- **Data: Supabase, one project per app.** Each app owns its own Postgres
  database, Storage, Realtime, and Edge Functions — fully isolated from the
  others. Supabase verifies the Clerk JWT directly (Authentication ->
  Sign In / Providers -> Clerk), so there's no separate auth server to run:
  Postgres Row Level Security policies key off `auth.jwt()->>'sub'`
  (the Clerk user id).
- **Email: Resend**, shared across apps (one Resend account, one or more
  verified sending domains). Outbound send happens from a Supabase Edge
  Function (`infra/supabase-template/functions/send-email`); inbound email
  is delivered to Resend's webhook and forwarded to a per-app Edge Function
  (`infra/supabase-template/functions/inbound-email`) that verifies the
  Svix signature and stores it.
- **Remote access** is Supabase's built-in REST/Realtime API plus your
  Edge Functions — both reachable over HTTPS from mobile and web with no
  extra server to host.

## One-time account setup

1. **Clerk** — create an application at clerk.com. Enable the frontends you
   need (Expo, React/Next). Under JWT Templates, create a template named
   `supabase` (matches `CLERK_SUPABASE_JWT_TEMPLATE` in `packages/auth`)
   using Supabase's recommended claims. Grab the publishable key (client)
   and secret key (server-side only, if you need it).
2. **Resend** — create an account at resend.com, verify a sending domain
   (DNS records), and create an API key. For inbound email, add an inbound
   route for the subdomain/address you want to receive on and note the
   webhook signing secret.

## Per-app setup (repeat for each app in `apps/`)

1. Create a new Supabase project for the app.
2. Follow `infra/supabase-template/README.md` to copy in the migrations
   and Edge Functions, wire up Clerk as the third-party auth provider, and
   deploy.
3. In the app, install `@clerk/clerk-expo` (mobile) or `@clerk/clerk-react`
   (web) plus `@supabase/supabase-js`, and use
   `packages/auth` + `packages/data-client` to build an authenticated
   Supabase client from Clerk's `getToken`.
4. Add the app's env vars (see `.env.example`) to its own `.env` /
   `app.config` — never commit real keys.

## Adding a brand new app

1. `mkdir apps/<name>` and scaffold it (`npx create-expo-app` for mobile,
   whatever you prefer for web).
2. Add it to the root `package.json` workspaces (already covers `apps/*`).
3. Follow "Per-app setup" above.
