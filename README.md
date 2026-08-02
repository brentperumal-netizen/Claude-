# Apps monorepo

Multiple independently-launchable mobile and web apps sharing a common
identity, data, and email setup. See [`docs/INFRASTRUCTURE.md`](docs/INFRASTRUCTURE.md)
for the full architecture and account setup steps.

- `apps/` — one folder per app (`runway-ready-mobile`, `dressup-game`, ...)
- `packages/` — shared code: Clerk auth glue, Supabase client factory, Resend email helpers
- `infra/` — templates for provisioning a new app's backend
