"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type AuthDebugServerSnapshot = {
  cookieNames: string[];
  authTokenCookiePresent: boolean;
  serverUser: {
    id: string | null;
    email: string | null;
    error: string | null;
  };
  dbRole: {
    role: string | null;
    queryError: string | null;
  };
  env: {
    hasSupabaseUrl: boolean;
    hasAnonKey: boolean;
    nodeEnv: string;
  };
};

function readClientCookieNames(): string[] {
  if (typeof document === "undefined" || !document.cookie) return [];
  return document.cookie
    .split(";")
    .map((part) => part.trim().split("=")[0])
    .filter(Boolean);
}

export function AuthDebugClient({ server }: { server: AuthDebugServerSnapshot }) {
  const [clientState, setClientState] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void (async () => {
      const sb = getSupabaseBrowserClient();
      const [sessionRes, userRes] = await Promise.all([sb.auth.getSession(), sb.auth.getUser()]);

      setClientState({
        clientCookieNames: readClientCookieNames(),
        note: "HttpOnly Supabase cookies are not visible in document.cookie",
        session: sessionRes.data.session
          ? {
              userId: sessionRes.data.session.user.id,
              email: sessionRes.data.session.user.email,
              expires_at: sessionRes.data.session.expires_at,
              hasAccessToken: Boolean(sessionRes.data.session.access_token),
            }
          : null,
        sessionError: sessionRes.error?.message ?? null,
        user: userRes.data.user
          ? { id: userRes.data.user.id, email: userRes.data.user.email }
          : null,
        userError: userRes.error?.message ?? null,
      });
    })();
  }, []);

  const payload = {
    server,
    client: clientState,
    generatedAt: new Date().toISOString(),
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-amber-300">Auth debug — /debug-auth</h1>
          <p className="mt-2 text-sm text-slate-400">
            Temporary diagnostics for Supabase session + cookies + DB role.
          </p>
        </header>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-200">
            Quick summary
          </h2>
          <ul className="space-y-1 text-sm">
            <li>
              Server sees auth user:{" "}
              <strong>{server.serverUser.id ? "yes" : "no"}</strong>
              {server.serverUser.email ? ` (${server.serverUser.email})` : ""}
            </li>
            <li>
              Server auth cookie present:{" "}
              <strong>{server.authTokenCookiePresent ? "yes" : "no"}</strong>
            </li>
            <li>
              DB role: <strong>{server.dbRole.role ?? "—"}</strong>
              {server.dbRole.queryError ? ` (error: ${server.dbRole.queryError})` : ""}
            </li>
            <li>
              Client session (after hydrate):{" "}
              <strong>
                {clientState?.session ? "yes" : clientState === null ? "loading…" : "no"}
              </strong>
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-slate-700 bg-black/40 p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Raw JSON</h2>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all text-xs text-emerald-200">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}
