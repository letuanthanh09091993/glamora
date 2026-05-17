"use client";

import type { UserRole } from "@/lib/auth-types";
import { ROLE_BADGE_SIZE_CLASS, ROLE_BADGE_THEMES } from "@/lib/role-badge-theme";
import { getRoleLabel } from "@/lib/i18n";
import { useLanguage } from "@/components/providers/language-provider";

export type RoleBadgeProps = {
  role: UserRole;
  /** Override translated label (useful in server-rendered tables). */
  label?: string;
  size?: keyof typeof ROLE_BADGE_SIZE_CLASS;
  showDot?: boolean;
  className?: string;
};

export function RoleBadge({
  role,
  label,
  size = "md",
  showDot = true,
  className = "",
}: RoleBadgeProps) {
  const { language } = useLanguage();
  const theme = ROLE_BADGE_THEMES[role];
  const text = label ?? getRoleLabel(language, role);

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full font-semibold uppercase ring-1 ${ROLE_BADGE_SIZE_CLASS[size]} ${theme.container} ${className}`}
    >
      {showDot ? (
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${theme.dot}`}
          aria-hidden
        />
      ) : null}
      <span className="truncate">{text}</span>
    </span>
  );
}
