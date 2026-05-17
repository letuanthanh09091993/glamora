"use client";

import { glamora } from "@/lib/ui/design-tokens";

type LoadingStateProps = {
  message: string;
  className?: string;
  fullScreen?: boolean;
};

export function LoadingState({ message, className = "", fullScreen }: LoadingStateProps) {
  const inner = (
    <div className={`flex flex-col items-center gap-3 ${className}`.trim()}>
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--glamora-border)] border-t-[var(--glamora-rose)]"
        aria-hidden
      />
      <p className={glamora.subtitle}>{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <main className={`${glamora.page} flex min-h-screen items-center justify-center p-6`}>
        {inner}
      </main>
    );
  }

  return (
    <div className="flex justify-center py-12" role="status" aria-live="polite">
      {inner}
    </div>
  );
}
