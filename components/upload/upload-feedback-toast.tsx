"use client";

import { useEffect } from "react";

export type UploadFeedbackType = "success" | "error" | "info";

type UploadFeedbackToastProps = {
  open: boolean;
  type: UploadFeedbackType;
  message: string;
  onClose: () => void;
  autoHideMs?: number;
};

const styles: Record<UploadFeedbackType, string> = {
  success: "border-emerald-200/90 bg-emerald-50 text-emerald-900 shadow-emerald-100/50",
  error: "border-red-200/90 bg-red-50 text-red-800 shadow-red-100/50",
  info: "border-[var(--glamora-border)] bg-white text-[var(--glamora-ink)] shadow-[var(--glamora-shadow-md)]",
};

export function UploadFeedbackToast({
  open,
  type,
  message,
  onClose,
  autoHideMs = 4500,
}: UploadFeedbackToastProps) {
  useEffect(() => {
    if (!open || autoHideMs <= 0) return;
    const id = window.setTimeout(onClose, autoHideMs);
    return () => window.clearTimeout(id);
  }, [open, autoHideMs, onClose, message]);

  if (!open || !message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-6 z-[100] flex justify-center sm:inset-x-auto sm:right-6 sm:justify-end"
    >
      <div
        className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-lg backdrop-blur-sm transition-all duration-300 ${styles[type]} animate-[upload-toast-in_0.35s_ease-out]`}
      >
        {type === "success" ? (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white animate-[upload-check-pop_0.45s_ease-out]"
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : type === "error" ? (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-white"
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" />
            </svg>
          </span>
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--glamora-rose-soft)] text-[var(--glamora-rose)]">
            …
          </span>
        )}
        <p className="min-w-0 flex-1 pt-0.5 text-sm font-medium leading-snug">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1 text-current opacity-60 transition hover:bg-black/5 hover:opacity-100"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
