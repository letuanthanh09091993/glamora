/**
 * Canonical route map for Glamora.
 * Prefer importing from here instead of scattering path strings across the app.
 * When migrating to feature-based URLs, update values here and add Next.js redirects.
 */
export const AppRoutes = {
  home: "/",
  login: "/auth/login",
  signup: "/auth/signup",
  account: "/account",

  /** Legacy dashboard entry (RoleGate redirects role → concrete dashboard) */
  dashboard: "/dashboard",

  /** Current role dashboards (v1) */
  dashboardCustomer: "/dashboard/customer",
  dashboardCustomerBookings: "/dashboard/customer/bookings",
  dashboardMakeupArtist: "/dashboard/makeup-artist",
  dashboardMakeupArtistBookings: "/dashboard/makeup-artist/bookings",
  dashboardModel: "/dashboard/model",
  dashboardArtistLookingModel: "/dashboard/artist-looking-model",

  /** Public discovery & profiles */
  artistsIndex: "/artists",
  artistProfile: (username: string) => `/artists/${encodeURIComponent(username)}`,
  /** Public makeup-model directory (`/models/[slug]` demo showcase) */
  modelsIndex: "/models",
  /** Legacy public profile (keep until /@username or /artists/* migration) */
  legacyProfile: (username: string) => `/profile/${encodeURIComponent(username)}`,
  bookArtist: (username: string) => `/book/${encodeURIComponent(username)}`,

  /** Planned v2 (no pages yet — use for links/constants/redirects planning) */
  v2: {
    customerProfile: "/customer/profile",
    customerBookings: "/customer/bookings",
    customerFavorites: "/customer/favorites",
    artistDashboard: "/artist/dashboard",
    artistProfile: "/artist/profile",
    artistBookings: "/artist/bookings",
    modelDashboard: "/model/dashboard",
    modelProfile: "/model/profile",
    adminRoot: "/admin",
    adminUsers: "/admin/users",
    adminBookings: "/admin/bookings",
    adminReports: "/admin/reports",
    /** Optional vanity public URL */
    atUsername: (username: string) => `/@${encodeURIComponent(username)}`,
  },
} as const;
