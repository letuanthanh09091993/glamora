import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Copy refreshed Supabase auth cookies onto any Next.js response (required on Vercel redirects). */
export function applySupabaseCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value, cookie);
  });
  return to;
}

export function redirectWithSupabaseCookies(
  request: NextRequest,
  supabaseResponse: NextResponse,
  target: URL | string,
): NextResponse {
  const url = typeof target === "string" ? new URL(target, request.url) : target;
  return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
}

export function createMiddlewareSupabase(
  request: NextRequest,
  supabaseResponse: NextResponse,
): {
  supabase: ReturnType<typeof createServerClient>;
  getResponse: () => NextResponse;
} {
  let response = supabaseResponse;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return {
    supabase,
    getResponse: () => response,
  };
}
