-- Transaction-safe, idempotent auth → public.users + public.profiles bootstrap
-- Fixes: orphan auth users when directory insert was skipped/failed, duplicate profile attempts,
--        and unclear failures. Trigger body runs in the SAME transaction as auth.users INSERT.
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
    uname := split_part(coalesce(new.email, ''), '@', 1);
  end if;
  if uname = '' then
    uname := 'user';
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

  begin
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
    )
    on conflict (id) do nothing;

    insert into public.profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;

    if rname = 'makeup_artist' then
      update public.profiles
      set rating = 4.9, reviews = 0
      where user_id = new.id;
    end if;

    if not exists (select 1 from public.users u where u.id = new.id) then
      raise log 'glamora.handle_new_user invariant_fail missing_users auth_user_id=%', new.id;
      raise exception 'GLAMORA_BOOTSTRAP_MISSING_USERS_ROW'
        using errcode = 'P0001',
          detail = 'public.users row missing after auth insert';
    end if;

    if not exists (select 1 from public.profiles p where p.user_id = new.id) then
      raise log 'glamora.handle_new_user invariant_fail missing_profiles auth_user_id=%', new.id;
      raise exception 'GLAMORA_BOOTSTRAP_MISSING_PROFILES_ROW'
        using errcode = 'P0001',
          detail = 'public.profiles row missing after auth insert';
    end if;

  exception
    when unique_violation then
      raise log 'glamora.handle_new_user unique_violation auth_user_id=% sqlstate=%', new.id, sqlstate;
      raise exception 'GLAMORA_BOOTSTRAP_DIRECTORY_UNIQUE_CONFLICT'
        using errcode = '23505',
          detail = coalesce(sqlerrm, 'unique constraint on public.users');
    when foreign_key_violation then
      raise log 'glamora.handle_new_user fk_violation auth_user_id=% sqlstate=%', new.id, sqlstate;
      raise;
    when others then
      raise log 'glamora.handle_new_user failed auth_user_id=% sqlstate=% message=%', new.id, sqlstate, sqlerrm;
      raise;
  end;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'AFTER INSERT on auth.users: creates public.users + public.profiles idempotently; raises on invariant failure (never silent).';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
