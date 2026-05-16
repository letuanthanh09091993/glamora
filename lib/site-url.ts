import { AppRoutes } from "@/lib/app-routes";

/** Canonical production origin (password reset emails, auth redirects). */
export const PRODUCTION_SITE_ORIGIN = "https://glamora.io.vn";

/** Local development origin when `NEXT_PUBLIC_SITE_URL` is unset. */
export const DEVELOPMENT_SITE_ORIGIN = "http://localhost:3000";

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

/**
 * Site origin for auth email redirects.
 * Priority: `NEXT_PUBLIC_SITE_URL` → production default → localhost dev default.
 */
export function getSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv?.trim()) {
    return normalizeOrigin(fromEnv);
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_SITE_ORIGIN;
  }

  return DEVELOPMENT_SITE_ORIGIN;
}

/** Absolute URL Supabase must redirect to after password recovery (allowlisted in Supabase dashboard). */
export function getPasswordResetRedirectUrl(): string {
  return `${getSiteOrigin()}${AppRoutes.resetPassword}`;
}
