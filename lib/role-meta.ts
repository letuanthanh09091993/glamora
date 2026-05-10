import { UserRole } from "@/lib/auth-types";

export const ROLE_META: Record<
  UserRole,
  { label: string; short: string; dashboardPath: string; description: string }
> = {
  customer: {
    label: "Customer looking for makeup artists",
    short: "Customer",
    dashboardPath: "/dashboard/customer",
    description: "Find and book premium artists, save favorites and history.",
  },
  makeup_artist: {
    label: "Makeup Artist",
    short: "Makeup Artist",
    dashboardPath: "/dashboard/makeup-artist",
    description: "Showcase portfolio, services, pricing, ratings, and reviews.",
  },
  model: {
    label: "Model",
    short: "Model",
    dashboardPath: "/dashboard/model",
    description: "Build your profile, photos, details, and collaboration style.",
  },
  artist_looking_model: {
    label: "Makeup Artist looking for models",
    short: "Artist Seeking Model",
    dashboardPath: "/dashboard/artist-looking-model",
    description: "Post casting requests and browse model collaboration matches.",
  },
};
