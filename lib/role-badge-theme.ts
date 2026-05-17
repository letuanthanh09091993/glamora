import type { UserRole } from "@/lib/auth-types";

export type RoleBadgeTheme = {
  container: string;
  dot: string;
};

/** Pill badge accents aligned with `home-role-theme` role colors. */
export const ROLE_BADGE_THEMES: Record<UserRole, RoleBadgeTheme> = {
  admin: {
    container:
      "bg-gradient-to-r from-slate-100/95 via-zinc-50 to-slate-100/95 text-slate-800 ring-slate-200/90 shadow-sm shadow-slate-300/25",
    dot: "bg-gradient-to-br from-slate-500 to-slate-800 shadow-[0_0_6px_rgba(71,85,105,0.45)]",
  },
  customer: {
    container:
      "bg-gradient-to-r from-amber-50/95 via-orange-50/80 to-amber-50/95 text-amber-950 ring-amber-200/90 shadow-sm shadow-amber-200/35",
    dot: "bg-gradient-to-br from-amber-400 to-orange-600 shadow-[0_0_6px_rgba(245,158,11,0.4)]",
  },
  makeup_artist: {
    container:
      "bg-gradient-to-r from-rose-50/95 via-pink-50/85 to-rose-50/95 text-rose-950 ring-rose-200/90 shadow-sm shadow-rose-200/40",
    dot: "bg-gradient-to-br from-rose-400 to-rose-700 shadow-[0_0_6px_rgba(244,63,94,0.45)]",
  },
  model: {
    container:
      "bg-gradient-to-r from-violet-50/95 via-fuchsia-50/70 to-violet-50/95 text-violet-950 ring-violet-200/90 shadow-sm shadow-violet-200/35",
    dot: "bg-gradient-to-br from-violet-400 to-fuchsia-700 shadow-[0_0_6px_rgba(139,92,246,0.4)]",
  },
  artist_looking_model: {
    container:
      "bg-gradient-to-r from-teal-50/95 via-emerald-50/75 to-teal-50/95 text-teal-950 ring-teal-200/90 shadow-sm shadow-teal-200/35",
    dot: "bg-gradient-to-br from-teal-400 to-emerald-600 shadow-[0_0_6px_rgba(20,184,166,0.4)]",
  },
};

export const ROLE_BADGE_SIZE_CLASS = {
  sm: "px-2 py-0.5 text-[10px] tracking-wide",
  md: "px-2.5 py-1 text-xs tracking-wide",
} as const;
