"use client";

import { SignupPayload, UserAccount, USER_ROLES } from "@/lib/auth-types";

const USERS_KEY = "glamora_users_v1";
const SESSION_KEY = "glamora_session_user_id";

/** SHA-256 of `admin123` — default local demo admin password (change after first login in production). */
const SEED_ADMIN_PASSWORD_HASH =
  "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";
const SEED_ADMIN_ID = "00000000-0000-4000-8000-000000000001";
const SEED_ADMIN_USERNAME = "glamora_admin";

function buildSeedAdmin(): UserAccount {
  return {
    id: SEED_ADMIN_ID,
    username: SEED_ADMIN_USERNAME,
    password: SEED_ADMIN_PASSWORD_HASH,
    phoneNumber: "0900000001",
    role: "admin",
    isPublicProfile: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function ensureSeededAdmin(users: UserAccount[]): UserAccount[] {
  const hasAdminRole = users.some((u) => u.role === "admin");
  const usernameTaken = users.some(
    (u) => u.username.trim().toLowerCase() === SEED_ADMIN_USERNAME.toLowerCase(),
  );
  if (hasAdminRole || usernameTaken) return users;
  const next = [...users, buildSeedAdmin()];
  window.localStorage.setItem(USERS_KEY, JSON.stringify(next));
  return next;
}

export function getUsers(): UserAccount[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(USERS_KEY);
  let users: UserAccount[] = [];
  if (raw) {
    try {
      users = JSON.parse(raw) as UserAccount[];
    } catch {
      users = [];
    }
  }
  return ensureSeededAdmin(users);
}

export function saveUsers(users: UserAccount[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function sanitizePhone(phone: string) {
  return phone.replace(/\s+/g, "");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function hashPassword(value: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signUp(
  payload: SignupPayload,
): Promise<{ ok: boolean; messageKey: string }> {
  if (payload.role === "admin") {
    return { ok: false, messageKey: "authMessages.adminSignupNotAllowed" };
  }

  const users = getUsers();
  const normalizedUsername = payload.username.trim().toLowerCase();
  const normalizedPhone = sanitizePhone(payload.phoneNumber);

  const usernameExists = users.some(
    (u) => u.username.trim().toLowerCase() === normalizedUsername,
  );
  if (usernameExists) return { ok: false, messageKey: "authMessages.usernameExists" };

  const phoneExists = users.some(
    (u) => sanitizePhone(u.phoneNumber) === normalizedPhone,
  );
  if (phoneExists) return { ok: false, messageKey: "authMessages.phoneExists" };

  const passwordHash = await hashPassword(payload.password);
  const nextUser: UserAccount = {
    id: crypto.randomUUID(),
    username: payload.username.trim(),
    password: passwordHash,
    phoneNumber: payload.phoneNumber.trim(),
    role: payload.role,
    rating: payload.role === "makeup_artist" ? 4.9 : undefined,
    reviews: payload.role === "makeup_artist" ? 0 : undefined,
    favoriteArtistIds: payload.role === "customer" ? [] : undefined,
    bookingHistory: payload.role === "customer" ? [] : undefined,
    isPublicProfile: true,
    createdAt: new Date().toISOString(),
  };

  users.push(nextUser);
  saveUsers(users);
  return { ok: true, messageKey: "authMessages.accountCreated" };
}

export async function login(username: string, password: string) {
  const users = getUsers();
  const passwordHash = await hashPassword(password);
  const found = users.find(
    (u) => u.username.trim().toLowerCase() === username.trim().toLowerCase(),
  );
  if (!found || found.password !== passwordHash) {
    return { ok: false, messageKey: "authMessages.invalidCredential" };
  }
  window.localStorage.setItem(SESSION_KEY, found.id);
  return { ok: true, messageKey: "authMessages.loginSuccess" };
}

export function logout() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): UserAccount | null {
  const users = getUsers();
  const currentId = window.localStorage.getItem(SESSION_KEY);
  if (!currentId) return null;
  return users.find((u) => u.id === currentId) ?? null;
}

export function updateCurrentUser(
  partial: Partial<UserAccount>,
): { ok: boolean; messageKey: string } {
  const users = getUsers();
  const currentId = window.localStorage.getItem(SESSION_KEY);
  if (!currentId) return { ok: false, messageKey: "authMessages.noAuthenticatedUser" };

  const index = users.findIndex((u) => u.id === currentId);
  if (index === -1) return { ok: false, messageKey: "authMessages.userNotFound" };

  if (partial.phoneNumber !== undefined) {
    const normalizedNew = sanitizePhone(partial.phoneNumber);
    const conflict = users.some(
      (u) =>
        u.id !== currentId && sanitizePhone(u.phoneNumber) === normalizedNew,
    );
    if (conflict) return { ok: false, messageKey: "authMessages.phoneExists" };
  }

  if (partial.email !== undefined) {
    const raw = partial.email.trim();
    if (raw) {
      const norm = normalizeEmail(raw);
      const conflict = users.some(
        (u) =>
          u.id !== currentId &&
          u.email &&
          normalizeEmail(u.email) === norm,
      );
      if (conflict) return { ok: false, messageKey: "authMessages.emailExists" };
    }
  }

  users[index] = { ...users[index], ...partial };
  saveUsers(users);
  return { ok: true, messageKey: "authMessages.profileUpdated" };
}

export function getUserByUsername(username: string): UserAccount | null {
  const users = getUsers();
  const normalized = username.trim().toLowerCase();
  return users.find((u) => u.username.trim().toLowerCase() === normalized) ?? null;
}

export function listPublicMakeupArtists(): UserAccount[] {
  return getUsers().filter((u) => u.role === "makeup_artist" && u.isPublicProfile);
}

export function listPublicModels(): UserAccount[] {
  return getUsers().filter((u) => u.role === "model" && u.isPublicProfile);
}

export type AdminUserPatch = Partial<
  Pick<UserAccount, "username" | "phoneNumber" | "email" | "displayName" | "role" | "isPublicProfile">
>;

function assertAdmin(actorId: string, users: UserAccount[]): UserAccount | null {
  const actor = users.find((u) => u.id === actorId);
  if (!actor || actor.role !== "admin") return null;
  return actor;
}

export function adminUpdateUserAccount(
  actorId: string,
  targetId: string,
  patch: AdminUserPatch,
): { ok: boolean; messageKey: string } {
  const users = getUsers();
  if (!assertAdmin(actorId, users)) return { ok: false, messageKey: "authMessages.adminForbidden" };

  const index = users.findIndex((u) => u.id === targetId);
  if (index === -1) return { ok: false, messageKey: "authMessages.adminTargetNotFound" };

  const current = users[index];

  if (patch.role !== undefined && !(USER_ROLES as readonly string[]).includes(patch.role)) {
    return { ok: false, messageKey: "authMessages.adminInvalidRole" };
  }

  if (patch.role !== undefined && patch.role !== "admin" && current.role === "admin") {
    const adminCount = users.filter((u) => u.role === "admin").length;
    if (adminCount <= 1) return { ok: false, messageKey: "authMessages.adminLastAdminRole" };
  }

  if (patch.username !== undefined) {
    const norm = patch.username.trim().toLowerCase();
    if (norm.length < 2) return { ok: false, messageKey: "authMessages.adminUsernameInvalid" };
    const conflict = users.some(
      (u) => u.id !== targetId && u.username.trim().toLowerCase() === norm,
    );
    if (conflict) return { ok: false, messageKey: "authMessages.usernameExists" };
  }

  if (patch.phoneNumber !== undefined) {
    const normalizedNew = sanitizePhone(patch.phoneNumber);
    const conflict = users.some(
      (u) => u.id !== targetId && sanitizePhone(u.phoneNumber) === normalizedNew,
    );
    if (conflict) return { ok: false, messageKey: "authMessages.phoneExists" };
  }

  if (patch.email !== undefined) {
    const raw = patch.email.trim();
    if (raw) {
      const norm = normalizeEmail(raw);
      const conflict = users.some(
        (u) =>
          u.id !== targetId && u.email && normalizeEmail(u.email) === norm,
      );
      if (conflict) return { ok: false, messageKey: "authMessages.emailExists" };
    }
  }

  const { username, phoneNumber, email, displayName, role, isPublicProfile } = patch;
  users[index] = {
    ...current,
    ...(username !== undefined ? { username: username.trim() } : {}),
    ...(phoneNumber !== undefined ? { phoneNumber: phoneNumber.trim() } : {}),
    ...(email !== undefined ? { email: email.trim() ? email.trim() : undefined } : {}),
    ...(displayName !== undefined
      ? { displayName: displayName.trim() ? displayName.trim() : undefined }
      : {}),
    ...(role !== undefined ? { role } : {}),
    ...(isPublicProfile !== undefined ? { isPublicProfile } : {}),
  };
  saveUsers(users);
  return { ok: true, messageKey: "authMessages.adminUserUpdated" };
}

export function adminDeleteUser(actorId: string, targetId: string): { ok: boolean; messageKey: string } {
  if (actorId === targetId) return { ok: false, messageKey: "authMessages.adminCannotDeleteSelf" };

  const users = getUsers();
  if (!assertAdmin(actorId, users)) return { ok: false, messageKey: "authMessages.adminForbidden" };

  const target = users.find((u) => u.id === targetId);
  if (!target) return { ok: false, messageKey: "authMessages.adminTargetNotFound" };

  if (target.role === "admin") {
    const adminCount = users.filter((u) => u.role === "admin").length;
    if (adminCount <= 1) return { ok: false, messageKey: "authMessages.adminCannotDeleteLastAdmin" };
  }

  const next = users.filter((u) => u.id !== targetId);
  saveUsers(next);

  const sessionId = window.localStorage.getItem(SESSION_KEY);
  if (sessionId === targetId) {
    window.localStorage.removeItem(SESSION_KEY);
  }

  return { ok: true, messageKey: "authMessages.adminUserDeleted" };
}

/** Set a new password hash for `targetId` (e.g. user forgot password). Admin-only. */
export async function adminSetUserPassword(
  actorId: string,
  targetId: string,
  plainPassword: string,
): Promise<{ ok: boolean; messageKey: string }> {
  const trimmed = plainPassword.trim();
  if (trimmed.length < 6) return { ok: false, messageKey: "authMessages.adminPasswordTooShort" };

  const users = getUsers();
  if (!assertAdmin(actorId, users)) return { ok: false, messageKey: "authMessages.adminForbidden" };

  const index = users.findIndex((u) => u.id === targetId);
  if (index === -1) return { ok: false, messageKey: "authMessages.adminTargetNotFound" };

  const hash = await hashPassword(trimmed);
  users[index] = { ...users[index], password: hash };
  saveUsers(users);
  return { ok: true, messageKey: "authMessages.adminPasswordResetSuccess" };
}
