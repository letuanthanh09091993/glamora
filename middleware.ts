import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isActiveAdminUser, dashboardPathForRole } from "@/lib/auth/app-user";
import {
  allowsSessionWithoutVerifiedEmail,
  allowsUnverifiedEmailForDashboard,
  AuthRoutes,
  isAdminDashboardPath,
  isDashboardOrAccountPath,
} from "@/lib/auth/rbac";
import { AppRoutes } from "@/lib/app-routes";
import type { UserRole } from "@/lib/auth-types";

type UsersAuthRow = {
  role: string;
  account_status: string | null;
};

const LOG_PREFIX = "[glamora-middleware-auth]";

function logAuthCheck(step: string, details: Record<string, unknown>) {
  console.log(LOG_PREFIX, step, details);
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const pathname = request.nextUrl.pathname;

  if (!url || !anonKey) {
    logAuthCheck("skip_no_supabase_env", { pathname });
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDashboard = isDashboardOrAccountPath(pathname);
  const isAdminPath = isAdminDashboardPath(pathname);

  logAuthCheck("session", {
    pathname,
    isDashboard,
    isAdminPath,
    hasUser: Boolean(user),
    authUserId: user?.id ?? null,
    emailConfirmed: Boolean(user?.email_confirmed_at),
  });

  if (!user && isDashboard) {
    logAuthCheck("redirect_login_unauthenticated", { pathname });
    const login = new URL(AuthRoutes.login, request.url);
    login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  if (user) {
    const { data: urow, error: urowError } = await supabase
      .from("users")
      .select("role, account_status")
      .eq("id", user.id)
      .maybeSingle<UsersAuthRow>();

    const accountStatus = urow?.account_status ?? "active";
    const role = urow?.role as UserRole | undefined;
    const activeAdmin =
      !urowError &&
      Boolean(urow) &&
      isActiveAdminUser({
        role: (role ?? "customer") as UserRole,
        accountStatus: (accountStatus as "active" | "suspended") ?? "active",
      });

    logAuthCheck("public_users_row", {
      pathname,
      authUserId: user.id,
      urowError: urowError?.message ?? null,
      dbRole: urow?.role ?? null,
      dbAccountStatus: urow?.account_status ?? null,
      activeAdmin,
    });

    if (accountStatus === "suspended") {
      const suspendedOk =
        pathname.startsWith(AuthRoutes.accountSuspended) || pathname.startsWith("/auth/");
      logAuthCheck("suspended_check", { pathname, accountStatus, suspendedOk });
      if (!suspendedOk) {
        logAuthCheck("redirect_account_suspended", { pathname, authUserId: user.id });
        return NextResponse.redirect(new URL(AuthRoutes.accountSuspended, request.url));
      }
    }

    if (isDashboard) {
      const emailRelaxed =
        allowsSessionWithoutVerifiedEmail(pathname) ||
        allowsUnverifiedEmailForDashboard(pathname, activeAdmin);

      logAuthCheck("email_verification", {
        pathname,
        emailConfirmed: Boolean(user.email_confirmed_at),
        emailRelaxed,
        activeAdmin,
      });

      if (!user.email_confirmed_at && !emailRelaxed) {
        logAuthCheck("redirect_verify_email", { pathname, authUserId: user.id });
        return NextResponse.redirect(new URL(AuthRoutes.verifyEmail, request.url));
      }

      if (isAdminPath) {
        if (urowError || !urow) {
          logAuthCheck("admin_defer_client_gate", {
            pathname,
            reason: urowError ? "users_row_error" : "users_row_missing",
            urowError: urowError?.message ?? null,
          });
          return supabaseResponse;
        }

        if (!activeAdmin) {
          const dest = role ? dashboardPathForRole(role) : AppRoutes.dashboardCustomer;
          logAuthCheck("redirect_admin_denied", {
            pathname,
            authUserId: user.id,
            dbRole: role,
            dbAccountStatus: accountStatus,
            activeAdmin,
            redirectTo: dest,
          });
          return NextResponse.redirect(new URL(dest, request.url));
        }

        logAuthCheck("admin_allowed", {
          pathname,
          authUserId: user.id,
          dbRole: role,
          dbAccountStatus: accountStatus,
        });
      }
    }
  }

  logAuthCheck("pass_through", { pathname, hasUser: Boolean(user) });
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
