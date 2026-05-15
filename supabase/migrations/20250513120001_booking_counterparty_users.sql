-- Allow participants in a booking to read each other's public directory row (username)
-- so dashboards can resolve counterparty names without listing all users.

drop policy if exists "users_select_booking_counterparty" on public.users;
create policy "users_select_booking_counterparty"
  on public.users for select
  using (
    exists (
      select 1 from public.bookings b
      where
        (b.artist_id = auth.uid() and (b.customer_id = users.id or b.model_id = users.id))
        or (b.customer_id = auth.uid() and b.artist_id = users.id)
        or (b.model_id = auth.uid() and b.artist_id = users.id)
    )
  );
