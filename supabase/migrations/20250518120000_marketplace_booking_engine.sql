-- =============================================================================
-- Glamora Marketplace — Booking Engine (additive migration)
-- =============================================================================
-- Migration ID : 20250518120000_marketplace_booking_engine
-- Apply via    : Supabase Dashboard → SQL Editor, OR `supabase db push` (manual)
-- DO NOT run automatically from CI without operator review.
--
-- PREREQUISITES (earlier Glamora migrations must already be applied):
--   • public.users, public.profiles, public.bookings, public.artist_portfolios
--   • Core RLS on users / profiles / bookings (unchanged by this file)
--   • public.users.artist_verification_status (20250515120000)
--
-- SAFETY PRINCIPLES:
--   • ADDITIVE ONLY — no DROP TABLE, no column renames, no auth/middleware changes
--   • Existing booking.status values remain valid; CHECK is expanded, not replaced
--   • Idempotent where possible (IF NOT EXISTS / IF EXISTS / ADD COLUMN IF NOT EXISTS)
--   • New-table RLS uses auth.uid() only — never subquery public.users inside users policies
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 0. Extension — tstzrange overlap for slot locking
-- ---------------------------------------------------------------------------
create extension if not exists btree_gist;

comment on extension btree_gist is
  'Glamora: enables tstzrange overlap in public.booking_has_conflict()';

-- ---------------------------------------------------------------------------
-- 1. BOOKINGS — lifecycle CHECK only (legacy + v2 statuses)
-- ---------------------------------------------------------------------------
-- Does NOT remove legacy statuses. Expands allowed values for marketplace flow.

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
      -- legacy (existing production rows + backward-compatible clients)
      'service_done',
      'awaiting_feedback',
      'declined',
      'cancelled'
    )
  );

comment on constraint bookings_status_check on public.bookings is
  'Booking lifecycle: v2 statuses plus legacy statuses (zero-downtime, additive)';

-- ---------------------------------------------------------------------------
-- 2. USERS — review aggregate columns (denormalized from public.reviews)
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists review_count integer not null default 0,
  add column if not exists average_rating numeric(3, 2) not null default 0;

comment on column public.users.review_count is
  'Published review count; maintained by refresh_artist_review_aggregates()';
comment on column public.users.average_rating is
  'Mean published review rating (1–5); maintained by refresh_artist_review_aggregates()';

-- ---------------------------------------------------------------------------
-- 3A. artist_services — structured catalog (profiles.service_packages jsonb unchanged)
-- ---------------------------------------------------------------------------
create table if not exists public.artist_services (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  price_min numeric,
  price_max numeric,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint artist_services_price_range check (
    price_min is null
    or price_max is null
    or price_min <= price_max
  )
);

comment on table public.artist_services is
  'Marketplace service catalog per artist; does not replace profiles.service_packages jsonb';

create index if not exists artist_services_artist_id_idx
  on public.artist_services (artist_id);

create index if not exists artist_services_is_active_idx
  on public.artist_services (is_active)
  where is_active = true;

-- ---------------------------------------------------------------------------
-- 3B. reviews — one row per booking review
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  artist_id uuid not null references public.users (id) on delete cascade,
  customer_id uuid not null references public.users (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review_text text,
  created_at timestamptz not null default now()
);

comment on table public.reviews is
  'Customer reviews tied to bookings; aggregates sync to public.users';

create unique index if not exists reviews_booking_id_uidx
  on public.reviews (booking_id);

create index if not exists reviews_artist_id_idx
  on public.reviews (artist_id);

create index if not exists reviews_customer_id_idx
  on public.reviews (customer_id);

create index if not exists reviews_booking_id_idx
  on public.reviews (booking_id);

