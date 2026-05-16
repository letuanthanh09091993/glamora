"use client";

import { getPasswordResetRedirectUrl } from "@/lib/site-url";
import { getBrowserSupabase } from "@/lib/supabase/browser-client";

export async function resendSignupVerificationEmail(): Promise<{ ok: boolean; messageKey: string }> {
  const sb = getBrowserSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user?.email) return { ok: false, messageKey: "authMessages.noAuthenticatedUser" };
  const { error } = await sb.auth.resend({
    type: "signup",
    email: user.email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) return { ok: false, messageKey: "authMessages.networkError" };
  return { ok: true, messageKey: "authVerify.resendSuccess" };
}

export async function requestPasswordResetEmail(email: string): Promise<{ ok: boolean; messageKey: string }> {
  const norm = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm)) {
    return { ok: false, messageKey: "authMessages.invalidEmail" };
  }
  const sb = getBrowserSupabase();
  const { error } = await sb.auth.resetPasswordForEmail(norm, {
    redirectTo: getPasswordResetRedirectUrl(),
  });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("rate") || m.includes("limit")) return { ok: false, messageKey: "authForgot.rateLimited" };
    return { ok: false, messageKey: "authMessages.networkError" };
  }
  return { ok: true, messageKey: "authForgot.emailSent" };
}

export async function updatePasswordAfterRecovery(newPassword: string): Promise<{ ok: boolean; messageKey: string }> {
  const trimmed = newPassword.trim();
  if (trimmed.length < 6) return { ok: false, messageKey: "authMessages.weakPassword" };
  const sb = getBrowserSupabase();
  await sb.auth.initialize();
  const {
    data: { session },
    error: sessionError,
  } = await sb.auth.getSession();
  if (sessionError || !session?.user) {
    return { ok: false, messageKey: "authReset.invalidSession" };
  }
  const { error } = await sb.auth.updateUser({ password: trimmed });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("session") || m.includes("jwt")) return { ok: false, messageKey: "authReset.invalidSession" };
    if (m.includes("password")) return { ok: false, messageKey: "authMessages.weakPassword" };
    return { ok: false, messageKey: "authMessages.networkError" };
  }
  return { ok: true, messageKey: "authReset.success" };
}
