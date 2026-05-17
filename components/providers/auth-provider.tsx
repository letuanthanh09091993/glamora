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
import type { Session, User } from "@supabase/supabase-js";
import type { SignupPayload, UserAccount } from "@/lib/auth-types";
import {
  signInWithPassword,
  signOut as authSignOut,
  signUpAccount,
} from "@/lib/auth/auth-client";
import { updateCurrentUser } from "@/lib/profile-storage";
import { fetchUserAccountById } from "@/lib/supabase/users-repository";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthContextValue = {
  session: Session | null;
  authUser: User | null;
  profile: UserAccount | null;
  loading: boolean;
  signIn: (email: string, password: string) => ReturnType<typeof signInWithPassword>;
  signUp: (payload: SignupPayload) => ReturnType<typeof signUpAccount>;
  signOut: () => Promise<void>;
  updateProfile: (partial: Partial<UserAccount>) => ReturnType<typeof updateCurrentUser>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(async (next: Session | null) => {
    setSession(next);
    setAuthUser(next?.user ?? null);

    if (next?.user) {
      const sb = getSupabaseBrowserClient();
      const acc = await fetchUserAccountById(sb, next.user.id);
      setProfile(acc);
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const sb = getSupabaseBrowserClient();

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, nextSession) => {
      console.log("[AUTH PROVIDER SESSION]", {
        event,
        sessionExists: Boolean(nextSession),
        userId: nextSession?.user?.id ?? null,
        email: nextSession?.user?.email ?? null,
      });
      void applySession(nextSession);
      setLoading(false);
    });

    void sb.auth.getSession().then(({ data: { session: initial } }) => {
      console.log("[AUTH PROVIDER SESSION]", {
        event: "INITIAL",
        sessionExists: Boolean(initial),
        userId: initial?.user?.id ?? null,
        email: initial?.user?.email ?? null,
      });
      void applySession(initial);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      authUser,
      profile,
      loading,
      signIn: signInWithPassword,
      signUp: signUpAccount,
      async signOut() {
        await authSignOut();
        setSession(null);
        setAuthUser(null);
        setProfile(null);
      },
      updateProfile: updateCurrentUser,
      async refreshUser() {
        const sb = getSupabaseBrowserClient();
        const {
          data: { session: current },
        } = await sb.auth.getSession();
        await applySession(current);
      },
    }),
    [applySession, authUser, loading, profile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return {
    session: ctx.session,
    authUser: ctx.authUser,
    profile: ctx.profile,
    loading: ctx.loading,
    signIn: ctx.signIn,
    signUp: ctx.signUp,
    signOut: ctx.signOut,
    updateProfile: ctx.updateProfile,
    refreshUser: ctx.refreshUser,
    /** @deprecated — use `profile` */
    user: ctx.profile,
    isReady: !ctx.loading,
    hasAuthSession: Boolean(ctx.session),
    isEmailVerified: Boolean(ctx.authUser?.email_confirmed_at),
    login: ctx.signIn,
    logout: ctx.signOut,
  };
}
