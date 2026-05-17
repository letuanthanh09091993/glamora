import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

const AUTH_COOKIE_PREFIXES = ["sb-", "supabase-auth-token"];

export function hasSupabaseAuthCookie(cookieNames: string[]): boolean {
  return cookieNames.some((name) =>
    AUTH_COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix) || name.includes("auth-token")),
  );
}

/** Temporary: log cookie names + whether Supabase auth cookies are present (never log values). */
export function logServerCookieCheck(
  cookieStore: ReadonlyRequestCookies,
  context: string,
): { cookieNames: string[]; authTokenCookiePresent: boolean } {
  const cookieNames = cookieStore.getAll().map((c) => c.name);
  const authTokenCookiePresent = hasSupabaseAuthCookie(cookieNames);

  console.log("[SERVER COOKIE CHECK]", {
    context,
    cookieNames,
    authTokenCookiePresent,
    cookieCount: cookieNames.length,
  });

  return { cookieNames, authTokenCookiePresent };
}
