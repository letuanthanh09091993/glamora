"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { UserAccount, type UserRole } from "@/lib/auth-types";
import {
  login as loginWithSupabase,
  logout as logoutSupabase,
  signUp as signUpSupabase,
  updateCurrentUser,
} from "@/lib/auth-storage";
import { resolveLoginRedirect } from "@/lib/auth/resolve-login-redirect";
import { syncProfileFromSession } from "@/lib/auth/sync-profile-from-session";
import { waitForBrowserSession } from "@/lib/auth/wait-for-browser-session";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type LoginResult = {
  ok: boolean;
  messageKey: string;
  role?: UserRole;
  redirectTo?: string;
};

type AuthContextValue = {
  user: UserAccount | null;
  isReady: boolean;
  hasAuthSession: boolean;
  isEmailVerified: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  signUp: (payload: {
    email: string;
    username: string;
    password: string;
    phoneNumber: string;
    role: UserAccount["role"];
  }) => Promise<{ ok: boolean; messageKey: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (partial: Partial<UserAccount>) => Promise<{ ok: boolean; messageKey: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasAuthSession, setHasAuthSession] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const syncInFlight = useRef(false);

  const applyProfileSync = useCallback((synced: Awaited<ReturnType<typeof syncProfileFromSession>>) => {
    setHasAuthSession(synced.hasAuthSession);
    setIsEmailVerified(synced.isEmailVerified);
    setUser(synced.user);
  }, []);

  const refreshUser = useCallback(
    async (knownSession?: Session | null) => {
      const sb = getSupabaseBrowserClient();
      await sb.auth.initialize();

      const session =
        knownSession !== undefined
          ? knownSession
          : (
              await sb.auth.getSession()
            ).data.session;

      if (!session?.user) {
        setHasAuthSession(false);
        setUser(null);
        setIsEmailVerified(false);
        return;
      }

      setHasAuthSession(true);
      setIsEmailVerified(Boolean(session.user.email_confirmed_at));

      try {
        const synced = await syncProfileFromSession(sb, session);
        applyProfileSync(synced);
      } catch (err) {
        console.log("[AUTH PROVIDER] profile sync error (session kept)", err);
        setHasAuthSession(true);
        setIsEmailVerified(Boolean(session.user.email_confirmed_at));
      }
    },
    [applyProfileSync],
  );

  const handleAuthStateChange = useCallback(
    async (event: string, session: Session | null) => {
      console.log("[AUTH PROVIDER]", {
        event,
        sessionExists: !!session,
        userEmail: session?.user?.email,
      });

      if (event === "SIGNED_OUT") {
        setHasAuthSession(false);
        setUser(null);
        setIsEmailVerified(false);
        return;
      }

      if (session?.user) {
        setHasAuthSession(true);
        setIsEmailVerified(Boolean(session.user.email_confirmed_at));
      }

      if (syncInFlight.current) return;
      syncInFlight.current = true;
      try {
        await refreshUser(session);
      } finally {
        syncInFlight.current = false;
      }
    },
    [refreshUser],
  );

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | undefined;

    void (async () => {
      setIsReady(false);
      try {
        const sb = getSupabaseBrowserClient();
        const {
          data: { subscription: sub },
        } = sb.auth.onAuthStateChange((event, session) => {
          void handleAuthStateChange(event, session);
        });
        subscription = sub;

        if (!mounted) return;
        await refreshUser();
      } catch (err) {
        console.log("[AUTH PROVIDER] bootstrap error", err);
      } finally {
        if (mounted) setIsReady(true);
      }
    })();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [handleAuthStateChange, refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      hasAuthSession,
      isEmailVerified,
      async login(email, password) {
        const result = await loginWithSupabase(email, password);
        if (!result.ok) return result;

        const sb = getSupabaseBrowserClient();
        const session = await waitForBrowserSession(sb);
        if (!session?.user) {
          console.log("[AUTH PROVIDER] login ok but session not persisted");
          return { ok: false, messageKey: "authMessages.networkError" };
        }

        const { role, redirectTo } = await resolveLoginRedirect(sb, session.user.id);

        await refreshUser(session);
        const synced = await syncProfileFromSession(sb, session);
        applyProfileSync(synced);

        return {
          ok: true,
          messageKey: result.messageKey,
          role,
          redirectTo,
        };
      },
      async signUp(payload) {
        const result = await signUpSupabase(payload);
        if (result.ok) {
          const sb = getSupabaseBrowserClient();
          const session = await waitForBrowserSession(sb, { timeoutMs: 5000 });
          if (session) await refreshUser(session);
        }
        return result;
      },
      async logout() {
        try {
          await logoutSupabase();
        } catch {
          /* ignore */
        }
        setHasAuthSession(false);
        setUser(null);
        setIsEmailVerified(false);
      },
      refreshUser,
      async updateProfile(partial) {
        const result = await updateCurrentUser(partial);
        await refreshUser();
        return result;
      },
    }),
    [applyProfileSync, hasAuthSession, isEmailVerified, isReady, refreshUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
