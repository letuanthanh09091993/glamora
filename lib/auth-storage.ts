"use client";

import type {
  AccountStatus,
  ArtistVerificationStatus,
  SignupPayload,
  UserAccount,
} from "@/lib/auth-types";
import { USER_ROLES } from "@/lib/auth-types";
import { getBrowserSupabase } from "@/lib/supabase/browser-client";
import {
  checkPhoneAvailable,
  fetchUserAccountById,
  fetchUserByUsername,
  listAllUsersForAdmin,
  listPublicMakeupArtists as queryPublicMakeupArtists,
  listPublicModels as queryPublicModels,
  signInWithEmail,
  signUpWithMetadata,
  updateAuthenticatedProfile,
} from "@/lib/supabase/users-repository";

export async function getUsers(): Promise<UserAccount[]> {
  return listAllUsersForAdmin(getBrowserSupabase());
}

export async function getCurrentUser(): Promise<UserAccount | null> {
  const sb = getBrowserSupabase();
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session?.user) return null;
  return fetchUserAccountById(sb, session.user.id);
}

export async function updateCurrentUser(
  partial: Partial<UserAccount>,
): Promise<{ ok: boolean; messageKey: string }> {
  const sb = getBrowserSupabase();
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session?.user) return { ok: false, messageKey: "authMessages.noAuthenticatedUser" };

  if (partial.phoneNumber !== undefined) {
    const ok = await checkPhoneAvailable(sb, partial.phoneNumber, session.user.id);
    if (!ok) return { ok: false, messageKey: "authMessages.phoneExists" };
  }

  if (partial.email !== undefined) {
    const raw = partial.email.trim();
    if (raw) {
      const norm = raw.toLowerCase();
      const { data: conflict } = await sb
        .from("users")
        .select("id")
        .ilike("contact_email", norm)
        .neq("id", session.user.id)
        .maybeSingle();
      if (conflict) return { ok: false, messageKey: "authMessages.emailExists" };
    }
  }

  return updateAuthenticatedProfile(sb, session.user.id, partial);
}

export async function getUserByUsername(username: string): Promise<UserAccount | null> {
  return fetchUserByUsername(getBrowserSupabase(), username);
}

export async function listPublicMakeupArtists(): Promise<UserAccount[]> {
  return queryPublicMakeupArtists(getBrowserSupabase());
}

export async function listPublicModels(): Promise<UserAccount[]> {
  return queryPublicModels(getBrowserSupabase());
}

export async function signUp(payload: SignupPayload): Promise<{ ok: boolean; messageKey: string }> {
  return signUpWithMetadata(getBrowserSupabase(), payload);
}

export async function login(email: string, password: string): Promise<{ ok: boolean; messageKey: string }> {
  return signInWithEmail(getBrowserSupabase(), email, password);
}

export async function logout(): Promise<void> {
  const sb = getBrowserSupabase();
  await sb.auth.signOut();
}

export type AdminUserPatch = Partial<
  Pick<
    UserAccount,
    | "username"
    | "phoneNumber"
    | "email"
    | "displayName"
    | "role"
    | "isPublicProfile"
    | "accountStatus"
    | "artistVerificationStatus"
    | "artistVerificationNote"
  >
>;

