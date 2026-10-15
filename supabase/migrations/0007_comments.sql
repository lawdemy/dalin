-- 0007: comments on entries, between the two of us.
--
-- Either of us can comment any number of times on any entry. Comments are
-- private (members only, even on public entries); each of us can edit or
-- delete only our own. Deleting an entry deletes its comments
-- (on delete cascade).

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_entry_created_idx on public.comments (entry_id, created_at);

create trigger comments_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

revoke all on public.comments from anon, authenticated;
grant select, delete on public.comments to authenticated;
grant insert (entry_id, body) on public.comments to authenticated;
grant update (body) on public.comments to authenticated;

alter table public.comments enable row level security;

create policy "Members read all comments"
  on public.comments for select to authenticated
  using ((select public.is_member()));

create policy "Members comment as themselves"
  on public.comments for insert to authenticated
  with check ((select public.is_member()) and author_id = (select auth.uid()));

create policy "Authors edit their comments"
  on public.comments for update to authenticated
  using ((select public.is_member()) and author_id = (select auth.uid()))
  with check ((select public.is_member()) and author_id = (select auth.uid()));

create policy "Authors delete their comments"
  on public.comments for delete to authenticated
  using ((select public.is_member()) and author_id = (select auth.uid()));
