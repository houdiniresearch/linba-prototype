import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: { url: string; key: string; client: SupabaseClient } | undefined;
export function usesSupabase() {
  if (process.env.VERCEL && process.env.LINBA_DATABASE !== "supabase")
    throw new Error("Configure LINBA_DATABASE=supabase before deploying.");
  return process.env.LINBA_DATABASE === "supabase";
}
/** Only server code may use this client. The key must never use NEXT_PUBLIC_. */
export function supabaseServer() {
  if (typeof window !== "undefined")
    throw new Error("Server-only Supabase client.");
  const url = process.env.SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key)
    throw new Error("Supabase server connection is not configured.");
  if (cached?.url !== url || cached.key !== key) {
    cached = {
      url,
      key,
      client: createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: async (input, init) => {
            const safeToRetry =
              !init?.method ||
              ["GET", "HEAD"].includes(init.method.toUpperCase());
            for (let attempt = 0; ; attempt++) {
              try {
                const response = await fetch(input, {
                  ...init,
                  cache: "no-store",
                  signal: init?.signal || AbortSignal.timeout(30_000),
                });
                if (!safeToRetry || attempt >= 2 || response.status < 500)
                  return response;
                await response.body?.cancel();
              } catch (error) {
                if (!safeToRetry || attempt >= 2 || init?.signal?.aborted)
                  throw error;
              }
              await new Promise((resolve) =>
                setTimeout(resolve, 300 * 2 ** attempt),
              );
            }
          },
        },
      }),
    };
  }
  return cached.client;
}
