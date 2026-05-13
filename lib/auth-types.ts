export const USER_ROLES = [
  "customer",
  "makeup_artist",
  "model",
  "artist_looking_model",
  "admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type ServicePackageRow = {
  name: string;
  price: string;
  detail: string;
};

/** One image or video in the public portfolio, with optional grouping for display & filters. */
export type PortfolioItem = {
  id: string;
  url: string;
  kind: "image" | "video";
  /** User-defined collection name (e.g. album). */
  album?: string;
  /** Style / look tag; often aligned with profile specialties. */
  styleTag?: string;
  /** Optional link to a named service package (gói dịch vụ). */
  packageName?: string;
};

export type UserAccount = {
  id: string;
  username: string;
  password: string;
  phoneNumber: string;
  /** Contact email for recovery / notifications (optional). */
  email?: string;
  role: UserRole;
  /** Shown on public profile and cards instead of username when set. */
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  latitude?: number;
  longitude?: number;
  location?: string;
  /** Selected HCM district keys for service area (matches `artistsPage.districtOptions`). */
  serviceAreaDistrictKeys?: string[];
  /** Fixed studio or personal shop address (optional). */
  studioAddress?: string;
  /** Makeup style tags (e.g. bridal, editorial). */
  specialties?: string[];
  /** Legacy single-line pricing blurb; kept in sync with servicePackages for listings. */
  pricing?: string;
  /** Structured service offerings for makeup artists. */
  servicePackages?: ServicePackageRow[];
  /** Brands used in services (makeup artists). */
  cosmeticBrands?: string[];
  rating?: number;
  reviews?: number;
  favoriteArtistIds?: string[];
  bookingHistory?: string[];
  measurements?: string;
  collaborationPreferences?: string;
  portfolioImageUrls?: string[];
  portfolioVideoUrls?: string[];
  /** Richer portfolio entries (album / style / package). Synced with image & video URL lists. */
  portfolioItems?: PortfolioItem[];
  castingRequests?: string[];
  isPublicProfile: boolean;
  /** ISO timestamp when the account was created (optional for legacy rows). */
  createdAt?: string;
};

export type SignupPayload = {
  username: string;
  password: string;
  phoneNumber: string;
  role: UserRole;
};
