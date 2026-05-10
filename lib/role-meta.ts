import { UserRole } from "@/lib/auth-types";

export const ROLE_META: Record<
  UserRole,
  { dashboardPath: string }
> = {
  customer: {
    dashboardPath: "/dashboard/customer",
  },
  makeup_artist: {
    dashboardPath: "/dashboard/makeup-artist",
  },
  model: {
    dashboardPath: "/dashboard/model",
  },
  artist_looking_model: {
    dashboardPath: "/dashboard/artist-looking-model",
  },
};
