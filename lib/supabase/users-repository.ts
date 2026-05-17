import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchDbAuthRow } from "@/lib/auth/fetch-db-auth-row";
import {
  accountFromPrincipal,
  type AppUserPrincipal,
} from "@/lib/auth/app-user";
import type {
  AccountStatus,
  ArtistVerificationStatus,
  PortfolioItem,
  SignupPayload,
  UserAccount,
  UserRole,
} from "@/lib/auth-types";

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  service_area_district_keys: unknown;
  studio_address: string | null;
  specialties: string[] | null;
  pricing: string | null;
  service_packages: unknown;
  cosmetic_brands: string[] | null;
  rating: number | null;
  reviews: number | null;
  favorite_artist_ids: string[] | null;
  booking_history_ids: string[] | null;
  measurements: string | null;
  collaboration_preferences: string | null;
  portfolio_image_urls: string[] | null;
  portfolio_video_urls: string[] | null;
  portfolio_items: unknown;
  casting_requests: unknown;
};

type PortfolioDbRow = {
  id: string;
  user_id: string;
  url: string;
  kind: "image" | "video";
  album: string | null;
  style_tag: string | null;
  package_name: string | null;
  sort_order: number;
  created_at?: string;
};

export type UserDbRow = {
  id: string;
  username: string;
  auth_login_email: string;
  phone_number: string;
  role: string;
  is_public_profile: boolean;
  contact_email: string | null;
  created_at: string;
  account_status?: string;
  artist_verification_status?: string;
  artist_verification_note?: string | null;
  email_verified_at?: string | null;
  last_login_at?: string | null;
  profiles: ProfileRow | ProfileRow[] | null;
  artist_portfolios?: PortfolioDbRow[] | null;
};

function asStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.map((x) => String(x));
}

function asPortfolioItems(v: unknown): PortfolioItem[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: PortfolioItem[] = [];
  for (const raw of v) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    if (typeof o.id !== "string" || typeof o.url !== "string") continue;
    const kind = o.kind === "video" ? "video" : "image";
    out.push({
      id: o.id,
      url: o.url,
      kind,
      album: typeof o.album === "string" ? o.album : undefined,
      styleTag: typeof o.styleTag === "string" ? o.styleTag : undefined,
      packageName: typeof o.packageName === "string" ? o.packageName : undefined,
    });
  }
  return out.length ? out : undefined;
}

function portfolioRowsToItems(rows: PortfolioDbRow[]): PortfolioItem[] {
  return [...rows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => ({
      id: r.id,
      url: r.url,
      kind: r.kind,
      album: r.album ?? undefined,
      styleTag: r.style_tag ?? undefined,
      packageName: r.package_name ?? undefined,
    }));
}

export function mapUserDbRowToAccount(row: UserDbRow): UserAccount {
  const p = Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles;
  const fromTable =
    row.artist_portfolios && row.artist_portfolios.length > 0
      ? portfolioRowsToItems(row.artist_portfolios)
      : undefined;
  const fromJson = asPortfolioItems(p?.portfolio_items);
  const portfolioItems = fromTable?.length ? fromTable : fromJson;

  const castingRaw = p?.casting_requests;
  const castingRequests = Array.isArray(castingRaw)
    ? castingRaw.map((x) => String(x))
    : typeof castingRaw === "string"
      ? [castingRaw]
      : undefined;

  return {
    id: row.id,
    username: row.username,
    password: undefined,
    phoneNumber: row.phone_number,
    email: row.contact_email?.trim() ? row.contact_email.trim() : undefined,
    role: row.role as UserRole,
    displayName: p?.display_name?.trim() ? p.display_name.trim() : undefined,
    avatarUrl: p?.avatar_url?.trim() ? p.avatar_url.trim() : undefined,
    bio: p?.bio?.trim() ? p.bio.trim() : undefined,
    latitude: p?.latitude ?? undefined,
    longitude: p?.longitude ?? undefined,
    location: p?.location?.trim() ? p.location.trim() : undefined,
    serviceAreaDistrictKeys: asStringArray(p?.service_area_district_keys) ?? undefined,
    studioAddress: p?.studio_address?.trim() ? p.studio_address.trim() : undefined,
    specialties: p?.specialties?.length ? [...p.specialties] : undefined,
    pricing: p?.pricing?.trim() ? p.pricing.trim() : undefined,
    servicePackages: Array.isArray(p?.service_packages)
      ? (p!.service_packages as UserAccount["servicePackages"])
      : undefined,
    cosmeticBrands: p?.cosmetic_brands?.length ? [...p.cosmetic_brands] : undefined,
    rating: p?.rating ?? undefined,
    reviews: p?.reviews ?? undefined,
    favoriteArtistIds: p?.favorite_artist_ids?.map(String) ?? undefined,
    bookingHistory: p?.booking_history_ids?.length ? [...p.booking_history_ids] : undefined,
    measurements: p?.measurements?.trim() ? p.measurements.trim() : undefined,
    collaborationPreferences: p?.collaboration_preferences?.trim()
      ? p.collaboration_preferences.trim()
      : undefined,
    portfolioImageUrls: p?.portfolio_image_urls?.length ? [...p.portfolio_image_urls] : undefined,
    portfolioVideoUrls: p?.portfolio_video_urls?.length ? [...p.portfolio_video_urls] : undefined,
    portfolioItems,
    castingRequests,
    isPublicProfile: row.is_public_profile,
    createdAt: row.created_at,
    accountStatus: (row.account_status as AccountStatus | undefined) ?? "active",
    artistVerificationStatus: (row.artist_verification_status as ArtistVerificationStatus | undefined) ?? "none",
    artistVerificationNote: row.artist_verification_note?.trim() || undefined,
    emailVerifiedAt: row.email_verified_at ?? undefined,
    lastLoginAt: row.last_login_at ?? undefined,
    authLoginEmail: row.auth_login_email?.trim() || undefined,
  };
}

