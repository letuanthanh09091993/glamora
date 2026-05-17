"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { AppButton } from "@/components/ui/app-button";
import { useAuth } from "@/components/providers/auth-provider";
import type { ServicePackageRow, UserAccount } from "@/lib/auth-types";
import type { Booking } from "@/lib/booking-types";
import { AppRoutes } from "@/lib/app-routes";
import {
  averageCustomerRatingFromBookings,
  getArtistCompletedClientBookings,
} from "@/lib/booking-storage";
import { normalizeServicePackages } from "@/lib/service-packages";
import { formatPriceCell } from "@/lib/vnd-format";

export default function MakeupArtistDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const packages = useMemo(() => {
    if (!user) return [];
    return normalizeServicePackages(user.servicePackages ?? []);
  }, [user?.id, user?.servicePackages]);

  const [completedClientBookings, setCompletedClientBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user) {
      setCompletedClientBookings([]);
      return;
    }
    void getArtistCompletedClientBookings(user.id).then(setCompletedClientBookings);
  }, [user?.id]);

  const ratingDisplay = useMemo(() => {
    const avg = averageCustomerRatingFromBookings(completedClientBookings);
    if (avg != null) return `${avg} ★`;
    if (user?.rating != null) return `${user.rating} ★`;
    return "—";
  }, [completedClientBookings, user?.rating]);

  return (
    <DashboardShell title={t("dashboard.artistTitle")}>
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-pink-100 bg-gradient-to-r from-pink-50 to-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black">{t("dashboard.artistBookingPanel.title")}</h2>
            <p className="mt-1 text-sm text-gray-600">{t("dashboard.artistBookingPanel.body")}</p>
          </div>
          <Link href="/dashboard/makeup-artist/bookings">
            <AppButton>{t("dashboard.artistBookingPanel.cta")}</AppButton>
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Card title={t("dashboard.artistCards.completionTitle")} value={t("dashboard.artistCards.completionValue")} />
          <PortfolioAssetsStatCard user={user} title={t("dashboard.artistCards.assetsTitle")} />
          <RatingStatCard title={t("dashboard.artistCards.ratingTitle")} value={ratingDisplay} />
          <ServicePackagesStatCard title={t("dashboard.artistCards.servicesTitle")} packages={packages} />
        </div>
        <Section
          title={t("dashboard.sectionArtistCapabilities")}
          items={[
            t("dashboard.artistItems.one"),
            t("dashboard.artistItems.two"),
            t("dashboard.artistItems.three"),
          ]}
        />
      </DashboardShell>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-lg font-semibold text-black">{value}</p>
    </div>
  );
}

function PortfolioAssetsStatCard({ user, title }: { user: UserAccount | null; title: string }) {
  const { t } = useLanguage();
  const imgCount = user?.portfolioImageUrls?.length ?? 0;
  const vidCount = user?.portfolioVideoUrls?.length ?? 0;
  const value = t("dashboard.artistCards.assetsCountLine")
    .replace("{images}", String(imgCount))
    .replace("{videos}", String(vidCount));

  return (
    <Link
      href={AppRoutes.dashboardMakeupArtistPortfolio}
      className="group block w-full rounded-3xl border border-black/10 bg-white p-5 text-left shadow-sm transition hover:border-pink-300/80 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-pink-200 focus:ring-offset-2"
    >
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-lg font-semibold text-black">{value}</p>
      <p className="mt-2 text-xs font-medium text-pink-600/90 transition group-hover:text-pink-700">
        {t("dashboard.servicePackagesModal.tapToView")}
      </p>
    </Link>
  );
}

function RatingStatCard({ title, value }: { title: string; value: string }) {
  const { t } = useLanguage();
  return (
    <Link
      href={`${AppRoutes.dashboardMakeupArtistBookings}#service-reviews`}
      className="group block w-full rounded-3xl border border-black/10 bg-white p-5 text-left shadow-sm transition hover:border-pink-300/80 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-pink-200 focus:ring-offset-2"
    >
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-lg font-semibold text-black">{value}</p>
      <p className="mt-2 text-xs font-medium text-pink-600/90 transition group-hover:text-pink-700">
        {t("dashboard.servicePackagesModal.tapToView")}
      </p>
    </Link>
  );
}

function ServicePackagesStatCard({
  title,
  packages,
}: {
  title: string;
  packages: ServicePackageRow[];
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const count = packages.length;
  const value = t("dashboard.artistCards.servicesCountLine").replace("{count}", String(count));

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function cell(str: string) {
    const s = str.trim();
    return s || "—";
  }

  function priceDisplay(raw: string) {
    const s = raw.trim();
    if (!s) return "—";
    return formatPriceCell(raw);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group w-full rounded-3xl border border-black/10 bg-white p-5 text-left shadow-sm transition hover:border-pink-300/80 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-pink-200 focus:ring-offset-2"
      >
        <p className="text-sm text-gray-500">{title}</p>
        <p className="mt-2 text-lg font-semibold text-black">{value}</p>
        <p className="mt-2 text-xs font-medium text-pink-600/90 transition group-hover:text-pink-700">
          {t("dashboard.servicePackagesModal.tapToView")}
        </p>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-packages-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px] transition"
            aria-label={t("dashboard.servicePackagesModal.close")}
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.75rem] border border-black/10 bg-white shadow-2xl ring-1 ring-black/5 sm:max-h-[85vh] sm:rounded-3xl">
            <div className="border-b border-black/10 bg-gradient-to-r from-pink-50/90 via-white to-rose-50/40 px-5 py-4 sm:px-6">
              <h2 id="service-packages-modal-title" className="text-lg font-semibold text-black">
                {t("dashboard.servicePackagesModal.title")}
              </h2>
              <p className="mt-0.5 text-sm text-gray-600">{value}</p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
              {packages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/15 bg-gray-50/80 px-4 py-10 text-center">
                  <p className="text-sm text-gray-600">{t("dashboard.servicePackagesModal.empty")}</p>
                  <Link
                    href={AppRoutes.account}
                    className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                    onClick={() => setOpen(false)}
                  >
                    {t("dashboard.servicePackagesModal.editProfile")}
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-black/10">
                  <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-black/10 bg-gradient-to-r from-pink-50 to-rose-50/60">
                        <th className="px-3 py-3 font-semibold text-gray-800 sm:px-4">
                          {t("account.packageColName")}
                        </th>
                        <th className="w-[130px] px-3 py-3 font-semibold text-gray-800 sm:px-4">
                          {t("account.packageColPrice")}
                        </th>
                        <th className="min-w-[180px] px-3 py-3 font-semibold text-gray-800 sm:px-4">
                          {t("account.packageColDetail")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {packages.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-black/5 transition last:border-0 hover:bg-pink-50/40"
                        >
                          <td className="px-3 py-3 align-top font-medium text-black sm:px-4">
                            {cell(row.name)}
                          </td>
                          <td className="px-3 py-3 align-top text-pink-800 sm:px-4 tabular-nums">
                            {priceDisplay(row.price)}
                          </td>
                          <td className="px-3 py-3 align-top leading-relaxed text-gray-600 sm:px-4">
                            {cell(row.detail)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-black/10 bg-white px-4 py-3 sm:px-5">
              <Link
                href={AppRoutes.account}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-black/15 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-black/5"
                onClick={() => setOpen(false)}
              >
                {t("dashboard.servicePackagesModal.editProfile")}
              </Link>
              <AppButton type="button" onClick={() => setOpen(false)}>
                {t("dashboard.servicePackagesModal.close")}
              </AppButton>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-black">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-gray-600">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
