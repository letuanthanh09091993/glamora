-- Glamora core schema for Supabase (PostgreSQL)
-- Apply in Supabase Dashboard → SQL Editor, or: supabase db push

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Application users (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  auth_login_email text not null unique,
  phone_number text not null default '',
  role text not null
    check (role in ('customer', 'makeup_artist', 'model', 'artist_looking_model', 'admin')),
  is_public_profile boolean not null default true,
  contact_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists users_username_lower_idx on public.users (lower(username));

create index if not exists users_role_public_idx
  on public.users (role, is_public_profile)
  where is_public_profile = true;

-- ---------------------------------------------------------------------------
-- Extended profile (non-auth directory data)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  display_name text,
  bio text,
  avatar_url text,
  latitude double precision,
  longitude double precision,
  location text,
  service_area_district_keys jsonb not null default '[]'::jsonb,
  studio_address text,
  specialties text[] not null default '{}',
  pricing text,
  service_packages jsonb not null default '[]'::jsonb,
  cosmetic_brands text[] not null default '{}',
  rating numeric,
  reviews integer not null default 0,
  favorite_artist_ids uuid[] not null default '{}',
  booking_history_ids text[] not null default '{}',
  measurements text,
  collaboration_preferences text,
  portfolio_image_urls text[] not null default '{}',
  portfolio_video_urls text[] not null default '{}',
  portfolio_items jsonb not null default '[]'::jsonb,
  casting_requests jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.users (id) on delete restrict,
  artist_id uuid not null references public.users (id) on delete restrict,
  model_id uuid references public.users (id) on delete set null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  notes text not null default '',
  address text,
  contact_phone text,
  service_type text,
  status text not null
    check (
      status in (
        'pending',
        'confirmed',
        'service_done',
        'awaiting_feedback',
        'completed',
        'declined',
        'cancelled'
      )
    ),
  created_at timestamptz not null default now(),
  customer_rating smallint,
  customer_feedback text,
  reviewed_at timestamptz
);

create index if not exists bookings_customer_idx on public.bookings (customer_id);
create index if not exists bookings_artist_idx on public.bookings (artist_id);
create index if not exists bookings_model_idx on public.bookings (model_id);

-- ---------------------------------------------------------------------------
-- Artist portfolio rows (normalized; synced from profile editor)
-- ---------------------------------------------------------------------------
create table if not exists public.artist_portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  url text not null,
  kind text not null check (kind in ('image', 'video')),
  album text,
  style_tag text,
  package_name text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint artist_portfolios_user_url unique (user_id, url)
);

create index if not exists artist_portfolios_user_sort_idx
  on public.artist_portfolios (user_id, sort_order);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth hook: create directory row when a Supabase Auth user is created
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
  phone text;
  rname text;
begin
  uname := trim(coalesce(new.raw_user_meta_data ->> 'username', ''));
  if uname = '' then
    uname := split_part(new.email, '@', 1);
  end if;

  phone := trim(coalesce(new.raw_user_meta_data ->> 'phone_number', ''));
  rname := trim(coalesce(new.raw_user_meta_data ->> 'role', 'customer'));
  if rname not in ('customer', 'makeup_artist', 'model', 'artist_looking_model', 'admin') then
    rname := 'customer';
  end if;

  insert into public.users (id, username, auth_login_email, phone_number, role, is_public_profile, contact_email)
  values (
    new.id,
    uname,
    new.email,
    phone,
    rname,
    true,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'contact_email', '')), '')
  );

  insert into public.profiles (user_id)
  values (new.id);

  if rname = 'makeup_artist' then
    update public.profiles
    set rating = 4.9, reviews = 0
    where user_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Login helper: map username → auth email (anon + authenticated can execute)
