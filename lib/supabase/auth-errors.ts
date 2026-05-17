/** Maps Supabase Auth errors to i18n message keys. */
export function mapSupabaseAuthError(error: {
  message?: string;
  name?: string;
  code?: string;
}): string {
  const code = String(error.code ?? "").toLowerCase();
  if (code === "user_already_exists") return "authMessages.emailExists";
  if (code === "weak_password") return "authMessages.weakPassword";
  if (code === "email_address_invalid" || code === "invalid_email") return "authMessages.invalidEmail";
  if (code === "invalid_credentials") return "authMessages.invalidCredential";

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
    raw.includes("invalid login") ||
    raw.includes("invalid credentials") ||
    raw.includes("wrong password")
  ) {
    return "authMessages.invalidCredential";
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
    msg.toLowerCase().includes("network")
  ) {
    return "authMessages.networkError";
  }

  return "authMessages.networkError";
}
