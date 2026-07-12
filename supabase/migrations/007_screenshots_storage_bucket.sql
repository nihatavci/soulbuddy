-- 007_screenshots_storage_bucket.sql
-- Durable storage for user-uploaded conversation screenshots.
--
-- Before this, the app only stored a local file:// URI in message/session
-- metadata, so screenshots disappeared after a reinstall or on a new device.
-- This bucket is PRIVATE — images are namespaced by user id ({uid}/{file}) and
-- read back via short-lived signed URLs only.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'screenshots',
  'screenshots',
  false,
  5242880, -- 5 MB
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do nothing;

-- RLS: a user may only read/write/delete objects under their own {uid}/ prefix.
create policy "screenshots_select_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "screenshots_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'screenshots' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "screenshots_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'screenshots' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "screenshots_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = (select auth.uid()::text));
