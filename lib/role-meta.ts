import { UserRole } from "@/lib/auth-types";
import { AppRoutes } from "@/lib/app-routes";

export const ROLE_META: Record<
  UserRole,
  { dashboardPath: string }
> = {
  customer: {
    dashboardPath: AppRoutes.dashboardCustomer,
  },
  makeup_artist: {
    dashboardPath: AppRoutes.dashboardMakeupArtist,
  },
  model: {
    dashboardPath: AppRoutes.dashboardModel,
  },
  artist_looking_model: {
    dashboardPath: AppRoutes.dashboardArtistLookingModel,
  },
};
