"use client";

import { ReactNode } from "react";
import { glamora } from "@/lib/ui/design-tokens";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-[var(--glamora-border)] bg-white/80 px-6 py-14 text-center ${className}`.trim()}
    >
      <p className="text-base font-semibold text-black">{title}</p>
      {description ? <p className={`mx-auto mt-2 max-w-md ${glamora.subtitle}`}>{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
