"use client";

import { ReactNode } from "react";

type PortfolioMediaPreviewCardProps = {
  preview: ReactNode;
  onRemove: () => void;
  removeLabel: string;
  meta?: ReactNode;
  className?: string;
};

export function PortfolioMediaPreviewCard({
  preview,
  onRemove,
  removeLabel,
  meta,
  className = "",
}: PortfolioMediaPreviewCardProps) {
  return (
    <li
      className={`group rounded-2xl border border-[var(--glamora-border)] bg-white p-4 shadow-[var(--glamora-shadow-sm)] transition hover:shadow-[var(--glamora-shadow-md)] sm:flex sm:gap-6 sm:p-5 ${className}`.trim()}
    >
      <div className="relative mx-auto shrink-0 sm:mx-0">
        <div className="overflow-hidden rounded-2xl ring-1 ring-black/[0.06] transition group-hover:ring-[var(--glamora-rose)]/30">
          {preview}
        </div>
        <button
          type="button"
          className="absolute right-2 top-2 rounded-xl bg-black/75 px-2.5 py-1 text-[10px] font-semibold text-white opacity-90 shadow-sm transition hover:bg-black hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          onClick={onRemove}
        >
          {removeLabel}
        </button>
      </div>
      {meta ? <div className="mt-4 min-w-0 flex-1 sm:mt-0">{meta}</div> : null}
    </li>
  );
}
