import { isPublicDiscoverableMakeupArtist } from "@/lib/artist/public-artists";
import type { UserAccount } from "@/lib/auth-types";

/**
 * Search/discovery document shape (for future Algolia/Postgres FTS).
 * Build from `UserAccount` + services — not wired to a search engine yet.
 */
export type ArtistDiscoveryDocument = {
  id: string;
  username: string;
  displayName: string;
  role: "makeup_artist";
  verificationStatus: string;
  featured: boolean;
  averageRating: number | null;
  reviewCount: number;
  specialties: string[];
  serviceCategories: string[];
  districts: string[];
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  searchableText: string;
};

export function buildArtistDiscoveryDocument(artist: UserAccount): ArtistDiscoveryDocument | null {
  if (!isPublicDiscoverableMakeupArtist(artist)) return null;
  const packages = artist.servicePackages ?? [];
  const prices = packages
    .map((p) => parseFloat(String(p.price).replace(/[^\d.]/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);

  const searchableParts = [
    artist.username,
    artist.displayName,
    artist.bio,
    artist.location,
    ...(artist.specialties ?? []),
    ...(artist.serviceAreaDistrictKeys ?? []),
    ...packages.map((p) => `${p.name} ${p.detail}`),
  ].filter(Boolean);

  return {
    id: artist.id,
    username: artist.username,
    displayName: artist.displayName?.trim() || artist.username,
    role: "makeup_artist",
    verificationStatus: artist.artistVerificationStatus ?? "verified",
    featured: false,
    averageRating: artist.rating ?? null,
    reviewCount: artist.reviews ?? 0,
    specialties: artist.specialties ?? [],
    serviceCategories: [],
    districts: artist.serviceAreaDistrictKeys ?? [],
    location: artist.location ?? null,
    latitude: artist.latitude ?? null,
    longitude: artist.longitude ?? null,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    searchableText: searchableParts.join(" ").toLowerCase(),
  };
}
