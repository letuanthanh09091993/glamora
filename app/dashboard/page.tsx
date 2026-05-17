import { redirect } from "next/navigation";
import { AppRoutes } from "@/lib/app-routes";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";

/**
 * Server entry: reads `public.users.role` and routes to the correct dashboard.
 * Login always sends users here first — no client-side role redirects.
 */
export default async function DashboardEntryPage() {
  const supabase = await createRouteSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(AppRoutes.login);
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  console.log("[DASHBOARD ROLE CHECK]", {
    userId: user.id,
    role: profile?.role ?? null,
    profileError: profileError?.message ?? null,
  });

  const redirectTo =
    profile?.role === "admin" ? AppRoutes.dashboardAdmin : AppRoutes.dashboardCustomer;

  console.log("[DASHBOARD REDIRECT]", { redirectTo });

  redirect(redirectTo);
}
