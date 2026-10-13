-- 0003_storage.sql: the private photos bucket and its access rules.
--
-- Nothing is served from a public bucket. Pages get short-lived signed URLs
-- created on the server; creating one requires read access below, so visitors
-- can only ever get URLs for photos that pass photo_is_public().

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 10485760, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Members: full access to the photos bucket.
create policy "Members can read photo files"
  on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (select public.is_member()));

create policy "Members can upload photo files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (select public.is_member()));

create policy "Members can update photo files"
  on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (select public.is_member()))
  with check (bucket_id = 'photos' and (select public.is_member()));

create policy "Members can delete photo files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (select public.is_member()));

-- Everyone: read only files whose photos row is public.
create policy "Anyone can read public photo files"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'photos'
    and exists (
      select 1 from public.photos p
      where p.storage_path = storage.objects.name
        and public.photo_is_public(p)
    )
  );