const userSelect = `
  id,
  username,
  auth_login_email,
  phone_number,
  role,
  is_public_profile,
  contact_email,
  created_at,
  account_status,
  artist_verification_status,
  artist_verification_note,
  email_verified_at,
  last_login_at,
  profiles (*),
  artist_portfolios (*)
`;

const principalSelect =
  "id, username, role, account_status, phone_number, is_public_profile, auth_login_email, contact_email, created_at";

function mapPrincipalRow(row: {
  id: string;
  username: string;
  role: string;
  account_status?: string | null;
  phone_number: string;
  is_public_profile: boolean;
  auth_login_email?: string | null;
  contact_email?: string | null;
  created_at?: string;
}): AppUserPrincipal {
  return {
    id: row.id,
    username: row.username,
    role: row.role as UserRole,
    accountStatus: (row.account_status as AccountStatus | undefined) ?? "active",
    phoneNumber: row.phone_number,
    isPublicProfile: row.is_public_profile,
    authLoginEmail: row.auth_login_email?.trim() || undefined,
    contactEmail: row.contact_email?.trim() || undefined,
    createdAt: row.created_at,
  };
}

/** Lightweight `public.users` read for auth / middleware (no joins). */
export async function fetchAppUserPrincipalById(
  supabase: SupabaseClient,
  userId: string,
): Promise<AppUserPrincipal | null> {
  const authRow = await fetchDbAuthRow(supabase, userId);
  if (!authRow.row || authRow.row.id !== userId) return null;

  const { data, error } = await supabase
    .from("users")
    .select(principalSelect)
    .eq("id", userId)
    .maybeSingle();

  if (data && !error) {
    return mapPrincipalRow({
      ...data,
      role: authRow.row.role,
      account_status: authRow.row.account_status,
    });
  }

  return {
    id: authRow.row.id,
    username: `user-${authRow.row.id.slice(0, 8)}`,
    role: authRow.row.role,
    accountStatus: authRow.row.account_status,
    phoneNumber: "",
    isPublicProfile: false,
  };
}

export async function fetchUserAccountById(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserAccount | null> {
  const principal = await fetchAppUserPrincipalById(supabase, userId);
  if (!principal) return null;

  const { data, error } = await supabase
    .from("users")
    .select(userSelect)
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return accountFromPrincipal(principal);
  }

  const full = mapUserDbRowToAccount(data as UserDbRow);
  return {
    ...full,
    role: principal.role,
    accountStatus: principal.accountStatus,
  };
}

export async function fetchUserByUsername(
  supabase: SupabaseClient,
  username: string,
): Promise<UserAccount | null> {
  const { data, error } = await supabase
    .from("users")
    .select(userSelect)
    .ilike("username", username.trim())
    .maybeSingle();
  if (error || !data) return null;
  return mapUserDbRowToAccount(data as UserDbRow);
}

export async function listPublicMakeupArtists(supabase: SupabaseClient): Promise<UserAccount[]> {
  const { data, error } = await supabase
    .from("users")
    .select(userSelect)
    .eq("role", "makeup_artist")
    .eq("is_public_profile", true)
    .eq("artist_verification_status", "verified")
    .order("username", { ascending: true });
  if (error || !data) return [];
  return (data as UserDbRow[]).map(mapUserDbRowToAccount);
}

export async function listPublicModels(supabase: SupabaseClient): Promise<UserAccount[]> {
  const { data, error } = await supabase
    .from("users")
    .select(userSelect)
    .eq("role", "model")
    .eq("is_public_profile", true)
    .order("username", { ascending: true });
  if (error || !data) return [];
  return (data as UserDbRow[]).map(mapUserDbRowToAccount);
}

