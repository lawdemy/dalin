-- 0010: drafts, saved automatically while one of us is writing (like Gmail).
--
-- Each draft belongs to its author alone: the other person never sees it,
-- and visitors can't see drafts at all. A draft is deleted when its message
-- is sent or when its author discards it.
--
-- kind        what is being written            target_id
-- entry       a new diary entry                null (one draft per new entry)
-- note        a personal note for the other    null (one draft per new note)
-- comment     a comment on an entry            the entry
-- note_reply  the one reply to a note          the note
-- book_note   a reading note on a book         the book
--
-- Drafts with a target are one per author per target, so reopening the same
-- comment box picks up where you left off.

create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('entry', 'note', 'comment', 'note_reply', 'book_note')),
  target_id uuid null,
  payload jsonb not null default '{}' check (pg_column_size(payload) <= 300000),
  preview text not null default '' check (length(preview) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind in ('entry', 'note')) = (target_id is null))
);

create unique index drafts_one_per_target
  on public.drafts (author_id, kind, target_id)
  where target_id is not null;

create index drafts_author_updated_idx on public.drafts (author_id, updated_at desc);

create trigger drafts_updated_at
  before update on public.drafts
  for each row execute function public.set_updated_at();

revoke all on public.drafts from anon, authenticated;
grant select, delete on public.drafts to authenticated;
grant insert (id, kind, target_id, payload, preview) on public.drafts to authenticated;
grant update (payload, preview) on public.drafts to authenticated;

alter table public.drafts enable row level security;

create policy "Authors read their drafts"
  on public.drafts for select to authenticated
  using ((select public.is_member()) and author_id = (select auth.uid()));

create policy "Authors save drafts as themselves"
  on public.drafts for insert to authenticated
  with check ((select public.is_member()) and author_id = (select auth.uid()));

create policy "Authors update their drafts"
  on public.drafts for update to authenticated
  using ((select public.is_member()) and author_id = (select auth.uid()))
  with check ((select public.is_member()) and author_id = (select auth.uid()));

create policy "Authors discard their drafts"
  on public.drafts for delete to authenticated
  using ((select public.is_member()) and author_id = (select auth.uid()));
