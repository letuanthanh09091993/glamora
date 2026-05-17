import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AppRoutes } from "@/lib/app-routes";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";

type AdminAccessContext = {
  supabase: SupabaseClient;
  authUserId: string;
};

/**
 * Server-only gate for `/dashboard/admin/*`.
 * Uses SSR Supabase session + `public.users` role (no client redirects).
 */
export async function requireAdminAccess(): Promise<AdminAccessContext> {
  const supabase = await createRouteSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(AppRoutes.dashboard);
  }

  const { data: row, error: profileError } = await supabase
    .from("users")
    .select("role, account_status")
    .eq("id", user.id)
    .single();

  if (profileError || row?.role !== "admin" || row?.account_status !== "active") {
    redirect(AppRoutes.dashboard);
  }

  return { supabase, authUserId: user.id };
}

/** @deprecated Alias — prefer `requireAdminAccess`. */
export async function requireAdminPageAccess(): Promise<AdminAccessContext> {
  return requireAdminAccess();
}
