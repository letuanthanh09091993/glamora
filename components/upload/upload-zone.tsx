"use client";

import { ReactNode } from "react";
import { UploadProgressBar } from "@/components/upload/upload-progress-bar";
import { UploadSpinner } from "@/components/upload/upload-spinner";

type UploadZoneProps = {
  title: string;
  children: ReactNode;
  busy?: boolean;
  busyLabel?: string;
  progress?: number | null;
  progressLabel?: string;
  className?: string;
};

export function UploadZone({
  title,
  children,
  busy,
  busyLabel,
  progress,
  progressLabel,
  className = "",
}: UploadZoneProps) {
  return (
    <div
      className={`relative rounded-2xl border border-dashed border-[var(--glamora-border)] bg-[var(--glamora-canvas-muted)]/80 p-6 transition-colors ${busy ? "border-[var(--glamora-rose)]/40 bg-[var(--glamora-rose-soft)]/30" : ""} ${className}`.trim()}
    >
      <p className="text-sm font-semibold text-black">{title}</p>
      <div className={`mt-4 ${busy ? "pointer-events-none opacity-60" : ""}`}>{children}</div>

      {busy ? (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-white/75 p-6 backdrop-blur-[2px]"
          aria-busy="true"
          aria-live="polite"
        >
          <UploadSpinner className="h-8 w-8 text-[var(--glamora-rose)]" />
          {busyLabel ? <p className="text-center text-sm font-semibold text-black">{busyLabel}</p> : null}
          {progress != null ? (
            <div className="w-full max-w-xs px-4">
              <UploadProgressBar value={progress} label={progressLabel} />
            </div>
          ) : (
            <div className="w-full max-w-xs px-4">
              <UploadProgressBar label={progressLabel} />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
