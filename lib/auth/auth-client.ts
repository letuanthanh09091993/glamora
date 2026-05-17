"use client";

import type { SignupPayload } from "@/lib/auth-types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { signUpWithMetadata } from "@/lib/supabase/users-repository";

export async function signInWithPassword(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
}

export async function signUpAccount(payload: SignupPayload) {
  return signUpWithMetadata(getSupabaseBrowserClient(), payload);
}
