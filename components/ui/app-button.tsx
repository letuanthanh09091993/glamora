import { ReactNode } from "react";

type AppButtonProps = {
  children: ReactNode;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
  loading?: boolean;
  onClick?: () => void;
  className?: string;
};

export function AppButton({
  children,
  type = "button",
  variant = "primary",
  loading,
  onClick,
  className = "",
}: AppButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
        variant === "primary"
          ? "bg-black text-white hover:-translate-y-0.5 hover:opacity-90"
          : "border border-black/20 bg-white text-black hover:bg-black hover:text-white"
      } ${className}`}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
