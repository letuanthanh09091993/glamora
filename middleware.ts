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

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
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

  const pathname = request.nextUrl.pathname;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isDashboardOrAccountPath(pathname)) {
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

    if (accountStatus === "suspended") {
      const suspendedOk =
        pathname.startsWith(AuthRoutes.accountSuspended) || pathname.startsWith("/auth/");
      if (!suspendedOk) {
        return NextResponse.redirect(new URL(AuthRoutes.accountSuspended, request.url));
      }
    }

    if (isDashboardOrAccountPath(pathname)) {
      const emailRelaxed =
        allowsSessionWithoutVerifiedEmail(pathname) ||
        allowsUnverifiedEmailForDashboard(pathname, activeAdmin);

      if (!user.email_confirmed_at && !emailRelaxed) {
        return NextResponse.redirect(new URL(AuthRoutes.verifyEmail, request.url));
      }

      if (isAdminDashboardPath(pathname)) {
        if (urowError || !urow) {
          return supabaseResponse;
        }

        if (!activeAdmin) {
          const dest = role ? dashboardPathForRole(role) : AppRoutes.dashboardCustomer;
          return NextResponse.redirect(new URL(dest, request.url));
        }
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
