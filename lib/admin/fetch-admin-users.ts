import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountStatus, UserRole } from "@/lib/auth-types";
import { USER_ROLES } from "@/lib/auth-types";

export const ADMIN_USERS_PAGE_SIZE = 12;

export type AdminUsersListRow = {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  account_status: AccountStatus;
  created_at: string;
  avatar_url: string | null;
};

type UsersDbRow = {
  id: string;
  username: string;
  role: string;
  account_status: string | null;
  created_at: string;
  auth_login_email: string | null;
  contact_email: string | null;
  profiles: { avatar_url: string | null } | { avatar_url: string | null }[] | null;
};

export type FetchAdminUsersParams = {
  q?: string;
  role?: string;
  page?: number;
  pageSize?: number;
};

export type FetchAdminUsersResult = {
  rows: AdminUsersListRow[];
  total: number;
  page: number;
  pageSize: number;
  error: string | null;
};

function mapRow(row: UsersDbRow): AdminUsersListRow {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const email =
    row.auth_login_email?.trim() ||
    row.contact_email?.trim() ||
    null;

  return {
    id: row.id,
    username: row.username,
    email,
    role: row.role as UserRole,
    account_status: (row.account_status as AccountStatus | null) ?? "active",
    created_at: row.created_at,
    avatar_url: profile?.avatar_url?.trim() || null,
  };
}

export async function fetchAdminUsersList(
  supabase: SupabaseClient,
  params: FetchAdminUsersParams,
): Promise<FetchAdminUsersResult> {
  const pageSize = params.pageSize ?? ADMIN_USERS_PAGE_SIZE;
  const page = Math.max(1, params.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("users")
    .select(
      "id, username, role, account_status, created_at, auth_login_email, contact_email, profiles(avatar_url)",
      { count: "exact" },
    );

  const roleFilter = params.role?.trim();
  if (roleFilter && roleFilter !== "all" && (USER_ROLES as readonly string[]).includes(roleFilter)) {
    query = query.eq("role", roleFilter);
  }

  const q = params.q?.trim();
  if (q) {
    const pattern = `%${q.replace(/%/g, "")}%`;
    query = query.or(
      `username.ilike.${pattern},auth_login_email.ilike.${pattern},contact_email.ilike.${pattern}`,
    );
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return {
      rows: [],
      total: 0,
      page,
      pageSize,
      error: error.message,
    };
  }

  return {
    rows: ((data ?? []) as UsersDbRow[]).map(mapRow),
    total: count ?? 0,
    page,
    pageSize,
    error: null,
  };
}
