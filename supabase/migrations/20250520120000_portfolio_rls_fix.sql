-- Fix portfolio upload RLS: storage.objects + public.artist_portfolios + bucket read
-- Bucket id must match lib/portfolio/ensure-portfolio-storage.ts → "portfolio"
-- Upload path pattern: {auth.uid()}/{uuid}.{ext}
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio',
  'portfolio',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- storage.buckets — required so clients can resolve the bucket before upload
-- ---------------------------------------------------------------------------
drop policy if exists "portfolio_bucket_select_public" on storage.buckets;
create policy "portfolio_bucket_select_public"
  on storage.buckets for select
  to public
  using (id = 'portfolio');

drop policy if exists "portfolio_bucket_select_authenticated" on storage.buckets;
create policy "portfolio_bucket_select_authenticated"
  on storage.buckets for select
  to authenticated
  using (id = 'portfolio');

-- ---------------------------------------------------------------------------
-- storage.objects — own-folder writes; public reads (public bucket)
-- ---------------------------------------------------------------------------
drop policy if exists "portfolio_storage_insert_own" on storage.objects;
drop policy if exists "portfolio_storage_select_public" on storage.objects;
drop policy if exists "portfolio_storage_update_own" on storage.objects;
drop policy if exists "portfolio_storage_delete_own" on storage.objects;
drop policy if exists "portfolio_insert_own_path" on storage.objects;
drop policy if exists "portfolio_select_public" on storage.objects;
drop policy if exists "portfolio_update_own_path" on storage.objects;
drop policy if exists "portfolio_delete_own_path" on storage.objects;

create policy "portfolio_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'portfolio');

create policy "portfolio_insert_own_path"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'portfolio'
    and split_part(name, '/', 1) = (select auth.uid()::text)
    and (owner is null or owner = (select auth.uid()))
  );

create policy "portfolio_update_own_path"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'portfolio'
    and split_part(name, '/', 1) = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'portfolio'
    and split_part(name, '/', 1) = (select auth.uid()::text)
  );

create policy "portfolio_delete_own_path"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'portfolio'
    and split_part(name, '/', 1) = (select auth.uid()::text)
  );

-- ---------------------------------------------------------------------------
-- public.artist_portfolios — makeup artists manage only their rows
-- (no portfolio_media table in Glamora schema)
-- ---------------------------------------------------------------------------
drop policy if exists "artist_portfolios_write_owner" on public.artist_portfolios;
drop policy if exists "artist_portfolios_update_owner" on public.artist_portfolios;
drop policy if exists "artist_portfolios_delete_owner" on public.artist_portfolios;

create policy "artist_portfolios_write_owner"
  on public.artist_portfolios for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.users u
      where u.id = (select auth.uid())
        and u.role = 'makeup_artist'
    )
  );

create policy "artist_portfolios_update_owner"
  on public.artist_portfolios for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "artist_portfolios_delete_owner"
  on public.artist_portfolios for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- public.profiles — ensure portfolio JSON columns can be updated by owner
-- (insert is via auth trigger; only update needed on save)
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
