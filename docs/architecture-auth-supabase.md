# Authentication architecture — localStorage → Supabase

## Previous architecture (mock)

- **Storage**: `lib/auth-storage.ts` read/wrote `glamora_users_v1` and `glamora_session_user_id` in `localStorage`.
- **Credentials**: SHA-256 of password stored on each `UserAccount`; “login” compared hash and stored user id in `localStorage`.
- **Session**: No server session; refresh or new tab relied on the same `localStorage` session id.
- **Bookings**: `lib/booking-storage.ts` used `glamora_bookings_v1` in `localStorage` and patched `bookingHistory` on users via `getUsers()` / `saveUsers()`.
- **Admin**: In-memory checks on the same user array; password reset rewrote the SHA-256 hash in `localStorage`.

## Target architecture (Supabase)

- **Identity**: Supabase Auth (`auth.users`) owns passwords, refresh tokens, and email used for Auth API (`auth_login_email` on `public.users`, opaque `*@auth.glamora.internal` at signup).
- **Directory**: `public.users` (id = `auth.users.id`) holds `username`, `role`, `phone_number`, `auth_login_email`, `is_public_profile`, `contact_email`.
- **Profile payload**: `public.profiles` holds display fields, JSON arrays, ratings, legacy `portfolio_items` JSON; **`public.artist_portfolios`** is the normalized portfolio table (synced on profile save for artists).
- **Bookings**: `public.bookings` with RLS so customers, artists, models, and admins only see rows they participate in.
- **Session**: `@supabase/ssr` + `middleware.ts` refreshes the session cookie on each request; `AuthProvider` subscribes to `onAuthStateChange` and loads `users` + `profiles` (+ portfolio rows) into the existing `UserAccount` shape for the UI.
- **Admin**: Browser updates `users` / `profiles` under RLS when `role = admin`; **user delete** and **password reset** use Route Handlers with `SUPABASE_SERVICE_ROLE_KEY` (server-only) because they require Auth Admin API.
- **Mobile-ready**: Same Supabase project and JWT; native apps use `supabase-js` with the anon key + PKCE / deep links; RLS stays the source of truth.

## Environment variables

| Variable | Scope | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Browser + server user-scoped client |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Admin delete user, admin password reset |

## Migration notes

1. Run SQL in `supabase/migrations/` in the Supabase SQL editor (or CLI).
2. Disable “Confirm email” for local dev or confirm signups via email.
3. Create the first admin in Dashboard → Authentication → Users, then set `users.role = 'admin'` for that id in SQL (or use SQL seed snippet in migration comments).
