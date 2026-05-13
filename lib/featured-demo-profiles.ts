import { t as translateT, type Language } from "@/lib/i18n";
import type { UserAccount } from "@/lib/auth-types";

/** Slugs for spotlight demo makeup artists (featured section when no real users). */
export const FEATURED_DEMO_SLUGS = ["lan-anh-bridal", "minh-trang-studio", "the-face-saigon"] as const;

export type FeaturedDemoSlug = (typeof FEATURED_DEMO_SLUGS)[number];

export function isFeaturedDemoSlug(slug: string): slug is FeaturedDemoSlug {
  return (FEATURED_DEMO_SLUGS as readonly string[]).includes(slug);
}

/** Synthetic public artist for `/book/[slug]` when slug matches a spotlight demo (no localStorage user). */
export function resolveFeaturedDemoArtist(slug: string, language: Language): UserAccount | null {
  if (!isFeaturedDemoSlug(slug)) return null;
  const s = slug as FeaturedDemoSlug;
  const idx = getFeaturedDemoIndex(s)!;
  const tag = translateT(language, `home.featuredDemo${idx}Tagline`);
  const specParts = tag.includes(" · ") ? tag.split(" · ") : [tag];
  return {
    id: `demo-spotlight-${s}`,
    username: s,
    password: "demo",
    phoneNumber: "0000000000",
    role: "makeup_artist",
    rating: 4.9,
    reviews: 120,
    specialties: specParts,
    pricing: translateT(language, `home.featuredDemo${idx}Price`),
    bio: tag,
    location: translateT(language, `spotlight.demo${idx}Location`),
    isPublicProfile: true,
  };
}

export function featuredDemoArtistDisplayName(slug: string, language: Language): string | null {
  if (!isFeaturedDemoSlug(slug)) return null;
  const idx = getFeaturedDemoIndex(slug as FeaturedDemoSlug)!;
  return translateT(language, `home.featuredDemo${idx}Name`);
}

/** 1-based index used by i18n keys `home.featuredDemo{n}`. */
export function getFeaturedDemoIndex(slug: string): 1 | 2 | 3 | null {
  const i = FEATURED_DEMO_SLUGS.indexOf(slug as FeaturedDemoSlug);
  if (i < 0) return null;
  return (i + 1) as 1 | 2 | 3;
}

export function portfolioImageUrlsForSlug(slug: string): string[] {
  return Array.from({ length: 6 }, (_, j) => `https://picsum.photos/seed/${slug}-pf-${j}/800/600`);
}

export function avatarUrlForSlug(slug: string): string {
  return `https://picsum.photos/seed/${slug}-avatar/560/560`;
}
