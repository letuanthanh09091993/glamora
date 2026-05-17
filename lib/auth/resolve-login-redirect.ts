import type { SupabaseClient } from "@supabase/supabase-js";
import { AppRoutes } from "@/lib/app-routes";

export type LoginRedirectResult = {
  redirectTo: string;
  role: string | null | undefined;
};

/** Role-based post-login path from `public.users`. */
export async function resolveLoginRedirect(
  supabase: SupabaseClient,
  userId: string,
): Promise<LoginRedirectResult> {
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  console.log("[LOGIN SUCCESS]", {
    userId,
    role: profile?.role,
  });

  const redirectTo =
    profile?.role === "admin" ? AppRoutes.dashboardAdmin : AppRoutes.dashboardCustomer;

  console.log("[LOGIN REDIRECT]", {
    redirectTo:
      profile?.role === "admin" ? AppRoutes.dashboardAdmin : AppRoutes.dashboardCustomer,
  });

  return { role: profile?.role, redirectTo };
}
