"use client";

import { SignupPayload, UserAccount } from "@/lib/auth-types";

const USERS_KEY = "glamora_users_v1";
const SESSION_KEY = "glamora_session_user_id";

function getUsers(): UserAccount[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(USERS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as UserAccount[];
  } catch {
    return [];
  }
}

function saveUsers(users: UserAccount[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function sanitizePhone(phone: string) {
  return phone.replace(/\s+/g, "");
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
): Promise<{ ok: boolean; message: string }> {
  const users = getUsers();
  const normalizedUsername = payload.username.trim().toLowerCase();
  const normalizedPhone = sanitizePhone(payload.phoneNumber);

  const usernameExists = users.some(
    (u) => u.username.trim().toLowerCase() === normalizedUsername,
  );
  if (usernameExists) return { ok: false, message: "Username already exists." };

  const phoneExists = users.some(
    (u) => sanitizePhone(u.phoneNumber) === normalizedPhone,
  );
  if (phoneExists) return { ok: false, message: "Phone number already exists." };

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
  };

  users.push(nextUser);
  saveUsers(users);
  window.localStorage.setItem(SESSION_KEY, nextUser.id);
  return { ok: true, message: "Account created successfully." };
}

export async function login(username: string, password: string) {
  const users = getUsers();
  const passwordHash = await hashPassword(password);
  const found = users.find(
    (u) => u.username.trim().toLowerCase() === username.trim().toLowerCase(),
  );
  if (!found || found.password !== passwordHash) {
    return { ok: false, message: "Invalid username or password." };
  }
  window.localStorage.setItem(SESSION_KEY, found.id);
  return { ok: true, message: "Login successful." };
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
): { ok: boolean; message: string } {
  const users = getUsers();
  const currentId = window.localStorage.getItem(SESSION_KEY);
  if (!currentId) return { ok: false, message: "No authenticated user." };

  const index = users.findIndex((u) => u.id === currentId);
  if (index === -1) return { ok: false, message: "User not found." };

  users[index] = { ...users[index], ...partial };
  saveUsers(users);
  return { ok: true, message: "Profile updated successfully." };
}

export function getUserByUsername(username: string): UserAccount | null {
  const users = getUsers();
  const normalized = username.trim().toLowerCase();
  return users.find((u) => u.username.trim().toLowerCase() === normalized) ?? null;
}
