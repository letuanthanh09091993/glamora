"use client";

import Link from "next/link";
import { UserAccount } from "@/lib/auth-types";
import { AppRoutes } from "@/lib/app-routes";
import { useLanguage } from "@/components/providers/language-provider";
import { glamora } from "@/lib/ui/design-tokens";

const DEMO_GRADIENTS = [
  "bg-gradient-to-br from-pink-200 via-rose-100 to-pink-50",
  "bg-gradient-to-br from-fuchsia-100 via-pink-50 to-rose-100",
  "bg-gradient-to-br from-rose-200 via-orange-50 to-pink-100",
] as const;

type ArtistMarketplaceCardProps = {
  artist: UserAccount;
  isDemo?: boolean;
  demoSlot?: 1 | 2 | 3;
  demoProfileHref?: string;
};

export function ArtistMarketplaceCard({
  artist,
  isDemo,
  demoSlot,
  demoProfileHref,
}: ArtistMarketplaceCardProps) {
  const { t } = useLanguage();
  const gradient = demoSlot ? DEMO_GRADIENTS[demoSlot - 1] : DEMO_GRADIENTS[0];

  return (
    <article
      className={`group flex flex-col overflow-hidden ${glamora.cardElevated} transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--glamora-shadow-md)]`}
    >
      {isDemo && demoSlot ? (
        <div className={`relative aspect-[4/3] sm:aspect-[16/11] ${gradient}`}>
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-700 shadow-sm ring-1 ring-black/5">
            {t("home.featuredDemoBadge")}
          </span>
        </div>
      ) : (
        <div
          className="aspect-[4/3] bg-gradient-to-br from-rose-100 to-pink-50 sm:aspect-[16/11]"
          style={
            artist.avatarUrl
              ? {
                  backgroundImage: `url(${artist.avatarUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        />
      )}

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-black transition group-hover:text-[var(--glamora-rose)] sm:text-xl">
            {artist.username}
          </h2>
          <span className="shrink-0 rounded-full bg-[var(--glamora-rose-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--glamora-rose)]">
            ★ {artist.rating?.toFixed(1) ?? "—"}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 flex-1 text-sm text-[var(--glamora-muted)]">
          {(artist.specialties ?? []).join(" · ") || t("home.artistServices")}
        </p>
        {artist.location ? (
          <p className="mt-1.5 line-clamp-1 text-xs text-gray-400">{artist.location}</p>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 border-t border-[var(--glamora-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-black">{artist.pricing || t("home.fromPrice")}</p>
          <div className="flex flex-wrap gap-2">
            {isDemo && demoProfileHref ? (
              <Link
                href={demoProfileHref}
                className="inline-flex min-h-9 items-center rounded-2xl border border-[var(--glamora-border)] px-4 py-2 text-xs font-semibold transition hover:bg-black hover:text-white sm:text-sm"
              >
                {t("common.publicProfile")}
              </Link>
            ) : (
              <>
                <Link
                  href={AppRoutes.legacyProfile(artist.username)}
                  className="inline-flex min-h-9 items-center rounded-2xl border border-[var(--glamora-border)] px-4 py-2 text-xs font-semibold transition hover:bg-black hover:text-white sm:text-sm"
                >
                  {t("common.publicProfile")}
                </Link>
                <Link
                  href={AppRoutes.bookArtist(artist.username)}
                  className="inline-flex min-h-9 items-center rounded-2xl bg-black px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 sm:text-sm"
                >
                  {t("home.bookNow")}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
