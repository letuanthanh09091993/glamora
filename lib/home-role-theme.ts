import type { UserRole } from "@/lib/auth-types";

/** Subtle header + shell accents per role; keeps base #fdf8f6 / #2b2b2b harmony. */
export type HomeRoleShellTheme = {
  mainClass: string;
  headerClass: string;
  signedInHintClass: string;
  welcomeAccentClass: string;
  navLinkClass: string;
  logoutButtonClass: string;
  langDividerClass: string;
};

const GUEST_SHELL: HomeRoleShellTheme = {
  mainClass: "min-h-screen bg-[#fdf8f6] text-[#2b2b2b]",
  headerClass:
    "sticky top-0 z-20 border-b border-black/5 bg-[#fdf8f6]/95 backdrop-blur",
  signedInHintClass:
    "border-b border-pink-100 bg-gradient-to-r from-pink-50/90 to-white px-4 py-2.5 sm:px-6",
  welcomeAccentClass: "font-semibold text-black",
  navLinkClass:
    "shrink-0 rounded-full px-3 py-2 text-sm text-gray-700 transition hover:bg-black/5 sm:px-4",
  logoutButtonClass:
    "shrink-0 rounded-full border border-black/15 px-3 py-2 text-sm font-medium text-gray-800 transition hover:bg-black hover:text-white sm:px-4",
  langDividerClass: "flex shrink-0 items-center border-l border-black/10 pl-2 sm:pl-3",
};

const ROLE_SHELL: Record<UserRole, HomeRoleShellTheme> = {
  /** Booking-focused — warm amber / peach */
  customer: {
    mainClass:
      "min-h-screen bg-gradient-to-b from-amber-50/35 via-[#fdf8f6] to-[#fdf8f6] text-[#2b2b2b]",
    headerClass:
      "sticky top-0 z-20 border-b border-amber-200/45 bg-gradient-to-b from-amber-50/55 to-[#fdf8f6]/95 backdrop-blur",
    signedInHintClass:
      "border-b border-amber-100/90 bg-gradient-to-r from-amber-50/95 via-orange-50/70 to-white px-4 py-2.5 sm:px-6",
    welcomeAccentClass: "font-semibold text-amber-950",
    navLinkClass:
      "shrink-0 rounded-full px-3 py-2 text-sm text-gray-700 transition hover:bg-amber-500/10 sm:px-4",
    logoutButtonClass:
      "shrink-0 rounded-full border border-amber-300/55 px-3 py-2 text-sm font-medium text-amber-950 transition hover:border-amber-800 hover:bg-amber-900 hover:text-white sm:px-4",
    langDividerClass:
      "flex shrink-0 items-center border-l border-amber-200/70 pl-2 sm:pl-3",
  },
  /** Artist — rose / burgundy (brand-adjacent) */
  makeup_artist: {
    mainClass:
      "min-h-screen bg-gradient-to-b from-rose-50/40 via-[#fdf8f6] to-[#fdf8f6] text-[#2b2b2b]",
    headerClass:
      "sticky top-0 z-20 border-b border-rose-200/50 bg-gradient-to-b from-rose-50/50 to-[#fdf8f6]/95 backdrop-blur",
    signedInHintClass:
      "border-b border-rose-100/90 bg-gradient-to-r from-rose-50/95 via-pink-50/75 to-white px-4 py-2.5 sm:px-6",
    welcomeAccentClass: "font-semibold text-rose-950",
    navLinkClass:
      "shrink-0 rounded-full px-3 py-2 text-sm text-gray-700 transition hover:bg-rose-500/10 sm:px-4",
    logoutButtonClass:
      "shrink-0 rounded-full border border-rose-300/55 px-3 py-2 text-sm font-medium text-rose-950 transition hover:border-rose-900 hover:bg-rose-900 hover:text-white sm:px-4",
    langDividerClass:
      "flex shrink-0 items-center border-l border-rose-200/70 pl-2 sm:pl-3",
  },
  /** Makeup model — violet / plum */
  model: {
    mainClass:
      "min-h-screen bg-gradient-to-b from-violet-50/35 via-[#fdf8f6] to-[#fdf8f6] text-[#2b2b2b]",
    headerClass:
      "sticky top-0 z-20 border-b border-violet-200/45 bg-gradient-to-b from-violet-50/45 to-[#fdf8f6]/95 backdrop-blur",
    signedInHintClass:
      "border-b border-violet-100/90 bg-gradient-to-r from-violet-50/95 via-fuchsia-50/55 to-white px-4 py-2.5 sm:px-6",
    welcomeAccentClass: "font-semibold text-violet-950",
    navLinkClass:
      "shrink-0 rounded-full px-3 py-2 text-sm text-gray-700 transition hover:bg-violet-500/10 sm:px-4",
    logoutButtonClass:
      "shrink-0 rounded-full border border-violet-300/50 px-3 py-2 text-sm font-medium text-violet-950 transition hover:border-violet-800 hover:bg-violet-800 hover:text-white sm:px-4",
    langDividerClass:
      "flex shrink-0 items-center border-l border-violet-200/65 pl-2 sm:pl-3",
  },
  /** Casting / artist seeking models — sage / teal */
  artist_looking_model: {
    mainClass:
      "min-h-screen bg-gradient-to-b from-teal-50/30 via-[#fdf8f6] to-[#fdf8f6] text-[#2b2b2b]",
    headerClass:
      "sticky top-0 z-20 border-b border-teal-200/40 bg-gradient-to-b from-teal-50/40 to-[#fdf8f6]/95 backdrop-blur",
    signedInHintClass:
      "border-b border-teal-100/90 bg-gradient-to-r from-teal-50/95 via-emerald-50/55 to-white px-4 py-2.5 sm:px-6",
    welcomeAccentClass: "font-semibold text-teal-950",
    navLinkClass:
      "shrink-0 rounded-full px-3 py-2 text-sm text-gray-700 transition hover:bg-teal-500/10 sm:px-4",
    logoutButtonClass:
      "shrink-0 rounded-full border border-teal-400/45 px-3 py-2 text-sm font-medium text-teal-950 transition hover:border-teal-800 hover:bg-teal-800 hover:text-white sm:px-4",
    langDividerClass:
      "flex shrink-0 items-center border-l border-teal-200/60 pl-2 sm:pl-3",
  },
  /** Admin — neutral slate */
  admin: {
    mainClass: "min-h-screen bg-gradient-to-b from-slate-50/50 via-[#fdf8f6] to-[#fdf8f6] text-[#2b2b2b]",
    headerClass:
      "sticky top-0 z-20 border-b border-slate-200/50 bg-gradient-to-b from-slate-50/60 to-[#fdf8f6]/95 backdrop-blur",
    signedInHintClass:
      "border-b border-slate-100/90 bg-gradient-to-r from-slate-50/95 via-zinc-50/70 to-white px-4 py-2.5 sm:px-6",
    welcomeAccentClass: "font-semibold text-slate-950",
    navLinkClass:
      "shrink-0 rounded-full px-3 py-2 text-sm text-gray-700 transition hover:bg-slate-500/10 sm:px-4",
    logoutButtonClass:
      "shrink-0 rounded-full border border-slate-300/55 px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-800 hover:bg-slate-800 hover:text-white sm:px-4",
    langDividerClass: "flex shrink-0 items-center border-l border-slate-200/70 pl-2 sm:pl-3",
  },
};

export function getHomeRoleShellTheme(role: UserRole | null | undefined): HomeRoleShellTheme {
  if (!role) return GUEST_SHELL;
  return ROLE_SHELL[role];
}
