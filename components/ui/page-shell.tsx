"use client";

import { ReactNode } from "react";
import { glamora } from "@/lib/ui/design-tokens";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "subtle-rose";
};

export function PageShell({ children, className = "", variant = "default" }: PageShellProps) {
  const bg =
    variant === "subtle-rose"
      ? "min-h-screen bg-gradient-to-b from-rose-50/30 via-[var(--glamora-canvas)] to-[var(--glamora-canvas)] text-[var(--glamora-ink)]"
      : glamora.page;

  return <main className={`${bg} ${className}`.trim()}>{children}</main>;
}

export function PageContainer({
  children,
  className = "",
  narrow,
}: {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  const width = narrow ? "mx-auto w-full max-w-2xl px-4 sm:px-6" : glamora.container;
  return <div className={`${width} ${className}`.trim()}>{children}</div>;
}
