/** Temporary mock metrics for admin overview — replace with API when ready. */
export const MOCK_ADMIN_OVERVIEW_STATS = {
  totalUsers: 1_284,
  totalArtists: 186,
  totalBookings: 3_421,
  pendingApprovals: 14,
} as const;

export type AdminOverviewStats = {
  totalUsers: number;
  totalArtists: number;
  totalBookings: number;
  pendingApprovals: number;
};
