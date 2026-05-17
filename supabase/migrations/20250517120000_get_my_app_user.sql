-- Reliable self-read for middleware / client auth (security definer, still public.users source of truth).
create or replace function public.get_my_app_user()
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'id', u.id,
    'role', u.role,
    'account_status', coalesce(u.account_status, 'active')
  )
  from public.users u
  where u.id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_my_app_user() from public;
grant execute on function public.get_my_app_user() to authenticated;
