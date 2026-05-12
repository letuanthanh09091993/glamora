"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useLanguage } from "@/components/providers/language-provider";

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#fff7fc] via-[#fffaf5] to-[#fff] p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="grid overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-xl md:grid-cols-2">
          <div className="hidden bg-[radial-gradient(circle_at_top,#f9dce8,transparent_55%),radial-gradient(circle_at_bottom_right,#f8e8e4,transparent_45%)] p-10 md:block">
            <p className="text-xs uppercase tracking-[0.25em] text-pink-500">{t("authShell.eyebrow")}</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-black">
              {t("authShell.headlineLine1")}
              <br />
              {t("authShell.headlineLine2")}
            </h1>
            <p className="mt-4 text-gray-600">
              {t("authShell.description")}
            </p>
          </div>
          <div className="p-6 sm:p-10">
            <div className="mb-6 flex justify-end">
              <Link
                href="/"
                className="text-sm font-medium text-gray-500 transition hover:text-black"
              >
                {t("common.backHome")}
              </Link>
            </div>
            <h2 className="text-3xl font-bold text-black">{title}</h2>
            <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-6 text-sm text-gray-600">
              {footerText}{" "}
              <Link className="font-semibold text-pink-500 hover:underline" href={footerLink}>
                {footerLabel}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
