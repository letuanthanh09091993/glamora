import { NextResponse, type NextRequest } from "next/server";
import { fetchDbAuthRow } from "@/lib/auth/fetch-db-auth-row";
import { isActiveAdminUser, dashboardPathForRole } from "@/lib/auth/app-user";
import {
  allowsSessionWithoutVerifiedEmail,
  allowsUnverifiedEmailForDashboard,
  AuthRoutes,
  isAdminDashboardPath,
  isDashboardOrAccountPath,
} from "@/lib/auth/rbac";
import { AppRoutes } from "@/lib/app-routes";
import {
  createMiddlewareSupabase,
  redirectWithSupabaseCookies,
} from "@/lib/supabase/middleware-client";

function logAdminAuth(details: Record<string, unknown>) {
  console.log("[glamora-admin-auth]", details);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isDashboard = isDashboardOrAccountPath(pathname);
  const isAdminPath = isAdminDashboardPath(pathname);

  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    logAdminAuth({ step: "skip_no_env", pathname, sessionExists: false });
    return supabaseResponse;
  }

  const { supabase, getResponse } = createMiddlewareSupabase(request, supabaseResponse);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  supabaseResponse = getResponse();

  const sessionExists = Boolean(user);
  const authUserId = user?.id ?? null;
  const userEmail = user?.email ?? null;

  if (isAdminPath) {
    console.log("[ADMIN DEBUG USER]", user);
  }

  logAdminAuth({
    step: "session",
    pathname,
    isAdminPath,
    sessionExists,
    authUserId,
    userEmail,
    authError: authError?.message ?? null,
    emailConfirmed: Boolean(user?.email_confirmed_at),
  });

  if (!user && isDashboard) {
    const reason = "not_logged_in";
    if (isAdminPath) {
      console.log("[ADMIN REDIRECT]", { reason });
    }
    logAdminAuth({ step: "redirect", pathname, reason, redirectTo: AuthRoutes.login });
    const login = new URL(AuthRoutes.login, request.url);
    login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return redirectWithSupabaseCookies(request, supabaseResponse, login);
  }

  if (!user) {
    logAdminAuth({ step: "pass_through_anon", pathname });
    return supabaseResponse;
  }

  const dbFetch = await fetchDbAuthRow(supabase, user.id);
  const dbUser = dbFetch.row;
  const role = dbUser?.role;
  const accountStatus = dbUser?.account_status ?? "active";

  if (isAdminPath) {
    console.log("[ADMIN DB USER]", dbUser);
  }

  logAdminAuth({
    step: "public_users",
    pathname,
    authUserId: user.id,
    sessionExists: true,
    userEmail,
    dbSource: dbFetch.source,
    dbError: dbFetch.error,
    fetchedDbRole: role ?? null,
    fetchedAccountStatus: accountStatus,
    authUserMatchesDbRow: dbUser?.id === user.id,
  });

  const activeAdmin =
    dbUser !== null &&
    dbUser.id === user.id &&
    isActiveAdminUser({ role: dbUser.role, accountStatus: dbUser.account_status });

  if (accountStatus === "suspended") {
    const suspendedOk =
      pathname.startsWith(AuthRoutes.accountSuspended) || pathname.startsWith("/auth/");
    if (!suspendedOk) {
      const reason = "inactive_account";
      logAdminAuth({ step: "redirect", pathname, reason, account_status: accountStatus });
      return redirectWithSupabaseCookies(
        request,
        supabaseResponse,
        new URL(AuthRoutes.accountSuspended, request.url),
      );
    }
  }

  if (isDashboard) {
    const emailRelaxed =
      allowsSessionWithoutVerifiedEmail(pathname) ||
      allowsUnverifiedEmailForDashboard(pathname, activeAdmin);

    if (!user.email_confirmed_at && !emailRelaxed) {
      const reason = "email_not_verified";
      logAdminAuth({ step: "redirect", pathname, reason, redirectTo: AuthRoutes.verifyEmail });
      return redirectWithSupabaseCookies(
        request,
        supabaseResponse,
        new URL(AuthRoutes.verifyEmail, request.url),
      );
    }

    if (isAdminPath) {
      if (!dbUser) {
        logAdminAuth({
          step: "admin_defer_client",
          pathname,
          reason: "users_row_missing",
          dbError: dbFetch.error,
        });
        return supabaseResponse;
      }

      if (!activeAdmin) {
        if (role !== "admin") {
          console.log("[ADMIN REDIRECT]", { reason: "not_admin", role });
        } else {
          console.log("[ADMIN REDIRECT]", { reason: "inactive_account", account_status: accountStatus });
        }
        const dest = role ? dashboardPathForRole(role) : AppRoutes.dashboardCustomer;
        logAdminAuth({
          step: "redirect",
          pathname,
          reason: role !== "admin" ? "not_admin" : "inactive_account",
          fetchedDbRole: role,
          fetchedAccountStatus: accountStatus,
          redirectTo: dest,
        });
        return redirectWithSupabaseCookies(request, supabaseResponse, new URL(dest, request.url));
      }

      console.log("[ADMIN ACCESS GRANTED]", {
        authUserId: user.id,
        email: user.email,
        role,
        account_status: accountStatus,
      });

      logAdminAuth({
        step: "admin_granted",
        pathname,
        authUserId: user.id,
        userEmail,
        role,
        account_status: accountStatus,
      });
    }
  }

  logAdminAuth({ step: "pass_through", pathname, sessionExists: true, authUserId: user.id });
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
