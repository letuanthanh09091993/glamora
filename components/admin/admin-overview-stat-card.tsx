import type { ReactNode } from "react";

export function AdminOverviewStatCard({
  label,
  value,
  hint,
  icon,
  accentClass,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  accentClass: string;
}) {
  return (
    <article
      className={`group relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-white p-6 shadow-[0_18px_50px_-24px_rgba(190,24,93,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-20px_rgba(190,24,93,0.4)] ${accentClass}`}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-rose-200/40 to-transparent blur-2xl transition group-hover:scale-110"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="mt-3 font-[family-name:var(--font-glamora-mark)] text-4xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
          {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
          {icon}
        </div>
      </div>
    </article>
  );
}
