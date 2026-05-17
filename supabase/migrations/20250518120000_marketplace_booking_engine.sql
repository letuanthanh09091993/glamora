-- =============================================================================
-- Glamora Marketplace Upgrade — Booking Engine + Artist Profiles
-- =============================================================================
-- Migration ID : 20250518120000_marketplace_booking_engine
-- Apply via    : Supabase Dashboard → SQL Editor, OR `supabase db push` (manual)
-- DO NOT run automatically from CI without review.
--
-- PREREQUISITES (must already exist from earlier Glamora migrations):
--   • public.users, public.profiles, public.bookings, public.artist_portfolios
--   • public.users.artist_verification_status (20250515120000_auth_admin_security.sql)
--   • Core booking RLS policies (20250513120000_glamora_core.sql)
--
-- SAFETY PRINCIPLES:
--   • ALTER TABLE / CREATE IF NOT EXISTS only — no DROP TABLE, no data truncation
--   • Legacy booking.status values remain valid alongside v2 lifecycle values
--   • Idempotent: safe to re-run sections that use IF NOT EXISTS / IF EXISTS
--   • Rollback notes at end of file (manual reverse steps)
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 0. Extensions (overlap detection for slot locking RPC)
-- ---------------------------------------------------------------------------
create extension if not exists btree_gist with schema extensions;

comment on extension btree_gist is
  'Required for tstzrange overlap in public.booking_has_conflict()';

-- ---------------------------------------------------------------------------
-- 1. BOOKINGS — new marketplace columns (non-destructive)
-- ---------------------------------------------------------------------------
-- Lifecycle is stored as text + CHECK (not a PG enum) so existing rows and
-- app versions keep working while v2 statuses are introduced.

alter table public.bookings
  add column if not exists booking_reference_code text,
  add column if not exists cancellation_reason text,
  add column if not exists artist_response_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists payment_status text,
  add column if not exists total_price numeric(12, 2),
  add column if not exists platform_fee numeric(12, 2),
  add column if not exists currency text,
  add column if not exists service_id uuid,
  add column if not exists timezone text,
  add column if not exists slot_lock_token uuid,
  add column if not exists updated_at timestamptz;

comment on column public.bookings.booking_reference_code is
  'Human-friendly reference (e.g. GL-XXXXXXXX), auto-set on insert/update';
comment on column public.bookings.cancellation_reason is
  'Optional reason when status is cancelled_by_customer or cancelled_by_artist';
comment on column public.bookings.artist_response_at is
  'Timestamp when artist confirmed or rejected the request';
comment on column public.bookings.completed_at is
  'Timestamp when booking reached terminal completed/refunded flow';
comment on column public.bookings.payment_status is
  'unpaid | pending | paid | refunded | failed';
comment on column public.bookings.total_price is
  'Quoted or charged session total in currency';
comment on column public.bookings.platform_fee is
  'Platform commission portion of total_price';
comment on column public.bookings.service_id is
  'Optional FK to public.artist_services (set after catalog migration)';
comment on column public.bookings.timezone is
  'IANA timezone for interpreting start_at/end_at in UI';
comment on column public.bookings.slot_lock_token is
  'Reserved for optimistic / transactional slot locking (future use)';

-- Backfill defaults on existing rows (preserves all current data)
update public.bookings
set payment_status = coalesce(payment_status, 'unpaid')
where payment_status is null;

update public.bookings
set currency = coalesce(currency, 'VND')
where currency is null;

update public.bookings
set timezone = coalesce(timezone, 'Asia/Ho_Chi_Minh')
where timezone is null;

update public.bookings
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

-- Enforce NOT NULL only after backfill (avoids failure on populated tables)
alter table public.bookings
  alter column payment_status set default 'unpaid',
  alter column payment_status set not null;

alter table public.bookings
  alter column currency set default 'VND',
  alter column currency set not null;

alter table public.bookings
  alter column timezone set default 'Asia/Ho_Chi_Minh',
  alter column timezone set not null;

alter table public.bookings
  alter column updated_at set default now(),
  alter column updated_at set not null;

-- ---------------------------------------------------------------------------
-- 1b. BOOKINGS — lifecycle status CHECK (v2 + legacy, data-preserving)
-- ---------------------------------------------------------------------------
-- Existing statuses (unchanged meaning for current rows):
--   pending, confirmed, service_done, awaiting_feedback, completed,
--   declined, cancelled
-- New v2 statuses (app may write these going forward):
--   awaiting_artist_response, rejected,
--   cancelled_by_customer, cancelled_by_artist, refunded

