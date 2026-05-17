"use client";

import { ReactNode } from "react";
import { glamora } from "@/lib/ui/design-tokens";

type BookingListCardProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "demo";
};

export function BookingListCard({ children, className = "", variant = "default" }: BookingListCardProps) {
  const base =
    variant === "demo"
      ? "rounded-2xl border border-dashed border-[var(--glamora-border)] bg-gradient-to-b from-white to-[var(--glamora-canvas-muted)] p-4 ring-1 ring-black/[0.03]"
      : `${glamora.cardInset} p-4 sm:p-5`;

  return <li className={`${base} ${className}`.trim()}>{children}</li>;
}
