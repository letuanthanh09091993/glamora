"use client";

import { ReactNode } from "react";
import { glamora } from "@/lib/ui/design-tokens";
import { AppLogoLink } from "@/components/ui/app-logo-link";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

type SiteHeaderProps = {
  homeHref?: string;
  trailing?: ReactNode;
  className?: string;
  sticky?: boolean;
};

export function SiteHeader({
  homeHref = "/",
  trailing,
  className = "",
  sticky = true,
}: SiteHeaderProps) {
  return (
    <header
      className={`${sticky ? glamora.header : "border-b border-[var(--glamora-border)] bg-[var(--glamora-canvas)]"} ${className}`.trim()}
    >
      <div className={glamora.headerInner}>
        <AppLogoLink href={homeHref} />
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          {trailing}
          <div className="flex items-center border-l border-[var(--glamora-border)] pl-2 sm:pl-3">
            <span className="sr-only">Language</span>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