alter table public.bookings
  drop constraint if exists bookings_status_check;

alter table public.bookings
  add constraint bookings_status_check check (
    status in (
      -- v2 marketplace lifecycle
      'pending',
      'awaiting_artist_response',
      'confirmed',
      'rejected',
      'cancelled_by_customer',
      'cancelled_by_artist',
      'completed',
      'refunded',
      -- legacy (retain for existing rows + backward-compatible clients)
      'service_done',
      'awaiting_feedback',
      'declined',
      'cancelled'
    )
  );

comment on constraint bookings_status_check on public.bookings is
  'Booking lifecycle: v2 statuses + legacy statuses for zero-downtime migration';

alter table public.bookings
  drop constraint if exists bookings_payment_status_check;

alter table public.bookings
  add constraint bookings_payment_status_check check (
    payment_status in ('unpaid', 'pending', 'paid', 'refunded', 'failed')
  );

-- Indexes for admin dashboards, artist calendars, and conflict checks
create unique index if not exists bookings_reference_code_uidx
  on public.bookings (booking_reference_code)
  where booking_reference_code is not null;

create index if not exists bookings_status_created_idx
  on public.bookings (status, created_at desc);

create index if not exists bookings_artist_start_idx
  on public.bookings (artist_id, start_at);

create index if not exists bookings_customer_created_idx
  on public.bookings (customer_id, created_at desc);

create index if not exists bookings_active_artist_range_idx
  on public.bookings (artist_id, start_at, end_at)
  where status not in (
    'rejected', 'declined', 'cancelled', 'cancelled_by_customer',
    'cancelled_by_artist', 'refunded'
  );

-- ---------------------------------------------------------------------------
-- 2. BOOKING ACTIVITY — audit trail / moderation support
-- ---------------------------------------------------------------------------
create table if not exists public.booking_activity (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  actor_id uuid references public.users (id) on delete set null,
  actor_role text,
  from_status text,
  to_status text not null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.booking_activity is
  'Immutable-style audit log of booking status transitions and admin notes';

create index if not exists booking_activity_booking_created_idx
  on public.booking_activity (booking_id, created_at desc);

create index if not exists booking_activity_actor_idx
  on public.booking_activity (actor_id, created_at desc)
  where actor_id is not null;

alter table public.booking_activity enable row level security;

drop policy if exists "booking_activity_select_participants" on public.booking_activity;
create policy "booking_activity_select_participants"
  on public.booking_activity for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (
          auth.uid() = b.customer_id
          or auth.uid() = b.artist_id
          or auth.uid() = b.model_id
          or exists (
            select 1 from public.users a
            where a.id = auth.uid() and a.role = 'admin'
          )
        )
    )
  );

drop policy if exists "booking_activity_insert_participants" on public.booking_activity;
create policy "booking_activity_insert_participants"
  on public.booking_activity for insert
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (
          auth.uid() = b.customer_id
          or auth.uid() = b.artist_id
          or auth.uid() = b.model_id
          or exists (
            select 1 from public.users a
            where a.id = auth.uid() and a.role = 'admin'
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 3. ARTIST AVAILABILITY — schedules, blocks, settings
-- ---------------------------------------------------------------------------
create table if not exists public.artist_availability_settings (
  user_id uuid primary key references public.users (id) on delete cascade,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  slot_duration_minutes integer not null default 60
    check (slot_duration_minutes between 15 and 480),
  buffer_minutes integer not null default 15
    check (buffer_minutes between 0 and 120),
  booking_horizon_days integer not null default 60
    check (booking_horizon_days between 1 and 365),
  updated_at timestamptz not null default now()
);

comment on table public.artist_availability_settings is
  'Per-artist slot generation: duration, buffer, timezone, booking window';

create table if not exists public.artist_weekly_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint artist_weekly_schedules_range check (start_time < end_time)
);

comment on table public.artist_weekly_schedules is
  'Recurring weekly availability windows (0=Sunday .. 6=Saturday)';

create index if not exists artist_weekly_schedules_user_day_idx
  on public.artist_weekly_schedules (user_id, day_of_week)
  where is_active = true;

create table if not exists public.artist_availability_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint artist_availability_blocks_range check (start_at < end_at)
);

comment on table public.artist_availability_blocks is
  'Blocked date/time ranges (vacation, personal, maintenance)';

create index if not exists artist_availability_blocks_user_range_idx
  on public.artist_availability_blocks (user_id, start_at, end_at);

