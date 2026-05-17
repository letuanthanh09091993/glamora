"use client";

import { ReactNode } from "react";
import { glamora } from "@/lib/ui/design-tokens";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`.trim()}>
      <div className="min-w-0">
        {eyebrow ? <p className={glamora.eyebrow}>{eyebrow}</p> : null}
        <h1 className={`${eyebrow ? "mt-2" : ""} ${glamora.titleLg}`}>{title}</h1>
        {subtitle ? <p className={`mt-2 max-w-2xl ${glamora.subtitle}`}>{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
