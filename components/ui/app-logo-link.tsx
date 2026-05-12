"use client";

import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";
import { AppRoutes } from "@/lib/app-routes";

type AppLogoLinkProps = {
  href?: string;
  className?: string;
};

/**
 * Site wordmark — Sora via `font-wordmark` (see root layout + globals.css).
 */
export function AppLogoLink({ href = AppRoutes.home, className = "" }: AppLogoLinkProps) {
  const { t } = useLanguage();
  return (
    <Link
      href={href}
      className={`inline-block shrink-0 font-wordmark text-xl font-semibold leading-none tracking-[-0.03em] transition hover:opacity-80 sm:text-[1.35rem] sm:tracking-[-0.04em] ${className}`.trim()}
    >
      <span className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-pink-700 bg-clip-text text-transparent">
        {t("common.appName")}
      </span>
    </Link>
  );
}