-- ---------------------------------------------------------------------------
create or replace function public.resolve_login_email(p_username text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select u.auth_login_email
  from public.users u
  where lower(u.username) = lower(trim(p_username))
  limit 1;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.artist_portfolios enable row level security;

-- Users policies
drop policy if exists "users_select_self" on public.users;
create policy "users_select_self"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "users_select_public_directory" on public.users;
create policy "users_select_public_directory"
  on public.users for select
  using (
    is_public_profile = true
    and role in ('makeup_artist', 'model')
  );

drop policy if exists "users_admin_all" on public.users;
create policy "users_admin_all"
  on public.users for all
  using (
    exists (select 1 from public.users a where a.id = auth.uid() and a.role = 'admin')
  )
  with check (
    exists (select 1 from public.users a where a.id = auth.uid() and a.role = 'admin')
  );

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Profiles policies
drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
  on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  using (
    exists (
      select 1 from public.users u
      where u.id = user_id
        and u.is_public_profile = true
        and u.role in ('makeup_artist', 'model')
    )
  );

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
  on public.profiles for all
  using (
    exists (select 1 from public.users a where a.id = auth.uid() and a.role = 'admin')
  )
  with check (
    exists (select 1 from public.users a where a.id = auth.uid() and a.role = 'admin')
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Bookings policies
drop policy if exists "bookings_select_participants" on public.bookings;
create policy "bookings_select_participants"
  on public.bookings for select
  using (
    auth.uid() = customer_id
    or auth.uid() = artist_id
    or auth.uid() = model_id
    or exists (select 1 from public.users a where a.id = auth.uid() and a.role = 'admin')
  );

drop policy if exists "bookings_insert_authenticated" on public.bookings;
create policy "bookings_insert_authenticated"
  on public.bookings for insert
  with check (
    auth.uid() = customer_id
    or exists (select 1 from public.users a where a.id = auth.uid() and a.role = 'admin')
  );

drop policy if exists "bookings_update_participants" on public.bookings;
create policy "bookings_update_participants"
  on public.bookings for update
  using (
    auth.uid() = customer_id
    or auth.uid() = artist_id
    or auth.uid() = model_id
    or exists (select 1 from public.users a where a.id = auth.uid() and a.role = 'admin')
  );

drop policy if exists "bookings_delete_admin" on public.bookings;
create policy "bookings_delete_admin"
  on public.bookings for delete
  using (
    exists (select 1 from public.users a where a.id = auth.uid() and a.role = 'admin')
  );

-- Artist portfolios
drop policy if exists "artist_portfolios_select_owner_or_public" on public.artist_portfolios;
create policy "artist_portfolios_select_owner_or_public"
  on public.artist_portfolios for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.users u
      where u.id = user_id
        and u.is_public_profile = true
        and u.role = 'makeup_artist'
    )
    or exists (select 1 from public.users a where a.id = auth.uid() and a.role = 'admin')
  );

drop policy if exists "artist_portfolios_write_owner" on public.artist_portfolios;
create policy "artist_portfolios_write_owner"
  on public.artist_portfolios for insert
  with check (auth.uid() = user_id);

drop policy if exists "artist_portfolios_update_owner" on public.artist_portfolios;
create policy "artist_portfolios_update_owner"
  on public.artist_portfolios for update
  using (auth.uid() = user_id);

drop policy if exists "artist_portfolios_delete_owner" on public.artist_portfolios;
create policy "artist_portfolios_delete_owner"
  on public.artist_portfolios for delete
  using (auth.uid() = user_id);

drop policy if exists "artist_portfolios_admin_all" on public.artist_portfolios;
create policy "artist_portfolios_admin_all"
  on public.artist_portfolios for all
  using (
    exists (select 1 from public.users a where a.id = auth.uid() and a.role = 'admin')
  )
  with check (
    exists (select 1 from public.users a where a.id = auth.uid() and a.role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- Optional: allow authenticated users to read usernames for /book/[user]
-- (already covered by public_directory for artists; customers booking need
--  artist row — artist is public when bookable; keep is_public_profile true)
-- ---------------------------------------------------------------------------

comment on table public.users is 'Application directory; id matches auth.users.id';
comment on table public.profiles is 'Extended profile fields; user_id PK';
comment on table public.bookings is 'Makeup / model booking sessions';
comment on table public.artist_portfolios is 'Portfolio media rows for makeup artists';
