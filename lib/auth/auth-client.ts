"use client";

import type { SignupPayload } from "@/lib/auth-types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { signUpWithMetadata } from "@/lib/supabase/users-repository";

export type SignOutOptions = {
  /**
   * Hard-navigate after the session is cleared.
   * Pass `false` to remain on the current page (caller handles navigation).
   * @default "/"
   */
  redirectTo?: string | false;
};

export async function signInWithPassword(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
}

/**
 * Clears the Supabase auth session (cookies + local storage via SSR browser client).
 * Does not navigate — use AuthProvider `signOut()` for the full logout flow.
 */
export async function signOut(): Promise<void> {
  if (typeof window === "undefined") return;

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.warn("[auth] signOut:", error.message);
    await supabase.auth.signOut({ scope: "local" });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    await supabase.auth.signOut({ scope: "local" });
  }
}

export async function signUpAccount(payload: SignupPayload) {
  return signUpWithMetadata(getSupabaseBrowserClient(), payload);
}
