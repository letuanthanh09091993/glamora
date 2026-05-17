"use client";

import { ReactNode } from "react";
import { PageShell, PageContainer } from "@/components/ui/page-shell";
import { SiteHeader } from "@/components/ui/site-header";
import { AppCard } from "@/components/ui/app-card";

export function BookingPageLayout({ children }: { children: ReactNode }) {
  return (
    <PageShell variant="subtle-rose">
      <SiteHeader />
      <PageContainer narrow className="py-10 sm:py-12">
        <AppCard variant="elevated">{children}</AppCard>
      </PageContainer>
    </PageShell>
  );
}
