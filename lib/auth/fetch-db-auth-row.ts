import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountStatus, UserRole } from "@/lib/auth-types";

export type DbAuthRow = {
  id: string;
  role: UserRole;
  account_status: AccountStatus;
};

export type FetchDbAuthRowResult = {
  row: DbAuthRow | null;
  source: "users_select" | "rpc_get_my_app_user" | null;
  error: string | null;
};

function mapRow(
  id: string,
  role: string,
  accountStatus: string | null | undefined,
): DbAuthRow {
  return {
    id,
    role: role as UserRole,
    account_status: (accountStatus as AccountStatus | undefined) ?? "active",
  };
}

/**
 * Load role + account_status from public.users for auth.uid() / user id.
 * Uses table select first, then security-definer RPC fallback for production RLS edge cases.
 */
export async function fetchDbAuthRow(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<FetchDbAuthRowResult> {
  const { data, error } = await supabase
    .from("users")
    .select("id, role, account_status")
    .eq("id", authUserId)
    .maybeSingle();

  if (data && !error) {
    return {
      row: mapRow(data.id, data.role, data.account_status),
      source: "users_select",
      error: null,
    };
  }

  const selectError = error?.message ?? null;

  const { data: rpcRaw, error: rpcError } = await supabase.rpc("get_my_app_user");

  if (!rpcError && rpcRaw && typeof rpcRaw === "object") {
    const o = rpcRaw as Record<string, unknown>;
    if (typeof o.id === "string" && typeof o.role === "string") {
      return {
        row: mapRow(o.id, o.role, (o.account_status as string | null) ?? "active"),
        source: "rpc_get_my_app_user",
        error: null,
      };
    }
  }

  return {
    row: null,
    source: null,
    error: selectError ?? rpcError?.message ?? "users row not found",
  };
}