export async function adminUpdateUserAccount(
  actorId: string,
  targetId: string,
  patch: AdminUserPatch,
): Promise<{ ok: boolean; messageKey: string }> {
  const sb = getBrowserSupabase();
  const actor = await fetchUserAccountById(sb, actorId);
  if (!actor || actor.role !== "admin") return { ok: false, messageKey: "authMessages.adminForbidden" };

  const target = await fetchUserAccountById(sb, targetId);
  if (!target) return { ok: false, messageKey: "authMessages.adminTargetNotFound" };

  if (patch.role !== undefined && !(USER_ROLES as readonly string[]).includes(patch.role)) {
    return { ok: false, messageKey: "authMessages.adminInvalidRole" };
  }

  if (patch.role !== undefined && patch.role !== "admin" && target.role === "admin") {
    const all = await listAllUsersForAdmin(sb);
    const adminCount = all.filter((u) => u.role === "admin").length;
    if (adminCount <= 1) return { ok: false, messageKey: "authMessages.adminLastAdminRole" };
  }

  if (patch.username !== undefined) {
    const norm = patch.username.trim().toLowerCase();
    if (norm.length < 2) return { ok: false, messageKey: "authMessages.adminUsernameInvalid" };
    const { data: conflict } = await sb
      .from("users")
      .select("id")
      .ilike("username", patch.username.trim())
      .neq("id", targetId)
      .maybeSingle();
    if (conflict) return { ok: false, messageKey: "authMessages.usernameExists" };
  }

  if (patch.phoneNumber !== undefined) {
    const ok = await checkPhoneAvailable(sb, patch.phoneNumber, targetId);
    if (!ok) return { ok: false, messageKey: "authMessages.phoneExists" };
  }

  if (patch.email !== undefined) {
    const raw = patch.email.trim();
    if (raw) {
      const norm = raw.toLowerCase();
      const { data: conflict } = await sb
        .from("users")
        .select("id")
        .ilike("contact_email", norm)
        .neq("id", targetId)
        .maybeSingle();
      if (conflict) return { ok: false, messageKey: "authMessages.emailExists" };
    }
  }

  if (patch.accountStatus !== undefined) {
    const s = patch.accountStatus;
    if (s !== "active" && s !== "suspended") {
      return { ok: false, messageKey: "authMessages.adminForbidden" };
    }
  }

  if (patch.artistVerificationStatus !== undefined) {
    const st = patch.artistVerificationStatus;
    const allowed: ArtistVerificationStatus[] = ["none", "pending", "verified", "rejected"];
    if (!allowed.includes(st)) return { ok: false, messageKey: "authMessages.adminForbidden" };
    const effectiveRole = patch.role ?? target.role;
    if (effectiveRole !== "makeup_artist" && st !== "none") {
      return { ok: false, messageKey: "authMessages.adminVerificationArtistOnly" };
    }
  }

  const userPatch: Record<string, unknown> = {};
  if (patch.username !== undefined) userPatch.username = patch.username.trim();
  if (patch.phoneNumber !== undefined) userPatch.phone_number = patch.phoneNumber.trim();
  if (patch.email !== undefined) userPatch.contact_email = patch.email.trim() ? patch.email.trim() : null;
  if (patch.role !== undefined) userPatch.role = patch.role;
  if (patch.isPublicProfile !== undefined) userPatch.is_public_profile = patch.isPublicProfile;
  if (patch.accountStatus !== undefined) userPatch.account_status = patch.accountStatus as AccountStatus;
  if (patch.artistVerificationStatus !== undefined) {
    userPatch.artist_verification_status = patch.artistVerificationStatus;
  }
  if (patch.artistVerificationNote !== undefined) {
    userPatch.artist_verification_note = patch.artistVerificationNote.trim().slice(0, 2000) || null;
  }

  if (Object.keys(userPatch).length > 0) {
    const { error } = await sb.from("users").update(userPatch).eq("id", targetId);
    if (error) return { ok: false, messageKey: "authMessages.adminTargetNotFound" };
  }

  if (patch.displayName !== undefined) {
    const { error } = await sb
      .from("profiles")
      .update({ display_name: patch.displayName.trim() || null })
      .eq("user_id", targetId);
    if (error) return { ok: false, messageKey: "authMessages.adminTargetNotFound" };
  }

  return { ok: true, messageKey: "authMessages.adminUserUpdated" };
}

export async function adminDeleteUser(actorId: string, targetId: string): Promise<{ ok: boolean; messageKey: string }> {
  if (actorId === targetId) return { ok: false, messageKey: "authMessages.adminCannotDeleteSelf" };

  const sb = getBrowserSupabase();
  const actor = await fetchUserAccountById(sb, actorId);
  if (!actor || actor.role !== "admin") return { ok: false, messageKey: "authMessages.adminForbidden" };

  const target = await fetchUserAccountById(sb, targetId);
  if (!target) return { ok: false, messageKey: "authMessages.adminTargetNotFound" };

  if (target.role === "admin") {
    const all = await listAllUsersForAdmin(sb);
    const adminCount = all.filter((u) => u.role === "admin").length;
    if (adminCount <= 1) return { ok: false, messageKey: "authMessages.adminCannotDeleteLastAdmin" };
  }

  const res = await fetch(`/api/admin/users/${encodeURIComponent(targetId)}`, { method: "DELETE" });
  if (!res.ok) return { ok: false, messageKey: "authMessages.adminForbidden" };
  return { ok: true, messageKey: "authMessages.adminUserDeleted" };
}

export async function adminSetUserPassword(
  actorId: string,
  targetId: string,
  plainPassword: string,
): Promise<{ ok: boolean; messageKey: string }> {
  const trimmed = plainPassword.trim();
  if (trimmed.length < 6) return { ok: false, messageKey: "authMessages.adminPasswordTooShort" };

  const sb = getBrowserSupabase();
  const actor = await fetchUserAccountById(sb, actorId);
  if (!actor || actor.role !== "admin") return { ok: false, messageKey: "authMessages.adminForbidden" };

  const res = await fetch("/api/admin/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId: targetId, password: trimmed }),
  });
  if (!res.ok) return { ok: false, messageKey: "authMessages.adminForbidden" };
  return { ok: true, messageKey: "authMessages.adminPasswordResetSuccess" };
}