export async function listAllUsersForAdmin(supabase: SupabaseClient): Promise<UserAccount[]> {
  const { data, error } = await supabase.from("users").select(userSelect).order("created_at", {
    ascending: false,
  });
  if (error || !data) return [];
  return (data as UserDbRow[]).map(mapUserDbRowToAccount);
}

/** Uses security-definer RPC so anon users can validate before signUp (not subject to users RLS). */
export async function checkUsernameAvailable(supabase: SupabaseClient, username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("signup_is_username_available", {
    p_username: username.trim(),
  });
  if (error) return false;
  return Boolean(data);
}

/** Uses security-definer RPC (consistent with signup; avoids RLS false negatives). */
export async function checkPhoneAvailable(
  supabase: SupabaseClient,
  phone: string,
  excludeUserId?: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("signup_is_phone_available", {
    p_phone: phone,
    p_exclude_user_id: excludeUserId ?? null,
  });
  if (error) return false;
  return Boolean(data);
}

function mapSupabaseAuthError(error: { message?: string; name?: string; code?: string }): string {
  const code = String(error.code ?? "").toLowerCase();
  if (code === "user_already_exists") return "authMessages.emailExists";
  if (code === "weak_password") return "authMessages.weakPassword";
  if (code === "email_address_invalid" || code === "invalid_email") return "authMessages.invalidEmail";

  const raw = (error.message ?? "").toLowerCase();
  if (
    raw.includes("already registered") ||
    raw.includes("user already registered") ||
    raw.includes("email address is already") ||
    raw.includes("already been registered")
  ) {
    return "authMessages.emailExists";
  }
  if (
    raw.includes("invalid email") ||
    raw.includes("unable to validate email") ||
    raw.includes("email format")
  ) {
    return "authMessages.invalidEmail";
  }
  if (
    raw.includes("password") &&
    (raw.includes("least 6") ||
      raw.includes("at least 6") ||
      raw.includes("too weak") ||
      raw.includes("password should be") ||
      raw.includes("longer"))
  ) {
    return "authMessages.weakPassword";
  }
  const msg = error.message ?? "";
  if (
    error.name === "AuthRetryableFetchError" ||
    msg.toLowerCase().includes("fetch") ||
    msg.toLowerCase().includes("network") ||
    msg.toLowerCase().includes("failed to fetch")
  ) {
    return "authMessages.networkError";
  }
  if (code === "invalid_credentials") return "authMessages.invalidCredential";
  return "authMessages.invalidCredential";
}

export async function fetchUsernameMap(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (!unique.length) return new Map();
  const { data, error } = await supabase.from("users").select("id,username").in("id", unique);
  if (error || !data) return new Map();
  return new Map(data.map((r: { id: string; username: string }) => [r.id, r.username]));
}

export async function signUpWithMetadata(
  supabase: SupabaseClient,
  payload: SignupPayload,
): Promise<{ ok: boolean; messageKey: string }> {
  if (payload.role === "admin") {
    return { ok: false, messageKey: "authMessages.adminSignupNotAllowed" };
  }

  const email = payload.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, messageKey: "authMessages.invalidEmail" };
  }

  const { data: usernameAvailable, error: usernameRpcError } = await supabase.rpc("signup_is_username_available", {
    p_username: payload.username.trim(),
  });
  if (usernameRpcError) return { ok: false, messageKey: "authMessages.networkError" };
  if (!usernameAvailable) return { ok: false, messageKey: "authMessages.usernameExists" };

  const { data: phoneAvailable, error: phoneRpcError } = await supabase.rpc("signup_is_phone_available", {
    p_phone: payload.phoneNumber,
    p_exclude_user_id: null,
  });
  if (phoneRpcError) return { ok: false, messageKey: "authMessages.networkError" };
  if (!phoneAvailable) return { ok: false, messageKey: "authMessages.phoneExists" };

  const normalizedPhone = payload.phoneNumber.replace(/\s+/g, "");

  const { error } = await supabase.auth.signUp({
    email,
    password: payload.password,
    options: {
      data: {
        username: payload.username.trim(),
        phone_number: normalizedPhone,
        role: payload.role,
        contact_email: email,
      },
    },
  });

  if (error) {
    return { ok: false, messageKey: mapSupabaseAuthError(error) };
  }

  return { ok: true, messageKey: "authMessages.accountCreated" };
}

export async function signInWithEmail(
  supabase: SupabaseClient,
  email: string,
  password: string,
): Promise<{ ok: boolean; messageKey: string }> {
  const norm = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm)) {
    return { ok: false, messageKey: "authMessages.invalidEmail" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: norm,
    password,
  });
  if (error) return { ok: false, messageKey: mapSupabaseAuthError(error) };
  return { ok: true, messageKey: "authMessages.loginSuccess" };
}

