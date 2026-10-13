-- 0005: photo files move to Cloudinary (decision 13 Oct 2026).
--
-- photos.storage_path now holds the Cloudinary public_id of a private
-- ("authenticated") asset, e.g. dalin/photos/2026/10/<uuid>. Files are only
-- reachable through URLs our server signs, and it signs only rows the caller
-- can read under RLS. Signed Cloudinary URLs don't expire, so when a photo
-- stops being public the app renames its asset (new public_id), which kills
-- every old link. public_photo_ids() lets the app see which photos were
-- public before and after a change.

alter table public.photos drop constraint photos_storage_path_check;
alter table public.photos
  add constraint photos_storage_path_check
  check (storage_path ~ '^dalin/photos/[0-9]{4}/[0-9]{2}/[0-9a-f-]{36}$');

-- Where the file lives and what it is. Video comes later; the column is ready.
alter table public.photos
  add column provider text not null default 'cloudinary'
    check (provider in ('cloudinary')),
  add column media_type text not null default 'image'
    check (media_type in ('image'));

-- Members may rename a photo's file (re-keying on unpublish).
grant update (storage_path) on public.photos to authenticated;

-- Which of these photos are public right now. Members only.
create function public.public_photo_ids(ids uuid[])
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.photos p
  where p.id = any (ids)
    and public.is_member()
    and public.photo_is_public(p);
$$;

revoke execute on function public.public_photo_ids(uuid[]) from public, anon;
grant execute on function public.public_photo_ids(uuid[]) to authenticated;
