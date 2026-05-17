export {
  PUBLIC_MAKEUP_ARTIST_VERIFICATION_STATUSES,
  filterPublicDiscoverableMakeupArtists,
  isPublicDiscoverableMakeupArtist,
  type PublicMakeupArtistVerificationStatus,
} from "@/lib/artist/public-artists";

export { listPublicMakeupArtists as fetchPublicMakeupArtists } from "@/lib/supabase/users-repository";
