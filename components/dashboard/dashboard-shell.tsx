"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { ROLE_META } from "@/lib/role-meta";
import { AppButton } from "@/components/ui/app-button";

export function DashboardShell({ title, children }: { title: string; children: ReactNode }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#fdf8f6]">
      <header className="border-b border-black/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-pink-500">Glamora Dashboard</p>
            <h1 className="text-xl font-semibold text-black">{title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link className="rounded-full px-4 py-2 text-sm hover:bg-black/5" href="/account">
              Account
            </Link>
            <Link className="rounded-full px-4 py-2 text-sm hover:bg-black/5" href={`/profile/${user.username}`}>
              Public Profile
            </Link>
            <AppButton variant="secondary" onClick={logout}>
              Logout
            </AppButton>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Signed in as</p>
          <p className="text-lg font-semibold text-black">{user.username}</p>
          <p className="text-sm text-gray-600">{ROLE_META[user.role].label}</p>
        </div>
        {children}
      </section>
    </main>
  );
}
