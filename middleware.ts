import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { dashboardPathForRole } from "@/lib/auth/app-user";
import { AuthRoutes, isAdminDashboardPath } from "@/lib/auth/rbac";
import { AppRoutes } from "@/lib/app-routes";
import type { UserRole } from "@/lib/auth-types";
import {
  createMiddlewareSupabase,
  redirectWithSupabaseCookies,
} from "@/lib/supabase/middleware-client";

type PublicUserRow = {
  role: string;
  account_status: string | null;
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminPath = isAdminDashboardPath(pathname);
  const isDashboardPath = pathname.startsWith("/dashboard");

  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.log("[ADMIN DEBUG]", {
      pathname,
      hasSession: false,
      userEmail: null,
      authUserId: null,
      error: "missing_supabase_env",
    });
    return supabaseResponse;
  }

  const { supabase, getResponse } = createMiddlewareSupabase(request, supabaseResponse);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  supabaseResponse = getResponse();

  console.log("[ADMIN DEBUG]", {
    pathname,
    hasSession: !!session,
    userEmail: session?.user?.email,
    authUserId: session?.user?.id,
  });

  if (isDashboardPath && !session?.user) {
    console.log("[ADMIN REDIRECT]", { reason: "not_logged_in", pathname });
    const login = new URL(AuthRoutes.login, request.url);
    login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return redirectWithSupabaseCookies(request, supabaseResponse, login);
  }

  if (!session?.user) {
    return supabaseResponse;
  }

  const { data: userRow, error: userRowError } = await supabase
    .from("users")
    .select("role, account_status")
    .eq("id", session.user.id)
    .maybeSingle<PublicUserRow>();

  console.log("[ADMIN DB ROLE]", {
    role: userRow?.role,
    account_status: userRow?.account_status,
    userRowError: userRowError?.message ?? null,
    authUserId: session.user.id,
  });

  if (isAdminPath) {
    const role = userRow?.role;
    const accountStatus = userRow?.account_status ?? "active";
    const isAdmin = role === "admin" && accountStatus === "active";

    if (!isAdmin) {
      if (role !== "admin") {
        console.log("[ADMIN REDIRECT]", { reason: "not_admin", role, pathname });
      } else {
        console.log("[ADMIN REDIRECT]", {
          reason: "inactive_account",
          account_status: accountStatus,
          pathname,
        });
      }
      const dest = role ? dashboardPathForRole(role as UserRole) : AppRoutes.dashboardCustomer;
      return redirectWithSupabaseCookies(request, supabaseResponse, new URL(dest, request.url));
    }

    console.log("=== ADMIN ACCESS ALLOWED ===");
    console.log("[ADMIN ACCESS GRANTED]", {
      authUserId: session.user.id,
      email: session.user.email,
      role,
      account_status: accountStatus,
    });

    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
