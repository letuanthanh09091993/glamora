"use client";

import type { UserAccount } from "@/lib/auth-types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  checkPhoneAvailable,
  updateAuthenticatedProfile,
} from "@/lib/supabase/users-repository";

export async function updateCurrentUser(
  partial: Partial<UserAccount>,
): Promise<{ ok: boolean; messageKey: string }> {
  const sb = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await sb.auth.getSession();

  if (!session?.user) {
    return { ok: false, messageKey: "authMessages.noAuthenticatedUser" };
  }

  if (partial.phoneNumber !== undefined) {
    const ok = await checkPhoneAvailable(sb, partial.phoneNumber, session.user.id);
    if (!ok) return { ok: false, messageKey: "authMessages.phoneExists" };
  }

  if (partial.email !== undefined) {
    const raw = partial.email.trim();
    if (raw) {
      const norm = raw.toLowerCase();
      const { data: conflict } = await sb
        .from("users")
        .select("id")
        .ilike("contact_email", norm)
        .neq("id", session.user.id)
        .maybeSingle();
      if (conflict) return { ok: false, messageKey: "authMessages.emailExists" };
    }
  }

  return updateAuthenticatedProfile(sb, session.user.id, partial);
}
