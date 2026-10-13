-- 0002_rls.sql: who can see and change what.
--
-- "Member" = the signed-in user has a row in profiles (only the two of us).
-- Being signed in is not enough on its own.
-- Visitors (the anon role) can only read public entries, public photos and
-- site settings. Table privileges are narrowed too, so the browser can never
-- write columns like author_id, uploaded_by or body_text even as a member.

-- Helper functions ---------------------------------------------------------------

create function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()));
$$;

-- The one definition of "public photo", used by the photos table and by storage.
-- A photo is public if it is in the gallery, on the About page, the home hero,
-- or belongs to a public entry.
create function public.photo_is_public(photo public.photos)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select photo.is_public
    or photo.show_on_about
    or exists (
      select 1 from public.site_settings s
      where s.id = 1 and s.hero_photo_id = photo.id
    )
    or exists (
      select 1 from public.entries e
      where e.id = photo.entry_id and e.visibility = 'public'
    );
$$;

revoke execute on function public.is_member() from public;
revoke execute on function public.photo_is_public(public.photos) from public;
grant execute on function public.is_member() to anon, authenticated;
grant execute on function public.photo_is_public(public.photos) to anon, authenticated;

-- Table privileges ---------------------------------------------------------------
-- Start from nothing, then grant only what each role needs. RLS below then
-- decides which rows.

revoke all on public.profiles, public.entries, public.photos, public.site_settings
  from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, avatar_path) on public.profiles to authenticated;

grant select on public.entries to anon, authenticated;
grant insert (slug, title, entry_date, location, mood, category, body, visibility, cover_photo_id)
  on public.entries to authenticated;
grant update (slug, title, entry_date, location, mood, category, body, visibility, cover_photo_id)
  on public.entries to authenticated;
grant delete on public.entries to authenticated;

grant select on public.photos to anon, authenticated;
grant insert (id, storage_path, entry_id, sort_order, caption, alt_text, width, height,
              blur_data_url, taken_at, is_public, show_on_about, about_sort_order)
  on public.photos to authenticated;
grant update (entry_id, sort_order, caption, alt_text, is_public, show_on_about, about_sort_order)
  on public.photos to authenticated;
grant delete on public.photos to authenticated;

grant select on public.site_settings to anon, authenticated;
grant update (couple_names, welcome_line, hero_photo_id, our_story, how_we_met,
              engagement_date, engagement_place, engagement_story, moments_enabled)
  on public.site_settings to authenticated;

-- Row Level Security -----------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.entries enable row level security;
alter table public.photos enable row level security;
alter table public.site_settings enable row level security;

-- profiles: members read both rows; each of us updates only our own.
-- No insert or delete from the client: rows are created by hand (seed.sql).
create policy "Members can read profiles"
  on public.profiles for select to authenticated
  using ((select public.is_member()));

create policy "Members can update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) and (select public.is_member()))
  with check (id = (select auth.uid()));

-- entries
create policy "Anyone can read public entries"
  on public.entries for select to anon, authenticated
  using (visibility = 'public');

create policy "Members can read all entries"
  on public.entries for select to authenticated
  using ((select public.is_member()));

create policy "Members can create entries as themselves"
  on public.entries for insert to authenticated
  with check ((select public.is_member()) and author_id = (select auth.uid()));

-- Either of us may edit or delete any entry (CLAUDE.md default).
create policy "Members can update entries"
  on public.entries for update to authenticated
  using ((select public.is_member()))
  with check ((select public.is_member()));

create policy "Members can delete entries"
  on public.entries for delete to authenticated
  using ((select public.is_member()));

-- photos
create policy "Anyone can read public photos"
  on public.photos for select to anon, authenticated
  using (public.photo_is_public(photos));

create policy "Members can read all photos"
  on public.photos for select to authenticated
  using ((select public.is_member()));

create policy "Members can add photos as themselves"
  on public.photos for insert to authenticated
  with check ((select public.is_member()) and uploaded_by = (select auth.uid()));

create policy "Members can update photos"
  on public.photos for update to authenticated
  using ((select public.is_member()))
  with check ((select public.is_member()));

create policy "Members can delete photos"
  on public.photos for delete to authenticated
  using ((select public.is_member()));

-- site_settings: readable by everyone, editable by members. No insert/delete.
create policy "Anyone can read site settings"
  on public.site_settings for select to anon, authenticated
  using (true);

create policy "Members can update site settings"
  on public.site_settings for update to authenticated
  using ((select public.is_member()))
  with check ((select public.is_member()));
