"use client";

import { ReactNode } from "react";
import { useLanguage } from "@/components/providers/language-provider";

type AppButtonProps = {
  children: ReactNode;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
  /** Nút nhỏ gọn (padding & chữ nhỏ hơn). */
  size?: "default" | "sm";
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

export function AppButton({
  children,
  type = "button",
  variant = "primary",
  size = "default",
  loading,
  disabled,
  onClick,
  className = "",
}: AppButtonProps) {
  const { t } = useLanguage();

  const sizeClass =
    size === "sm" ? "min-h-9 px-3.5 py-1.5 text-xs" : "px-6 py-3 text-sm";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`rounded-full font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${sizeClass} ${
        variant === "primary"
          ? "bg-black text-white hover:-translate-y-0.5 hover:opacity-90"
          : "border border-black/20 bg-white text-black hover:bg-black hover:text-white"
      } ${className}`}
    >
      {loading ? t("common.pleaseWait") : children}
    </button>
  );
}
