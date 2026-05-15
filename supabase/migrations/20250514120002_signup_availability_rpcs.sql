-- Sign-up availability checks bypass RLS (anon cannot read most rows in public.users).
-- Join profiles so validation is tied to rows that have a profile record.
-- ---------------------------------------------------------------------------

create or replace function public.signup_is_username_available(p_username text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select case
    when length(trim(coalesce(p_username, ''))) < 1 then false
    else not exists (
      select 1
      from public.users u
      inner join public.profiles p on p.user_id = u.id
      where lower(u.username) = lower(trim(p_username))
    )
  end;
$$;

create or replace function public.signup_is_phone_available(
  p_phone text,
  p_exclude_user_id uuid default null
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select case
    when length(regexp_replace(trim(coalesce(p_phone, '')), '[[:space:]]+', '', 'g')) < 1 then false
    else not exists (
      select 1
      from public.users u
      inner join public.profiles p on p.user_id = u.id
      where u.phone_number = regexp_replace(trim(coalesce(p_phone, '')), '[[:space:]]+', '', 'g')
        and (p_exclude_user_id is null or u.id <> p_exclude_user_id)
    )
  end;
$$;

revoke all on function public.signup_is_username_available(text) from public;
grant execute on function public.signup_is_username_available(text) to anon, authenticated;

revoke all on function public.signup_is_phone_available(text, uuid) from public;
grant execute on function public.signup_is_phone_available(text, uuid) to anon, authenticated;

-- Prefer real signup email as contact when metadata omits contact_email.
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

  insert into public.users (id, username, auth_login_email, phone_number, role, is_public_profile, contact_email)
  values (
    new.id,
    uname,
    new.email,
    phone,
    rname,
    true,
    contact
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
