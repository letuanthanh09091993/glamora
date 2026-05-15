-- Production auth + admin security extensions
-- ---------------------------------------------------------------------------

alter table public.users
  add column if not exists account_status text not null default 'active'
    check (account_status in ('active', 'suspended'));

alter table public.users
  add column if not exists artist_verification_status text not null default 'none'
    check (artist_verification_status in ('none', 'pending', 'verified', 'rejected'));

alter table public.users
  add column if not exists artist_verification_note text;

alter table public.users
  add column if not exists email_verified_at timestamptz;

alter table public.users
  add column if not exists last_login_at timestamptz;

create index if not exists users_account_status_idx on public.users (account_status);
create index if not exists users_artist_verification_idx on public.users (artist_verification_status)
  where role = 'makeup_artist';

-- Existing makeup artists stay discoverable; new signups start as pending until admin verifies.
update public.users
set artist_verification_status = 'verified'
where role = 'makeup_artist' and artist_verification_status = 'none';

update public.users
set artist_verification_status = 'none'
where role <> 'makeup_artist';

-- ---------------------------------------------------------------------------
-- Sync auth.users → public.users (email confirmation, last sign-in, email change)
-- ---------------------------------------------------------------------------
create or replace function public.glamora_sync_auth_user_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is distinct from old.email_confirmed_at
     or new.last_sign_in_at is distinct from old.last_sign_in_at
     or new.email is distinct from old.email
  then
    update public.users
    set
      email_verified_at = new.email_confirmed_at,
      last_login_at = coalesce(new.last_sign_in_at, last_login_at),
      auth_login_email = new.email,
      contact_email = case
        when contact_email is null or contact_email = old.email then new.email
        else contact_email
      end
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists glamora_sync_auth_user on auth.users;
create trigger glamora_sync_auth_user
  after update on auth.users
  for each row execute function public.glamora_sync_auth_user_state();

-- ---------------------------------------------------------------------------
-- Block non-admin users from escalating privileged columns on self-service updates
-- ---------------------------------------------------------------------------
create or replace function public.users_block_self_privilege_changes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  -- System / trigger-driven updates (no JWT) — allow
  if auth.uid() is null then
    return new;
  end if;

  if exists (select 1 from public.users a where a.id = auth.uid() and a.role = 'admin') then
    return new;
  end if;

  if new.id = auth.uid() then
    if new.role is distinct from old.role then
      raise exception 'role change not allowed' using errcode = '42501';
    end if;
    if new.account_status is distinct from old.account_status then
      raise exception 'account_status change not allowed' using errcode = '42501';
    end if;
    if new.artist_verification_status is distinct from old.artist_verification_status then
      raise exception 'artist_verification_status change not allowed' using errcode = '42501';
    end if;
    if new.artist_verification_note is distinct from old.artist_verification_note then
      raise exception 'artist_verification_note change not allowed' using errcode = '42501';
    end if;
    if new.email_verified_at is distinct from old.email_verified_at then
      raise exception 'email_verified_at change not allowed' using errcode = '42501';
    end if;
    if new.last_login_at is distinct from old.last_login_at then
      raise exception 'last_login_at change not allowed' using errcode = '42501';
    end if;
    if new.auth_login_email is distinct from old.auth_login_email then
      raise exception 'auth_login_email change not allowed' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists users_block_self_privilege_changes on public.users;
create trigger users_block_self_privilege_changes
  before update on public.users
  for each row execute function public.users_block_self_privilege_changes();

-- ---------------------------------------------------------------------------
-- Auth signup → directory row (replaces prior handle_new_user)
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
  contact text;
  v_status text;
begin
  uname := trim(coalesce(new.raw_user_meta_data ->> 'username', ''));
  if uname = '' then
    uname := split_part(new.email, '@', 1);
  end if;

  phone := regexp_replace(trim(coalesce(new.raw_user_meta_data ->> 'phone_number', '')), '[[:space:]]+', '', 'g');
  rname := trim(coalesce(new.raw_user_meta_data ->> 'role', 'customer'));
  if rname not in ('customer', 'makeup_artist', 'model', 'artist_looking_model', 'admin') then
    rname := 'customer';
  end if;

  contact := nullif(trim(coalesce(new.raw_user_meta_data ->> 'contact_email', '')), '');
  if contact is null then
    contact := nullif(trim(coalesce(new.email, '')), '');
  end if;

  v_status := case when rname = 'makeup_artist' then 'pending' else 'none' end;

  insert into public.users (
    id,
    username,
    auth_login_email,
    phone_number,
    role,
    is_public_profile,
    contact_email,
    account_status,
    artist_verification_status,
    email_verified_at
  )
  values (
    new.id,
    uname,
    new.email,
    phone,
    rname,
    true,
    contact,
    'active',
    v_status,
    new.email_confirmed_at
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
