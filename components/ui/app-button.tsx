"use client";

import { ReactNode } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { buttonSizes } from "@/lib/ui/design-tokens";

type AppButtonProps = {
  children: ReactNode;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

const variantClass: Record<NonNullable<AppButtonProps["variant"]>, string> = {
  primary:
    "bg-black text-white shadow-sm hover:bg-black/90 hover:shadow-md active:scale-[0.98]",
  secondary:
    "border border-[var(--glamora-border)] bg-white text-black hover:border-black/25 hover:bg-[var(--glamora-canvas-muted)]",
  ghost: "bg-transparent text-gray-700 hover:bg-black/[0.04]",
};

export function AppButton({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  loading,
  disabled,
  onClick,
  className = "",
}: AppButtonProps) {
  const { t } = useLanguage();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-55 ${buttonSizes[size]} ${variantClass[variant]} ${className}`}
    >
      {loading ? t("common.pleaseWait") : children}
    </button>
  );
}
