import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAccessTokenGetter, type TokenGetter } from "@claude-apps/auth";

export interface AppBackendConfig {
  /** Each app has its own Supabase project — its URL and anon key. */
  supabaseUrl: string;
  supabaseAnonKey: string;
  /** Clerk's getToken from useAuth(), so requests carry the signed-in user's identity. */
  getToken: TokenGetter;
}

/**
 * One Supabase client per app, authenticated as the current Clerk user.
 * Call this once per app (e.g. in a top-level provider) and reuse the client.
 */
export function createAppBackendClient(config: AppBackendConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    accessToken: createSupabaseAccessTokenGetter(config.getToken),
  });
}
