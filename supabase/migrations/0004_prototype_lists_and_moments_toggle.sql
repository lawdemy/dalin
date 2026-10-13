-- 0004: decisions from 13 Oct 2026.
-- 1. Moods and categories follow the prototype.
-- 2. Turning off the Moments feed hides public entries (and photos that are
--    public only because their entry is) from visitors. Members still see all.
-- 3. Couple names: Daniel & Linda.

-- 1. Enum lists ------------------------------------------------------------------
-- Postgres can't drop enum values, so each type is replaced and existing rows
-- are mapped to the nearest new value.

alter type public.entry_mood rename to entry_mood_old;
create type public.entry_mood as enum (
  'loved', 'happy', 'calm', 'excited', 'funny', 'tired', 'bittersweet', 'sad'
);
alter table public.entries
  alter column mood type public.entry_mood using (
    case mood::text
      when 'joyful' then 'happy'
      when 'peaceful' then 'calm'
      when 'grateful' then 'loved'
      when 'silly' then 'funny'
      else mood::text
    end
  )::public.entry_mood;
drop type public.entry_mood_old;

alter type public.entry_category rename to entry_category_old;
create type public.entry_category as enum (
  'everyday', 'date_night', 'travel', 'milestone', 'food', 'family', 'other'
);
alter table public.entries alter column category drop default;
alter table public.entries
  alter column category type public.entry_category using (
    case category::text
      when 'family_friends' then 'family'
      when 'home' then 'everyday'
      else category::text
    end
  )::public.entry_category;
alter table public.entries alter column category set default 'everyday';
drop type public.entry_category_old;

-- 2. Moments switch ----------------------------------------------------------------

create function public.moments_enabled()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select moments_enabled from public.site_settings where id = 1), false);
$$;

revoke execute on function public.moments_enabled() from public;
grant execute on function public.moments_enabled() to anon, authenticated;

drop policy "Anyone can read public entries" on public.entries;
create policy "Anyone can read public entries while Moments is on"
  on public.entries for select to anon, authenticated
  using (visibility = 'public' and (select public.moments_enabled()));

-- Same rule for photos: one that is public only through its entry is hidden
-- while Moments is off. Gallery, About and hero photos stay public.
create or replace function public.photo_is_public(photo public.photos)
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
    or (
      public.moments_enabled()
      and exists (
        select 1 from public.entries e
        where e.id = photo.entry_id and e.visibility = 'public'
      )
    );
$$;

-- 3. Names --------------------------------------------------------------------------
-- Only replaces the placeholder from seed.sql; edits made in the app are kept.

update public.site_settings
set couple_names = 'Daniel & Linda'
where id = 1 and couple_names in ('', 'Our Diary');
