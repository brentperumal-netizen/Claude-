// Shared identity layer: Clerk is the single sign-on provider for every app
// in this repo. Each app has its own Supabase project for data, but all of
// them verify the same Clerk-issued JWT instead of running separate user
// tables. See docs/INFRASTRUCTURE.md for the account setup steps.

export const CLERK_SUPABASE_JWT_TEMPLATE = "supabase";

export type TokenGetter = (options?: { template?: string }) => Promise<string | null>;

/**
 * Wraps Clerk's getToken() (from useAuth() in @clerk/clerk-react or
 * @clerk/clerk-expo) into the shape Supabase's client expects for its
 * `accessToken` option, so every request is authenticated as the Clerk user.
 */
export function createSupabaseAccessTokenGetter(getToken: TokenGetter) {
  return async () => {
    const token = await getToken({ template: CLERK_SUPABASE_JWT_TEMPLATE });
    return token ?? undefined;
  };
}
