"use client";

import { ReactNode } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { UploadSpinner } from "@/components/upload/upload-spinner";
import { buttonSizes } from "@/lib/ui/design-tokens";

type AppButtonProps = {
  children: ReactNode;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  /** Shown while loading; falls back to common.pleaseWait */
  loadingLabel?: ReactNode;
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
  loadingLabel,
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
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-55 ${buttonSizes[size]} ${variantClass[variant]} ${className}`}
    >
      {loading ? (
        <>
          <UploadSpinner className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
          <span>{loadingLabel ?? t("common.pleaseWait")}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