-- ---------------------------------------------------------------------------
-- 3C. booking_activity — audit trail for booking events
-- ---------------------------------------------------------------------------
create table if not exists public.booking_activity (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  actor_user_id uuid references public.users (id) on delete set null,
  activity_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.booking_activity is
  'Append-only style log of booking lifecycle events and actor context';

create index if not exists booking_activity_booking_id_idx
  on public.booking_activity (booking_id);

create index if not exists booking_activity_actor_user_id_idx
  on public.booking_activity (actor_user_id)
  where actor_user_id is not null;

create index if not exists booking_activity_activity_type_idx
  on public.booking_activity (activity_type);

-- ---------------------------------------------------------------------------
-- 3D. artist_weekly_schedules — recurring weekly availability
-- ---------------------------------------------------------------------------
create table if not exists public.artist_weekly_schedules (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.users (id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint artist_weekly_schedules_time_range check (start_time < end_time)
);

comment on table public.artist_weekly_schedules is
  'Recurring weekly windows; weekday 0=Sunday .. 6=Saturday';

create index if not exists artist_weekly_schedules_artist_id_idx
  on public.artist_weekly_schedules (artist_id);

create index if not exists artist_weekly_schedules_weekday_idx
  on public.artist_weekly_schedules (weekday);

create index if not exists artist_weekly_schedules_artist_weekday_idx
  on public.artist_weekly_schedules (artist_id, weekday)
  where is_active = true;

-- ---------------------------------------------------------------------------
-- 3E. artist_availability_blocks — one-off blocked ranges
-- ---------------------------------------------------------------------------
create table if not exists public.artist_availability_blocks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.users (id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint artist_availability_blocks_range check (start_at < end_at)
);

comment on table public.artist_availability_blocks is
  'Blocked intervals (vacation, personal time, maintenance)';

create index if not exists artist_availability_blocks_artist_id_idx
  on public.artist_availability_blocks (artist_id);

create index if not exists artist_availability_blocks_start_at_idx
  on public.artist_availability_blocks (start_at);

create index if not exists artist_availability_blocks_end_at_idx
  on public.artist_availability_blocks (end_at);

create index if not exists artist_availability_blocks_artist_range_idx
  on public.artist_availability_blocks (artist_id, start_at, end_at);

-- ---------------------------------------------------------------------------
-- 4. SLOT LOCKING — overlap detection RPC
-- ---------------------------------------------------------------------------
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
        'rejected',
        'declined',
        'cancelled',
        'cancelled_by_customer',
        'cancelled_by_artist',
        'refunded'
      )
      and tstzrange(b.start_at, b.end_at, '[)')
          && tstzrange(p_start_at, p_end_at, '[)')
  );
$$;

comment on function public.booking_has_conflict(uuid, timestamptz, timestamptz, uuid) is
  'Returns true when an active booking overlaps [p_start_at, p_end_at) for the artist';

