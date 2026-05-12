/** Slugs for spotlight demo makeup artists (featured section when no real users). */
export const FEATURED_DEMO_SLUGS = ["lan-anh-bridal", "minh-trang-studio", "the-face-saigon"] as const;

export type FeaturedDemoSlug = (typeof FEATURED_DEMO_SLUGS)[number];

export function isFeaturedDemoSlug(slug: string): slug is FeaturedDemoSlug {
  return (FEATURED_DEMO_SLUGS as readonly string[]).includes(slug);
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
