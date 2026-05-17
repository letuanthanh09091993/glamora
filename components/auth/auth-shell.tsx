"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { glamora } from "@/lib/ui/design-tokens";
import { AppLogoLink } from "@/components/ui/app-logo-link";

export function AuthShell({
  title,
  subtitle,
  footerText,
  footerLink,
  footerLabel,
  children,
}: {
  title: string;
  subtitle: string;
  footerText: string;
  footerLink: string;
  footerLabel: string;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  const Box = "div" as const;

  return (
    <main className={`${glamora.page} p-4 sm:p-8`}>
      <Box className="mx-auto max-w-5xl">
        <Box className={`grid overflow-hidden md:grid-cols-2 ${glamora.cardElevated}`}>
          <Box className="hidden bg-[radial-gradient(circle_at_top,var(--glamora-rose-soft),transparent_55%),radial-gradient(circle_at_bottom_right,#f8e8e4,transparent_45%)] p-10 md:block">
            <AppLogoLink href="/" className="mb-8 inline-block" />
            <p className={glamora.eyebrow}>{t("authShell.eyebrow")}</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-black">
              {t("authShell.headlineLine1")}
              <br />
              {t("authShell.headlineLine2")}
            </h1>
            <p className={`mt-4 ${glamora.subtitle}`}>{t("authShell.description")}</p>
          </Box>
          <Box className="p-6 sm:p-10">
            <Box className="mb-6 flex justify-end md:hidden">
              <AppLogoLink href="/" />
            </Box>
            <Box className="mb-6 flex justify-end">
              <Link
                href="/"
                className="text-sm font-medium text-[var(--glamora-muted)] transition hover:text-black"
              >
                {t("common.backHome")}
              </Link>
            </Box>
            <h2 className={glamora.titleLg}>{title}</h2>
            <p className={`mt-2 ${glamora.subtitle}`}>{subtitle}</p>
            <Box className="mt-8">{children}</Box>
            <p className={`mt-6 ${glamora.subtitle}`}>
              {footerText}{" "}
              <Link className="font-semibold text-[var(--glamora-rose)] hover:underline" href={footerLink}>
                {footerLabel}
              </Link>
            </p>
          </Box>
        </Box>
      </Box>
    </main>
  );
}
