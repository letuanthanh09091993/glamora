import type { Session, SupabaseClient } from "@supabase/supabase-js";

/** Wait until Supabase has persisted a session to browser cookies (post-login race guard). */
export async function waitForBrowserSession(
  supabase: SupabaseClient,
  options?: { timeoutMs?: number; intervalMs?: number },
): Promise<Session | null> {
  const timeoutMs = options?.timeoutMs ?? 8000;
  const intervalMs = options?.intervalMs ?? 100;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    await supabase.auth.initialize();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (!error && session?.user) {
      return session;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return null;
}
