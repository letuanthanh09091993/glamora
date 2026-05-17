"use client";

import { ReactNode } from "react";
import { glamora } from "@/lib/ui/design-tokens";

type AppCardProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "inset";
  padding?: boolean;
  as?: "div" | "article" | "section";
};

export function AppCard({
  children,
  className = "",
  variant = "default",
  padding = true,
  as: Tag = "div",
}: AppCardProps) {
  const surface =
    variant === "elevated"
      ? glamora.cardElevated
      : variant === "inset"
        ? glamora.cardInset
        : glamora.card;

  return (
    <Tag className={`${surface} ${padding ? glamora.cardPadding : ""} ${className}`.trim()}>
      {children}
    </Tag>
  );
}