export async function syncArtistPortfolioTable(
  supabase: SupabaseClient,
  userId: string,
  items: PortfolioItem[],
): Promise<void> {
  await supabase.from("artist_portfolios").delete().eq("user_id", userId);
  if (!items.length) return;
  const rows = items.map((it, index) => ({
    user_id: userId,
    url: it.url,
    kind: it.kind,
    album: it.album ?? null,
    style_tag: it.styleTag ?? null,
    package_name: it.packageName ?? null,
    sort_order: index,
  }));
  const { error } = await supabase.from("artist_portfolios").insert(rows);
  if (error) throw error;
}

export async function updateAuthenticatedProfile(
  supabase: SupabaseClient,
  userId: string,
  partial: Partial<UserAccount>,
): Promise<{ ok: boolean; messageKey: string }> {
  const userPatch: Record<string, unknown> = {};
  if (partial.username !== undefined) userPatch.username = partial.username.trim();
  if (partial.phoneNumber !== undefined) userPatch.phone_number = partial.phoneNumber.trim();
  if (partial.email !== undefined) {
    userPatch.contact_email = partial.email.trim() ? partial.email.trim() : null;
  }
  if (partial.role !== undefined) userPatch.role = partial.role;
  if (partial.isPublicProfile !== undefined) userPatch.is_public_profile = partial.isPublicProfile;

  if (Object.keys(userPatch).length > 0) {
    const { error } = await supabase.from("users").update(userPatch).eq("id", userId);
    if (error) {
      if (error.code === "23505") return { ok: false, messageKey: "authMessages.usernameExists" };
      return { ok: false, messageKey: "authMessages.phoneExists" };
    }
  }

  const profilePatch: Record<string, unknown> = {};
  if (partial.displayName !== undefined) profilePatch.display_name = partial.displayName.trim() || null;
  if (partial.bio !== undefined) profilePatch.bio = partial.bio.trim() || null;
  if (partial.avatarUrl !== undefined) profilePatch.avatar_url = partial.avatarUrl.trim() || null;
  if (partial.latitude !== undefined) profilePatch.latitude = partial.latitude ?? null;
  if (partial.longitude !== undefined) profilePatch.longitude = partial.longitude ?? null;
  if (partial.location !== undefined) profilePatch.location = partial.location.trim() || null;
  if (partial.serviceAreaDistrictKeys !== undefined) {
    profilePatch.service_area_district_keys = partial.serviceAreaDistrictKeys;
  }
  if (partial.studioAddress !== undefined) profilePatch.studio_address = partial.studioAddress.trim() || null;
  if (partial.specialties !== undefined) profilePatch.specialties = partial.specialties ?? [];
  if (partial.pricing !== undefined) profilePatch.pricing = partial.pricing.trim() || null;
  if (partial.servicePackages !== undefined) profilePatch.service_packages = partial.servicePackages ?? [];
  if (partial.cosmeticBrands !== undefined) profilePatch.cosmetic_brands = partial.cosmeticBrands ?? [];
  if (partial.rating !== undefined) profilePatch.rating = partial.rating ?? null;
  if (partial.reviews !== undefined) profilePatch.reviews = partial.reviews ?? 0;
  if (partial.favoriteArtistIds !== undefined) {
    profilePatch.favorite_artist_ids = partial.favoriteArtistIds.map((x) => x);
  }
  if (partial.bookingHistory !== undefined) {
    profilePatch.booking_history_ids = partial.bookingHistory;
  }
  if (partial.measurements !== undefined) profilePatch.measurements = partial.measurements.trim() || null;
  if (partial.collaborationPreferences !== undefined) {
    profilePatch.collaboration_preferences = partial.collaborationPreferences.trim() || null;
  }
  if (partial.portfolioImageUrls !== undefined) {
    profilePatch.portfolio_image_urls = partial.portfolioImageUrls ?? [];
  }
  if (partial.portfolioVideoUrls !== undefined) {
    profilePatch.portfolio_video_urls = partial.portfolioVideoUrls ?? [];
  }
  if (partial.portfolioItems !== undefined) {
    profilePatch.portfolio_items = partial.portfolioItems ?? [];
  }
  if (partial.castingRequests !== undefined) {
    profilePatch.casting_requests = partial.castingRequests ?? [];
  }

  if (Object.keys(profilePatch).length > 0) {
    const { error } = await supabase.from("profiles").update(profilePatch).eq("user_id", userId);
    if (error) return { ok: false, messageKey: "authMessages.userNotFound" };
  }

  if (partial.portfolioItems !== undefined) {
    const { data: urow } = await supabase.from("users").select("role").eq("id", userId).single();
    if (urow?.role === "makeup_artist") {
      await syncArtistPortfolioTable(supabase, userId, partial.portfolioItems ?? []);
    }
  }

  return { ok: true, messageKey: "authMessages.profileUpdated" };
}
