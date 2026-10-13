-- 0001_init.sql: enums, tables, indexes and triggers.
-- Access rules are in 0002_rls.sql; the photos bucket is in 0003_storage.sql.

-- Enums ---------------------------------------------------------------------

create type public.entry_visibility as enum ('private', 'public');

create type public.entry_category as enum (
  'date_night', 'travel', 'milestone', 'everyday', 'food', 'family_friends', 'home', 'other'
);

create type public.entry_mood as enum (
  'joyful', 'loved', 'excited', 'peaceful', 'grateful', 'silly', 'tired', 'sad'
);

-- profiles: the two of us, one row per auth user -----------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (length(trim(display_name)) > 0),
  avatar_path text,
  created_at timestamptz not null default now()
);

-- entries ----------------------------------------------------------------------

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) > 0),
  entry_date date not null,
  location text,
  mood public.entry_mood,
  category public.entry_category not null default 'everyday',
  body jsonb not null default '{}',
  -- Plain-text copy of body for search and excerpts; kept in sync by trigger.
  body_text text not null default '',
  author_id uuid not null default auth.uid() references public.profiles (id),
  visibility public.entry_visibility not null default 'private',
  cover_photo_id uuid, -- FK added after photos exists
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('english', body_text), 'B')
  ) stored
);

create index entries_entry_date_idx on public.entries (entry_date desc);
create index entries_visibility_entry_date_idx on public.entries (visibility, entry_date desc);
create index entries_author_idx on public.entries (author_id);
create index entries_search_idx on public.entries using gin (search);

-- photos -----------------------------------------------------------------------

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  -- Object name in the photos bucket, e.g. photos/2026/10/<uuid>.webp
  storage_path text not null unique check (storage_path like 'photos/%'),
  entry_id uuid references public.entries (id) on delete cascade,
  sort_order int not null default 0,
  caption text,
  alt_text text,
  width int not null check (width > 0),
  height int not null check (height > 0),
  blur_data_url text,
  taken_at timestamptz,
  is_public boolean not null default false,
  show_on_about boolean not null default false,
  about_sort_order int,
  uploaded_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now()
);

create index photos_entry_idx on public.photos (entry_id, sort_order);
create index photos_public_idx on public.photos (created_at desc) where is_public;
create index photos_about_idx on public.photos (about_sort_order) where show_on_about;

alter table public.entries
  add constraint entries_cover_photo_fk
  foreign key (cover_photo_id) references public.photos (id) on delete set null;

-- site_settings: a single row -----------------------------------------------------

create table public.site_settings (
  id int primary key default 1 check (id = 1),
  couple_names text not null default '',
  welcome_line text not null default '',
  hero_photo_id uuid references public.photos (id) on delete set null,
  our_story jsonb not null default '{}',
  how_we_met jsonb not null default '{}',
  engagement_date date,
  engagement_place text,
  engagement_story jsonb not null default '{}',
  moments_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Triggers ---------------------------------------------------------------------

-- Collects every "text" value in a Tiptap JSON document.
create function public.tiptap_text(doc jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    regexp_replace(
      string_agg(t #>> '{}', ' '),
      '\s+', ' ', 'g'
    ),
    ''
  )
  from jsonb_path_query(doc, 'strict $.**.text', '{}', true) as t
  where jsonb_typeof(t) = 'string';
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function public.sync_entry_body_text()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.body_text := public.tiptap_text(new.body);
  return new;
end;
$$;

create trigger entries_body_text
  before insert or update of body on public.entries
  for each row execute function public.sync_entry_body_text();

create trigger entries_updated_at
  before update on public.entries
  for each row execute function public.set_updated_at();

create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();
