export const USER_ROLES = [
  "customer",
  "makeup_artist",
  "model",
  "artist_looking_model",
  "admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type AccountStatus = "active" | "suspended";

export type ArtistVerificationStatus = "none" | "pending" | "verified" | "rejected";

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
  /** Not used with Supabase Auth (passwords live in auth.users only). */
  password?: string;
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
  /** Directory / policy: suspended users cannot use protected app surfaces. */
  accountStatus?: AccountStatus;
  /** Makeup artist marketplace trust; non-artists stay `none`. */
  artistVerificationStatus?: ArtistVerificationStatus;
  /** Admin-only note when verification is rejected. */
  artistVerificationNote?: string;
  /** Mirrors Supabase `email_confirmed_at` (synced from auth.users). */
  emailVerifiedAt?: string;
  /** Mirrors Supabase `last_sign_in_at` (best-effort sync). */
  lastLoginAt?: string;
  /** Auth email (login identity); same as Supabase Auth email after migration. */
  authLoginEmail?: string;
};

export type SignupPayload = {
  email: string;
  username: string;
  password: string;
  phoneNumber: string;
  role: UserRole;
};
