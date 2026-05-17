/**
 * Glamora presentation tokens — UI-only, safe to use across pages.
 * Prefer these over one-off hex/spacing values for consistency.
 */
export const glamora = {
  page: "min-h-screen bg-[var(--glamora-canvas)] text-[var(--glamora-ink)]",
  container: "mx-auto w-full max-w-7xl px-4 sm:px-6",
  sectionY: "py-10 sm:py-12",
  sectionGap: "space-y-8 sm:space-y-10",

  card: "rounded-2xl border border-[var(--glamora-border)] bg-white shadow-[var(--glamora-shadow-sm)]",
  cardPadding: "p-5 sm:p-6",
  cardElevated:
    "rounded-2xl border border-[var(--glamora-border)] bg-white shadow-[var(--glamora-shadow-md)] ring-1 ring-black/[0.03]",
  cardInset: "rounded-2xl border border-[var(--glamora-border)] bg-[var(--glamora-canvas-muted)]/60",

  eyebrow: "text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--glamora-rose)]",
  titleLg: "text-2xl font-semibold tracking-tight text-black sm:text-3xl",
  titleMd: "text-lg font-semibold tracking-tight text-black sm:text-xl",
  subtitle: "text-sm leading-relaxed text-[var(--glamora-muted)]",

  header:
    "sticky top-0 z-30 border-b border-[var(--glamora-border)] bg-[var(--glamora-canvas)]/90 backdrop-blur-md",
  headerInner: "mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4",

  field:
    "w-full min-h-11 rounded-2xl border border-[var(--glamora-border)] bg-white px-4 py-2.5 text-sm text-black outline-none transition placeholder:text-gray-400 focus:border-[var(--glamora-rose)] focus:ring-2 focus:ring-[var(--glamora-rose-ring)]",
  fieldLabel: "mb-1.5 block text-xs font-medium text-gray-600",
  textarea:
    "w-full rounded-2xl border border-[var(--glamora-border)] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[var(--glamora-rose)] focus:ring-2 focus:ring-[var(--glamora-rose-ring)]",

  navLink:
    "inline-flex min-h-10 items-center rounded-2xl px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-black/[0.04] sm:px-4",
  navLinkActive:
    "inline-flex min-h-10 items-center rounded-2xl bg-black px-3.5 py-2 text-sm font-semibold text-white shadow-sm sm:px-4",

  chip:
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
} as const;

export const buttonSizes = {
  sm: "min-h-9 px-3.5 py-1.5 text-xs",
  md: "min-h-11 px-5 py-2.5 text-sm",
  lg: "min-h-12 px-6 py-3 text-sm",
} as const;
