import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/auth-types";
import { fetchDbAuthRow } from "@/lib/auth/fetch-db-auth-row";
import { postLoginPathForRole } from "@/lib/auth/post-login-path";

export type LoginRedirectResult = {
  role: UserRole | null;
  redirectTo: string;
};

/**
 * Post-login destination from `public.users.role` (not client profile cache).
 */
export async function resolveLoginRedirect(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<LoginRedirectResult> {
  const maxAttempts = 4;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { row } = await fetchDbAuthRow(supabase, authUserId);

    if (row?.role) {
      const redirectTo = postLoginPathForRole(row.role);
      console.log("[LOGIN REDIRECT]", { role: row.role, redirectTo });
      return { role: row.role, redirectTo };
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  const redirectTo = postLoginPathForRole(null);
  console.log("[LOGIN REDIRECT]", { role: null, redirectTo });
  return { role: null, redirectTo };
}