revoke all on function public.booking_has_conflict(uuid, timestamptz, timestamptz, uuid) from public;
grant execute on function public.booking_has_conflict(uuid, timestamptz, timestamptz, uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 5. REVIEW AGGREGATES — sync public.users from public.reviews
-- ---------------------------------------------------------------------------
create or replace function public.refresh_artist_review_aggregates(p_artist_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_avg numeric(3, 2);
begin
  select
    count(*)::integer,
    coalesce(round(avg(r.rating)::numeric, 2), 0)::numeric(3, 2)
  into v_count, v_avg
  from public.reviews r
  where r.artist_id = p_artist_id;

  update public.users
  set
    review_count = coalesce(v_count, 0),
    average_rating = coalesce(v_avg, 0)
  where id = p_artist_id;
end;
$$;

comment on function public.refresh_artist_review_aggregates(uuid) is
  'Recalculates public.users.review_count and average_rating from public.reviews';

revoke all on function public.refresh_artist_review_aggregates(uuid) from public;
grant execute on function public.refresh_artist_review_aggregates(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY — new tables only (simple auth.uid() patterns)
-- ---------------------------------------------------------------------------
-- NOTE: Existing policies on users / profiles / bookings are NOT modified.
-- NOTE: Never add policies on public.users that subquery public.users.

alter table public.artist_services enable row level security;
alter table public.reviews enable row level security;
alter table public.booking_activity enable row level security;
alter table public.artist_weekly_schedules enable row level security;
alter table public.artist_availability_blocks enable row level security;

-- artist_services: artist owns writes; active rows readable for booking UI (no users subquery)
drop policy if exists "artist_services_select_own" on public.artist_services;
create policy "artist_services_select_own"
  on public.artist_services for select
  using (auth.uid() = artist_id);

drop policy if exists "artist_services_select_active" on public.artist_services;
create policy "artist_services_select_active"
  on public.artist_services for select
  using (is_active = true);

drop policy if exists "artist_services_insert_own" on public.artist_services;
create policy "artist_services_insert_own"
  on public.artist_services for insert
  with check (auth.uid() = artist_id);

drop policy if exists "artist_services_update_own" on public.artist_services;
create policy "artist_services_update_own"
  on public.artist_services for update
  using (auth.uid() = artist_id)
  with check (auth.uid() = artist_id);

drop policy if exists "artist_services_delete_own" on public.artist_services;
create policy "artist_services_delete_own"
  on public.artist_services for delete
  using (auth.uid() = artist_id);

-- reviews: customer and artist can read their rows; customer inserts own reviews
drop policy if exists "reviews_select_participant" on public.reviews;
create policy "reviews_select_participant"
  on public.reviews for select
  using (auth.uid() = customer_id or auth.uid() = artist_id);

drop policy if exists "reviews_insert_customer" on public.reviews;
create policy "reviews_insert_customer"
  on public.reviews for insert
  with check (auth.uid() = customer_id);

drop policy if exists "reviews_update_customer" on public.reviews;
create policy "reviews_update_customer"
  on public.reviews for update
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

-- booking_activity: actor writes self; booking participants read via bookings (no users subquery)
drop policy if exists "booking_activity_insert_actor" on public.booking_activity;
create policy "booking_activity_insert_actor"
  on public.booking_activity for insert
  with check (
    actor_user_id is null
    or auth.uid() = actor_user_id
  );

drop policy if exists "booking_activity_select_participant" on public.booking_activity;
create policy "booking_activity_select_participant"
  on public.booking_activity for select
  using (
    auth.uid() = actor_user_id
    or exists (
      select 1
      from public.bookings b
      where b.id = booking_id
        and (
          auth.uid() = b.customer_id
          or auth.uid() = b.artist_id
          or auth.uid() = b.model_id
        )
    )
  );

-- artist_weekly_schedules: artist CRUD; active rows readable for slot discovery
drop policy if exists "artist_weekly_schedules_all_own" on public.artist_weekly_schedules;
create policy "artist_weekly_schedules_all_own"
  on public.artist_weekly_schedules for all
  using (auth.uid() = artist_id)
  with check (auth.uid() = artist_id);

drop policy if exists "artist_weekly_schedules_select_active" on public.artist_weekly_schedules;
create policy "artist_weekly_schedules_select_active"
  on public.artist_weekly_schedules for select
  using (is_active = true);

-- artist_availability_blocks: artist CRUD; authenticated read for slot API (no users subquery)
drop policy if exists "artist_availability_blocks_all_own" on public.artist_availability_blocks;
create policy "artist_availability_blocks_all_own"
  on public.artist_availability_blocks for all
  using (auth.uid() = artist_id)
  with check (auth.uid() = artist_id);

drop policy if exists "artist_availability_blocks_select_authenticated" on public.artist_availability_blocks;
create policy "artist_availability_blocks_select_authenticated"
  on public.artist_availability_blocks for select
  to authenticated
  using (true);

commit;

-- =============================================================================
-- ROLLBACK REFERENCE (MANUAL — execute only during a maintenance window)
-- =============================================================================
-- begin;
-- revoke execute on function public.refresh_artist_review_aggregates(uuid) from authenticated;
-- drop function if exists public.refresh_artist_review_aggregates(uuid);
-- revoke execute on function public.booking_has_conflict(uuid, timestamptz, timestamptz, uuid) from authenticated;
-- drop function if exists public.booking_has_conflict(uuid, timestamptz, timestamptz, uuid);
-- drop table if exists public.artist_availability_blocks cascade;
-- drop table if exists public.artist_weekly_schedules cascade;
-- drop table if exists public.booking_activity cascade;
-- drop table if exists public.reviews cascade;
-- drop table if exists public.artist_services cascade;
-- alter table public.users
--   drop column if exists review_count,
--   drop column if exists average_rating;
-- alter table public.bookings drop constraint if exists bookings_status_check;
-- alter table public.bookings add constraint bookings_status_check check (
--   status in (
--     'pending', 'confirmed', 'service_done', 'awaiting_feedback',
--     'completed', 'declined', 'cancelled'
--   )
-- );
-- commit;

-- =============================================================================
-- POST-MIGRATION VERIFICATION (commented — run manually in SQL Editor)
-- =============================================================================
-- -- A. Migration version present
-- select version
-- from supabase_migrations.schema_migrations
-- where version = '20250518120000'
-- order by version;
--
-- -- B. New tables exist
-- select table_name
-- from information_schema.tables
-- where table_schema = 'public'
--   and table_name in (
--     'artist_services',
--     'reviews',
--     'booking_activity',
--     'artist_weekly_schedules',
--     'artist_availability_blocks'
--   )
-- order by 1;
--
-- -- C. btree_gist extension
-- select extname, extversion
-- from pg_extension
-- where extname = 'btree_gist';
--
-- -- D. users aggregate columns
-- select column_name, data_type, column_default
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'users'
--   and column_name in ('review_count', 'average_rating')
-- order by column_name;
--
-- -- E. bookings status constraint allows v2 + legacy
-- select conname, pg_get_constraintdef(oid) as definition
-- from pg_constraint
-- where conrelid = 'public.bookings'::regclass
--   and conname = 'bookings_status_check';
--
-- -- F. booking_has_conflict smoke (should return false on empty overlap test)
-- select public.booking_has_conflict(
--   '00000000-0000-0000-0000-000000000000'::uuid,
--   now(),
--   now() + interval '1 hour'
-- ) as conflict_for_missing_artist;
--
-- -- G. RLS enabled on new tables
-- select c.relname as table_name, c.relrowsecurity as rls_enabled
-- from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public'
--   and c.relname in (
--     'artist_services',
--     'reviews',
--     'booking_activity',
--     'artist_weekly_schedules',
--     'artist_availability_blocks'
--   )
-- order by 1;
--
-- -- H. Policy count per new table (expect >= 1 each)
-- select tablename, count(*) as policy_count
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in (
--     'artist_services',
--     'reviews',
--     'booking_activity',
--     'artist_weekly_schedules',
--     'artist_availability_blocks'
--   )
-- group by tablename
-- order by tablename;
