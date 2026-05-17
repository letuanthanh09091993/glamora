"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { UserAccount } from "@/lib/auth-types";
import {
  login as loginWithSupabase,
  logout as logoutSupabase,
  signUp as signUpSupabase,
  updateCurrentUser,
} from "@/lib/auth-storage";
import { accountFromDbAuthRow } from "@/lib/auth/account-from-db-row";
import { accountFromPrincipal } from "@/lib/auth/app-user";
import { fetchDbAuthRow } from "@/lib/auth/fetch-db-auth-row";
import { getBrowserSupabase } from "@/lib/supabase/browser-client";
import {
  fetchAppUserPrincipalById,
  fetchUserAccountById,
} from "@/lib/supabase/users-repository";

type AuthContextValue = {
  user: UserAccount | null;
  /** True after the first auth + `public.users` bootstrap attempt finishes. */
  isReady: boolean;
  /** Supabase session present (even if `public.users` profile still loading). */
  hasAuthSession: boolean;
  /** Supabase Auth email_confirmed_at present (source of truth for verification). */
  isEmailVerified: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; messageKey: string }>;
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

  const refreshUser = useCallback(async () => {
    try {
      const sb = getBrowserSupabase();
      await sb.auth.initialize();

      const {
        data: { session },
      } = await sb.auth.getSession();

      if (!session?.user) {
        setHasAuthSession(false);
        setUser(null);
        setIsEmailVerified(false);
        return;
      }

      setHasAuthSession(true);
      setIsEmailVerified(Boolean(session.user.email_confirmed_at));

      const authUser = session.user;
      const dbFetch = await fetchDbAuthRow(sb, authUser.id);

      if (dbFetch.row && dbFetch.row.id === authUser.id) {
        const principal = await fetchAppUserPrincipalById(sb, authUser.id);
        const acc = await fetchUserAccountById(sb, authUser.id);

        if (acc) {
          setUser({
            ...acc,
            role: dbFetch.row.role,
            accountStatus: dbFetch.row.account_status,
          });
          return;
        }

        if (principal && principal.id === authUser.id) {
          setUser({
            ...accountFromPrincipal(principal),
            role: dbFetch.row.role,
            accountStatus: dbFetch.row.account_status,
          });
          return;
        }

        setUser(accountFromDbAuthRow(dbFetch.row, authUser));
        return;
      }

      const principal = await fetchAppUserPrincipalById(sb, authUser.id);
      if (principal && principal.id === authUser.id) {
        const acc = await fetchUserAccountById(sb, authUser.id);
        setUser(
          acc
            ? { ...acc, role: principal.role, accountStatus: principal.accountStatus }
            : accountFromPrincipal(principal),
        );
        return;
      }

      console.log("[ADMIN CLIENT] session without public.users row", {
        authUserId: authUser.id,
        dbError: dbFetch.error,
      });
      setUser(null);
    } catch (err) {
      console.log("[ADMIN CLIENT] refreshUser error", err);
      setHasAuthSession(false);
      setUser(null);
      setIsEmailVerified(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | undefined;

    void (async () => {
      setIsReady(false);
      try {
        const sb = getBrowserSupabase();
        await refreshUser();
        if (!mounted) return;
        const { data } = sb.auth.onAuthStateChange(() => {
          void refreshUser();
        });
        subscription = data.subscription;
      } catch {
        if (mounted) {
          setHasAuthSession(false);
          setUser(null);
          setIsEmailVerified(false);
        }
      } finally {
        if (mounted) setIsReady(true);
      }
    })();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      hasAuthSession,
      isEmailVerified,
      async login(email, password) {
        const result = await loginWithSupabase(email, password);
        await refreshUser();
        return result;
      },
      async signUp(payload) {
        const result = await signUpSupabase(payload);
        await refreshUser();
        return result;
      },
      async logout() {
        try {
          await logoutSupabase();
        } catch {
          /* missing env or network */
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
    [hasAuthSession, isEmailVerified, isReady, refreshUser, user],
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
