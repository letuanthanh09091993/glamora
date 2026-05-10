export const USER_ROLES = [
  "customer",
  "makeup_artist",
  "model",
  "artist_looking_model",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type UserAccount = {
  id: string;
  username: string;
  password: string;
  phoneNumber: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  specialties?: string[];
  pricing?: string;
  rating?: number;
  reviews?: number;
  favoriteArtistIds?: string[];
  bookingHistory?: string[];
  measurements?: string;
  collaborationPreferences?: string;
  portfolioImageUrls?: string[];
  portfolioVideoUrls?: string[];
  castingRequests?: string[];
  isPublicProfile: boolean;
};

export type SignupPayload = {
  username: string;
  password: string;
  phoneNumber: string;
  role: UserRole;
};
