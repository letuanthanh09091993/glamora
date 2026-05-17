import { redirect } from "next/navigation";
import { AppRoutes } from "@/lib/app-routes";
import type { UserRole } from "@/lib/auth-types";
import { ROLE_META } from "@/lib/role-meta";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";

export const dynamic = "force-dynamic";

function dashboardPathForDbRole(role: UserRole): string {
  return ROLE_META[role]?.dashboardPath ?? AppRoutes.dashboardCustomer;
}

export default async function DashboardEntryPage() {
  const supabase = await createRouteSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  console.log("[SERVER DASHBOARD USER]", {
    userId: user?.id ?? null,
    email: user?.email ?? null,
    authError: authError?.message ?? null,
  });

  if (authError || !user) {
    console.log("[FINAL DASHBOARD REDIRECT]", {
      redirectTo: AppRoutes.login,
      reason: "no_authenticated_user",
    });
    redirect(AppRoutes.login);
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role, account_status")
    .eq("id", user.id)
    .single();

  console.log("[DB ROLE RESULT]", {
    role: profile?.role ?? null,
    account_status: profile?.account_status ?? null,
    queryError: profileError?.message ?? null,
  });

  const accountStatus = profile?.account_status ?? "active";
  if (accountStatus !== "active") {
    console.log("[FINAL DASHBOARD REDIRECT]", {
      redirectTo: AppRoutes.login,
      reason: "inactive_account",
    });
    redirect(AppRoutes.login);
  }

  const role = profile?.role as UserRole | undefined;
  const redirectTo = role ? dashboardPathForDbRole(role) : AppRoutes.dashboardCustomer;

  console.log("[FINAL DASHBOARD REDIRECT]", { redirectTo, role: role ?? null });

  redirect(redirectTo);
}
