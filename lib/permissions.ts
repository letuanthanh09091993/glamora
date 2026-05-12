/**
 * Capability & permission model (forward-looking).
 *
 * v1 storage still uses a single `UserRole` on `UserAccount`.
 * This module bridges legacy roles → permissions so UI and guards can migrate
 * incrementally toward multi-capability accounts without a big-bang rewrite.
 */

import type { UserRole } from "@/lib/auth-types";

/** Fine-grained actions / surfaces (expand over time). */
export type Permission =
  | "canBook"
  | "canUploadPortfolio"
  | "canManageBookings"
  | "canCreateCasting"
  | "canAccessAdmin"
  | "canModerateContent"
  | "canVerifyArtists";

/**
 * High-level capability flags (future: array on user, not exclusive with role).
 * Naming aligned with product direction; map legacy roles for now.
 */
export type Capability = "customer" | "artist" | "model" | "admin";

const ALL_PERMISSIONS: Permission[] = [
  "canBook",
  "canUploadPortfolio",
  "canManageBookings",
  "canCreateCasting",
  "canAccessAdmin",
  "canModerateContent",
  "canVerifyArtists",
];

/** Default capabilities implied by each legacy signup role (until multi-select signup exists). */
export function capabilitiesFromLegacyRole(role: UserRole): Capability[] {
  switch (role) {
    case "customer":
      return ["customer"];
    case "makeup_artist":
      return ["artist"];
    case "model":
      return ["model"];
    case "artist_looking_model":
      return ["artist", "model"];
    default:
      return ["customer"];
  }
}

/** Derive permissions from capabilities (pure; easy to unit-test when backend arrives). */
export function permissionsFromCapabilities(caps: Capability[]): Set<Permission> {
  const out = new Set<Permission>();
  for (const c of caps) {
    if (c === "customer") out.add("canBook");
    if (c === "artist") {
      out.add("canUploadPortfolio");
      out.add("canManageBookings");
    }
    if (c === "model") {
      out.add("canUploadPortfolio");
    }
    if (c === "admin") {
      ALL_PERMISSIONS.forEach((p) => out.add(p));
    }
  }
  if (caps.includes("artist") && caps.includes("model")) {
    out.add("canCreateCasting");
  }
  return out;
}

export function permissionsFromLegacyRole(role: UserRole): Set<Permission> {
  return permissionsFromCapabilities(capabilitiesFromLegacyRole(role));
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return permissionsFromLegacyRole(role).has(permission);
}
