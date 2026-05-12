/** Slugs for showcase demo models (Models section when no public profiles). */
export const MODEL_DEMO_SLUGS = ["linh-nguyen-editorial", "mai-pham-commercial", "hana-le-fashion"] as const;

export type ModelDemoSlug = (typeof MODEL_DEMO_SLUGS)[number];

export function isModelDemoSlug(slug: string): slug is ModelDemoSlug {
  return (MODEL_DEMO_SLUGS as readonly string[]).includes(slug);
}

/** 1-based index for i18n keys `home.modelDemo{n}*`. */
export function getModelDemoIndex(slug: string): 1 | 2 | 3 | null {
  const i = MODEL_DEMO_SLUGS.indexOf(slug as ModelDemoSlug);
  if (i < 0) return null;
  return (i + 1) as 1 | 2 | 3;
}

export function modelPortfolioImageUrls(slug: string): string[] {
  return Array.from({ length: 6 }, (_, j) => `https://picsum.photos/seed/${slug}-mpf-${j}/800/600`);
}

export function modelAvatarUrl(slug: string): string {
  return `https://picsum.photos/seed/${slug}-mavatar/560/560`;
}
