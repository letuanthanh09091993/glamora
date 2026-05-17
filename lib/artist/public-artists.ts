import type { UserAccount } from "@/lib/auth-types";

/** Legacy DB rows may still use `approved`; marketplace treats it like `verified`. */
export const PUBLIC_MAKEUP_ARTIST_VERIFICATION_STATUSES = ["verified", "approved"] as const;

export type PublicMakeupArtistVerificationStatus =
  (typeof PUBLIC_MAKEUP_ARTIST_VERIFICATION_STATUSES)[number];

export function isPublicDiscoverableMakeupArtist(
  user: Pick<
    UserAccount,
    "role" | "accountStatus" | "isPublicProfile" | "artistVerificationStatus"
  >,
): boolean {
  if (user.role !== "makeup_artist") return false;
  if ((user.accountStatus ?? "active") !== "active") return false;
  if (!user.isPublicProfile) return false;

  const status = user.artistVerificationStatus ?? "none";
  return (PUBLIC_MAKEUP_ARTIST_VERIFICATION_STATUSES as readonly string[]).includes(status);
}

/** Client-side safety net after fetching public directory rows. */
export function filterPublicDiscoverableMakeupArtists(users: UserAccount[]): UserAccount[] {
  return users.filter(isPublicDiscoverableMakeupArtist);
}
