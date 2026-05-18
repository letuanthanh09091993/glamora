-- Portfolio media bucket (images + videos). URLs stored in profiles / artist_portfolios.
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

drop policy if exists "portfolio_storage_insert_own" on storage.objects;
create policy "portfolio_storage_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "portfolio_storage_select_public" on storage.objects;
create policy "portfolio_storage_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'portfolio');

drop policy if exists "portfolio_storage_update_own" on storage.objects;
create policy "portfolio_storage_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "portfolio_storage_delete_own" on storage.objects;
create policy "portfolio_storage_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
