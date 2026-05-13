import type { PortfolioItem, UserAccount } from "@/lib/auth-types";

function hashUrlStable(url: string): string {
  let h = 2166136261;
  for (let i = 0; i < url.length; i++) {
    h ^= url.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export function makeStableItemId(url: string, kind: PortfolioItem["kind"]): string {
  return `pi-${kind}-${hashUrlStable(url)}`;
}

/**
 * Keeps `portfolioItems` aligned with current image/video URL lists and preserves metadata when URLs match.
 */
export function syncPortfolioItemsWithUrls(
  user: UserAccount | null | undefined,
  nextImages: string[],
  nextVideos: string[],
): PortfolioItem[] {
  const prev = user?.portfolioItems;
  const byUrl = new Map((prev ?? []).map((i) => [i.url, i]));
  const out: PortfolioItem[] = [];

  for (const url of nextImages) {
    const ex = byUrl.get(url);
    if (ex?.kind === "image") out.push(ex);
    else out.push({ id: makeStableItemId(url, "image"), url, kind: "image" });
  }
  for (const url of nextVideos) {
    const ex = byUrl.get(url);
    if (ex?.kind === "video") out.push(ex);
    else out.push({ id: makeStableItemId(url, "video"), url, kind: "video" });
  }
  return out;
}

export function getStablePortfolioItems(user: UserAccount): PortfolioItem[] {
  return syncPortfolioItemsWithUrls(user, user.portfolioImageUrls ?? [], user.portfolioVideoUrls ?? []);
}

const FILTER_ALL = "all";
const FILTER_UNCAT = "__uncat__";

export { FILTER_ALL, FILTER_UNCAT };

export function itemMatchesFilter(
  value: string | undefined,
  filter: string,
): boolean {
  if (filter === FILTER_ALL) return true;
  const v = value?.trim();
  if (filter === FILTER_UNCAT) return !v;
  return v === filter;
}

export function uniqueNonEmptyStrings(values: Iterable<string | undefined>): string[] {
  const set = new Set<string>();
  for (const v of values) {
    const t = v?.trim();
    if (t) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
