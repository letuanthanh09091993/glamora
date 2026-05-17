"use client";

import { AdminSectionHeader } from "@/components/admin/admin-section-header";
import { useLanguage } from "@/components/providers/language-provider";

export function AdminPlaceholderSection({
  titleKey,
  subtitleKey,
}: {
  titleKey: string;
  subtitleKey: string;
}) {
  const { t } = useLanguage();

  return (
    <div>
      <AdminSectionHeader title={t(titleKey)} subtitle={t(subtitleKey)} />
      <div className="rounded-3xl border border-dashed border-rose-200/90 bg-white/90 p-12 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-700">{t(titleKey)}</p>
        <p className="mt-2 text-xs text-slate-500">Content module coming soon.</p>
      </div>
    </div>
  );
}
