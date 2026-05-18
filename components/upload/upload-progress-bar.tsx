"use client";

type UploadProgressBarProps = {
  /** 0–100 when known; omit for indeterminate */
  value?: number;
  label?: string;
  className?: string;
};

export function UploadProgressBar({ value, label, className = "" }: UploadProgressBarProps) {
  const determinate = value != null && Number.isFinite(value);
  const clamped = determinate ? Math.min(100, Math.max(0, value)) : undefined;

  return (
    <div
      className={`w-full ${className}`.trim()}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
    >
      {label ? <p className="mb-2 text-xs font-medium text-[var(--glamora-muted)]">{label}</p> : null}
      <div className="h-2 overflow-hidden rounded-full bg-[var(--glamora-rose-soft)] ring-1 ring-[var(--glamora-border)]">
        {determinate ? (
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--glamora-rose)] to-pink-400 transition-[width] duration-300 ease-out"
            style={{ width: `${clamped}%` }}
          />
        ) : (
          <div className="relative h-full w-full overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1/3 animate-[upload-indeterminate_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[var(--glamora-rose)] to-pink-400" />
          </div>
        )}
      </div>
      {determinate ? (
        <p className="mt-1.5 text-right text-[11px] font-semibold tabular-nums text-[var(--glamora-rose)]">
          {Math.round(clamped!)}%
        </p>
      ) : null}
    </div>
  );
}

