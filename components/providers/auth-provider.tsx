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
import { accountFromPrincipal } from "@/lib/auth/app-user";
import { getBrowserSupabase } from "@/lib/supabase/browser-client";
import {
  fetchAppUserPrincipalById,
  fetchUserAccountById,
} from "@/lib/supabase/users-repository";

type AuthContextValue = {
  user: UserAccount | null;
  /** True after the first auth + `public.users` bootstrap attempt finishes. */
  isReady: boolean;
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
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const sb = getBrowserSupabase();
      await sb.auth.initialize();
      const {
        data: { user: authUser },
        error: authError,
      } = await sb.auth.getUser();

      if (authError || !authUser) {
        setUser(null);
        setIsEmailVerified(false);
        return;
      }

      setIsEmailVerified(Boolean(authUser.email_confirmed_at));

      const principal = await fetchAppUserPrincipalById(sb, authUser.id);
      if (!principal || principal.id !== authUser.id) {
        setUser(null);
        return;
      }

      const acc = await fetchUserAccountById(sb, authUser.id);
      setUser(
        acc
          ? { ...acc, role: principal.role, accountStatus: principal.accountStatus }
          : accountFromPrincipal(principal),
      );
    } catch {
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
    [isEmailVerified, isReady, refreshUser, user],
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
