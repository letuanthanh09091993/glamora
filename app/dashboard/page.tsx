import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AppRoutes } from "@/lib/app-routes";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";
import { logServerCookieCheck } from "@/lib/supabase/server-cookie-debug";

/**
 * Server entry: reads `public.users.role` and routes to the correct dashboard.
 */
export default async function DashboardEntryPage() {
  const cookieStore = await cookies();
  logServerCookieCheck(cookieStore, "dashboard/page");

  const supabase = await createRouteSupabase("dashboard/page");

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  console.log("[DASHBOARD SERVER USER]", {
    userId: user?.id ?? null,
    email: user?.email ?? null,
    authError: authError?.message ?? null,
  });

  if (authError || !user) {
    console.log("[FINAL REDIRECT]", { redirectTo: AppRoutes.login, reason: "no_server_user" });
    redirect(AppRoutes.login);
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  console.log("[DB ROLE RESULT]", {
    role: profile?.role ?? null,
    queryError: profileError?.message ?? null,
  });

  const redirectTo =
    profile?.role === "admin" ? AppRoutes.dashboardAdmin : AppRoutes.dashboardCustomer;

  console.log("[FINAL REDIRECT]", { redirectTo, role: profile?.role ?? null });

  redirect(redirectTo);
}