-- ---------------------------------------------------------------------------
-- 4. ARTIST SERVICES & PRICING — marketplace catalog
-- ---------------------------------------------------------------------------
create table if not exists public.artist_services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  description text,
  category text,
  duration_minutes integer not null default 60
    check (duration_minutes between 15 and 480),
  price numeric(12, 2) not null default 0 check (price >= 0),
  travel_fee numeric(12, 2) not null default 0 check (travel_fee >= 0),
  currency text not null default 'VND',
  addons jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.artist_services is
  'Structured services: duration, pricing, addons JSON, travel fees';
comment on column public.artist_services.addons is
  'JSON array of { name, price, detail } addon options';

create index if not exists artist_services_user_active_idx
  on public.artist_services (user_id, is_active, sort_order);

create index if not exists artist_services_category_idx
  on public.artist_services (category)
  where category is not null and is_active = true;

-- Link bookings.service_id after artist_services exists (nullable = optional)
alter table public.bookings
  drop constraint if exists bookings_service_id_fkey;

alter table public.bookings
  add constraint bookings_service_id_fkey
  foreign key (service_id) references public.artist_services (id)
  on delete set null;

-- ---------------------------------------------------------------------------
-- 5. REVIEWS — verified booking reviews + artist responses
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  artist_id uuid not null references public.users (id) on delete cascade,
  customer_id uuid not null references public.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null default '',
  artist_response text,
  artist_responded_at timestamptz,
  status text not null default 'published'
    check (status in ('pending', 'published', 'hidden', 'flagged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.reviews is
  'One review per completed booking; supports moderation and artist reply';

create index if not exists reviews_artist_created_idx
  on public.reviews (artist_id, created_at desc)
  where status = 'published';

create index if not exists reviews_customer_idx
  on public.reviews (customer_id, created_at desc);

-- Optional backfill from legacy booking feedback (idempotent via ON CONFLICT)
insert into public.reviews (
  booking_id,
  artist_id,
  customer_id,
  rating,
  body,
  status,
  created_at,
  updated_at
)
select
  b.id,
  b.artist_id,
  b.customer_id,
  b.customer_rating,
  coalesce(nullif(trim(b.customer_feedback), ''), ''),
  'published',
  coalesce(b.reviewed_at, b.created_at),
  coalesce(b.reviewed_at, now())
from public.bookings b
where b.status = 'completed'
  and b.customer_rating is not null
  and b.customer_rating between 1 and 5
on conflict (booking_id) do nothing;

-- ---------------------------------------------------------------------------
-- 6. ARTIST PROFILE UPGRADES — discovery / marketplace fields
-- ---------------------------------------------------------------------------
-- Note: artist_verification_status lives on public.users (prior migration).
-- These profile fields support search, featured artists, and social proof.

alter table public.profiles
  add column if not exists years_experience integer
    check (years_experience is null or years_experience between 0 and 80),
  add column if not exists featured_status boolean not null default false,
  add column if not exists service_categories text[] not null default '{}',
  add column if not exists social_links jsonb not null default '{}'::jsonb,
  add column if not exists average_rating numeric(3, 2)
    check (average_rating is null or (average_rating >= 0 and average_rating <= 5)),
  add column if not exists review_count integer not null default 0
    check (review_count >= 0);

comment on column public.profiles.featured_status is
  'Admin-curated featured artist for homepage / discovery';
comment on column public.profiles.service_categories is
  'High-level categories for future search filters';
comment on column public.profiles.social_links is
  'JSON object: instagram, tiktok, facebook, website, etc.';
comment on column public.profiles.average_rating is
  'Denormalized from public.reviews; maintained by refresh_artist_review_aggregates';

create index if not exists profiles_featured_idx
  on public.profiles (featured_status)
  where featured_status = true;

alter table public.artist_portfolios
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_before_after boolean not null default false,
  add column if not exists tags text[] not null default '{}';

comment on column public.artist_portfolios.is_featured is
  'Highlight work on public profile gallery';
comment on column public.artist_portfolios.is_before_after is
  'Before/after showcase pair';
comment on column public.artist_portfolios.tags is
  'Free-form portfolio tags for filtering';

create index if not exists artist_portfolios_user_featured_idx
  on public.artist_portfolios (user_id, sort_order)
  where is_featured = true;

-- ---------------------------------------------------------------------------
-- 7. ARTIST VERIFICATION — ensure indexes (columns from 20250515120000)
-- ---------------------------------------------------------------------------
-- No new verification columns here; document dependency for operators.

comment on column public.users.artist_verification_status is
  'none | pending | verified | rejected — admin workflow (see auth_admin_security migration)';

create index if not exists users_verified_public_artists_idx
  on public.users (role, is_public_profile, artist_verification_status)
  where role = 'makeup_artist' and is_public_profile = true;

-- ---------------------------------------------------------------------------
-- 8. NOTIFICATION OUTBOX — future email/push (architecture only)
-- ---------------------------------------------------------------------------
create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  channel text not null default 'in_app'
    check (channel in ('in_app', 'email', 'push', 'sms')),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.notification_events is
  'Outbox for booking/verification notifications; delivery worker not included';

create index if not exists notification_events_user_unread_idx
  on public.notification_events (user_id, created_at desc)
  where read_at is null;

create index if not exists notification_events_type_idx
  on public.notification_events (event_type, created_at desc);

-- ---------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY — new tables
-- ---------------------------------------------------------------------------
alter table public.artist_availability_settings enable row level security;
alter table public.artist_weekly_schedules enable row level security;
alter table public.artist_availability_blocks enable row level security;
alter table public.artist_services enable row level security;
alter table public.reviews enable row level security;
alter table public.notification_events enable row level security;

drop policy if exists "artist_availability_settings_owner" on public.artist_availability_settings;
create policy "artist_availability_settings_owner"
  on public.artist_availability_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "artist_availability_settings_public_read" on public.artist_availability_settings;
create policy "artist_availability_settings_public_read"
  on public.artist_availability_settings for select
  using (
    exists (
      select 1 from public.users u
      where u.id = user_id
        and u.is_public_profile = true
        and u.role = 'makeup_artist'
    )
  );

drop policy if exists "artist_weekly_schedules_owner" on public.artist_weekly_schedules;
create policy "artist_weekly_schedules_owner"
  on public.artist_weekly_schedules for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "artist_weekly_schedules_public_read" on public.artist_weekly_schedules;
create policy "artist_weekly_schedules_public_read"
  on public.artist_weekly_schedules for select
  using (
    exists (
      select 1 from public.users u
      where u.id = user_id
        and u.is_public_profile = true
        and u.role = 'makeup_artist'
    )
  );

drop policy if exists "artist_availability_blocks_owner" on public.artist_availability_blocks;
create policy "artist_availability_blocks_owner"
  on public.artist_availability_blocks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "artist_services_owner" on public.artist_services;
create policy "artist_services_owner"
  on public.artist_services for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "artist_services_public_read" on public.artist_services;
create policy "artist_services_public_read"
  on public.artist_services for select
  using (
    is_active = true
    and exists (
      select 1 from public.users u
      where u.id = user_id
        and u.is_public_profile = true
        and u.role = 'makeup_artist'
    )
  );

drop policy if exists "reviews_select_public" on public.reviews;
create policy "reviews_select_public"
  on public.reviews for select
  using (status = 'published');

drop policy if exists "reviews_insert_customer" on public.reviews;
create policy "reviews_insert_customer"
  on public.reviews for insert
  with check (auth.uid() = customer_id);

drop policy if exists "reviews_update_participants" on public.reviews;
create policy "reviews_update_participants"
  on public.reviews for update
  using (auth.uid() = customer_id or auth.uid() = artist_id);

drop policy if exists "reviews_admin_all" on public.reviews;
create policy "reviews_admin_all"
  on public.reviews for all
  using (exists (select 1 from public.users a where a.id = auth.uid() and a.role = 'admin'))
  with check (exists (select 1 from public.users a where a.id = auth.uid() and a.role = 'admin'));

drop policy if exists "notification_events_own" on public.notification_events;
create policy "notification_events_own"
  on public.notification_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 10. FUNCTIONS & TRIGGERS — reference codes, conflict check, rating rollup
-- ---------------------------------------------------------------------------
create or replace function public.generate_booking_reference_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  code text;
begin
  code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
  return 'GL-' || code;
end;
$$;

comment on function public.generate_booking_reference_code() is
  'Generates unique human-readable booking reference GL-XXXXXXXX';

create or replace function public.bookings_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  if new.booking_reference_code is null or btrim(new.booking_reference_code) = '' then
    new.booking_reference_code := public.generate_booking_reference_code();
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before insert or update on public.bookings
  for each row execute function public.bookings_set_updated_at();

-- Backfill reference codes for existing bookings (idempotent)
update public.bookings
set booking_reference_code = public.generate_booking_reference_code()
where booking_reference_code is null or btrim(booking_reference_code) = '';

-- Slot conflict detection (security definer avoids RLS recursion on read)
create or replace function public.booking_has_conflict(
  p_artist_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_exclude_booking_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings b
    where b.artist_id = p_artist_id
      and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
      and b.status not in (
        'rejected', 'declined', 'cancelled', 'cancelled_by_customer',
        'cancelled_by_artist', 'refunded'
      )
      and tstzrange(b.start_at, b.end_at, '[)') && tstzrange(p_start_at, p_end_at, '[)')
  );
$$;

comment on function public.booking_has_conflict(uuid, timestamptz, timestamptz, uuid) is
  'Returns true when an active booking overlaps the requested time range';

revoke all on function public.booking_has_conflict(uuid, timestamptz, timestamptz, uuid) from public;
grant execute on function public.booking_has_conflict(uuid, timestamptz, timestamptz, uuid) to authenticated;

create or replace function public.refresh_artist_review_aggregates(p_artist_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  avg_rating numeric;
  cnt integer;
begin
  select round(avg(r.rating)::numeric, 2), count(*)::integer
  into avg_rating, cnt
  from public.reviews r
  where r.artist_id = p_artist_id and r.status = 'published';

  update public.profiles
  set
    average_rating = avg_rating,
    review_count = coalesce(cnt, 0),
    rating = coalesce(avg_rating, rating),
    reviews = coalesce(cnt, reviews)
  where user_id = p_artist_id;
end;
$$;

comment on function public.refresh_artist_review_aggregates(uuid) is
  'Syncs profiles.average_rating and review_count from published reviews';

revoke all on function public.refresh_artist_review_aggregates(uuid) from public;
grant execute on function public.refresh_artist_review_aggregates(uuid) to authenticated;

-- Refresh aggregates for artists who received backfilled reviews
do $$
declare
  aid uuid;
begin
  for aid in
    select distinct artist_id from public.reviews where status = 'published'
  loop
    perform public.refresh_artist_review_aggregates(aid);
  end loop;
end;
$$;

commit;

-- =============================================================================
-- ROLLBACK REFERENCE (MANUAL — run only if you must revert this migration)
-- =============================================================================
-- Supabase does not auto-rollback applied migrations. Execute in reverse order
-- during a maintenance window. This does NOT remove legacy booking data.
--
-- begin;
-- drop trigger if exists bookings_set_updated_at on public.bookings;
-- drop function if exists public.bookings_set_updated_at();
-- drop function if exists public.refresh_artist_review_aggregates(uuid);
-- revoke execute on function public.booking_has_conflict(uuid, timestamptz, timestamptz, uuid) from authenticated;
-- drop function if exists public.booking_has_conflict(uuid, timestamptz, timestamptz, uuid);
-- drop function if exists public.generate_booking_reference_code();
-- drop table if exists public.notification_events cascade;
-- drop table if exists public.reviews cascade;
-- alter table public.bookings drop constraint if exists bookings_service_id_fkey;
-- drop table if exists public.artist_services cascade;
-- drop table if exists public.artist_availability_blocks cascade;
-- drop table if exists public.artist_weekly_schedules cascade;
-- drop table if exists public.artist_availability_settings cascade;
-- drop table if exists public.booking_activity cascade;
-- alter table public.artist_portfolios
--   drop column if exists is_featured,
--   drop column if exists is_before_after,
--   drop column if exists tags;
-- alter table public.profiles
--   drop column if exists years_experience,
--   drop column if exists featured_status,
--   drop column if exists service_categories,
--   drop column if exists social_links,
--   drop column if exists average_rating,
--   drop column if exists review_count;
-- alter table public.bookings drop constraint if exists bookings_payment_status_check;
-- alter table public.bookings drop constraint if exists bookings_status_check;
-- alter table public.bookings
--   add constraint bookings_status_check check (
--     status in ('pending','confirmed','service_done','awaiting_feedback',
--                'completed','declined','cancelled')
--   );
-- alter table public.bookings
--   drop column if exists booking_reference_code,
--   drop column if exists cancellation_reason,
--   drop column if exists artist_response_at,
--   drop column if exists completed_at,
--   drop column if exists payment_status,
--   drop column if exists total_price,
--   drop column if exists platform_fee,
--   drop column if exists currency,
--   drop column if exists service_id,
--   drop column if exists timezone,
--   drop column if exists slot_lock_token,
--   drop column if exists updated_at;
-- commit;
-- =============================================================================
