"use client";

import type { Session } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/browser-client";

export type EstablishRecoverySessionResult =
  | { ok: true; session: Session }
  | { ok: false; reason: "no_tokens" | "invalid_link" | "network" };

function parseAuthParamsFromUrl(href: string): Record<string, string> {
  const result: Record<string, string> = {};
  const url = new URL(href);

  if (url.hash.startsWith("#")) {
    try {
      new URLSearchParams(url.hash.slice(1)).forEach((value, key) => {
        result[key] = value;
      });
    } catch {
      /* ignore malformed hash */
    }
  }

  url.searchParams.forEach((value, key) => {
    result[key] = value;
  });

  return result;
}

function clearAuthParamsFromUrl(): void {
  const url = new URL(window.location.href);
  url.hash = "";
  url.searchParams.delete("code");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  url.searchParams.delete("error_code");
  window.history.replaceState(window.history.state, "", url.pathname + url.search);
}

/**
 * Establishes a Supabase session from a password-recovery redirect.
 * Supabase emails use URL hash tokens (`access_token`, `refresh_token`); with PKCE
 * client config those are not applied automatically, so we call `setSession` explicitly.
 */
export async function establishRecoverySessionFromUrl(): Promise<EstablishRecoverySessionResult> {
  if (typeof window === "undefined") {
    return { ok: false, reason: "no_tokens" };
  }

  const sb = getBrowserSupabase();
  await sb.auth.initialize();

  const params = parseAuthParamsFromUrl(window.location.href);

  if (params.error || params.error_description) {
    clearAuthParamsFromUrl();
    return { ok: false, reason: "invalid_link" };
  }

  const { access_token, refresh_token, code } = params;

  if (code) {
    const { data, error } = await sb.auth.exchangeCodeForSession(code);
    clearAuthParamsFromUrl();
    if (error || !data.session) {
      return { ok: false, reason: error ? "invalid_link" : "no_tokens" };
    }
    return { ok: true, session: data.session };
  }

  if (access_token && refresh_token) {
    const { data, error } = await sb.auth.setSession({ access_token, refresh_token });
    clearAuthParamsFromUrl();
    if (error || !data.session) {
      return { ok: false, reason: error ? "invalid_link" : "no_tokens" };
    }
    return { ok: true, session: data.session };
  }

  const {
    data: { session },
    error,
  } = await sb.auth.getSession();

  if (error) {
    return { ok: false, reason: "network" };
  }

  if (session?.user) {
    return { ok: true, session };
  }

  return { ok: false, reason: "no_tokens" };
}
