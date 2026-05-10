"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { UserAccount } from "@/lib/auth-types";
import {
  getCurrentUser,
  login as loginStorage,
  logout as logoutStorage,
  signUp as signUpStorage,
  updateCurrentUser,
} from "@/lib/auth-storage";

type AuthContextValue = {
  user: UserAccount | null;
  isReady: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; message: string }>;
  signUp: (payload: {
    username: string;
    password: string;
    phoneNumber: string;
    role: UserAccount["role"];
  }) => Promise<{ ok: boolean; message: string }>;
  logout: () => void;
  refreshUser: () => void;
  updateProfile: (partial: Partial<UserAccount>) => Promise<{ ok: boolean; message: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refreshUser = () => {
    const current = getCurrentUser();
    setUser(current);
  };

  useEffect(() => {
    refreshUser();
    setIsReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      async login(username, password) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const result = await loginStorage(username, password);
        refreshUser();
        return result;
      },
      async signUp(payload) {
        await new Promise((resolve) => setTimeout(resolve, 700));
        const result = await signUpStorage(payload);
        refreshUser();
        return result;
      },
      logout() {
        logoutStorage();
        refreshUser();
      },
      refreshUser,
      async updateProfile(partial) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const result = updateCurrentUser(partial);
        refreshUser();
        return result;
      },
    }),
    [isReady, user],
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
