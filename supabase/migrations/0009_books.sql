-- 0009: our bookshelf, the books we read together.
--
-- A book records what we read, not the book itself: no files are stored, only
-- the title, author, where to get it, a short quote and our own thoughts.
-- Books are private by default; public ones show on /books. Reading notes
-- (book_notes) are always members only, like comments.

create type public.book_status as enum ('reading', 'finished', 'want_to_read');

create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 200),
  author text not null check (length(trim(author)) between 1 and 200),
  status public.book_status not null default 'reading',
  started_on date null,
  finished_on date null,
  -- Where to buy or borrow it; https only.
  buy_url text null check (buy_url is null or (buy_url ~ '^https://' and length(buy_url) <= 500)),
  -- A sentence or two we loved (keep quotes short: the book is someone else's work).
  quote text null check (quote is null or length(quote) <= 400),
  -- What we're learning, in our own words.
  reflection text null check (reflection is null or length(reflection) <= 3000),
  visibility public.entry_visibility not null default 'private',
  added_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (finished_on is null or started_on is null or finished_on >= started_on)
);

create index books_visibility_idx on public.books (visibility, created_at desc);

create trigger books_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

revoke all on public.books from anon, authenticated;
grant select on public.books to anon;
grant select, delete on public.books to authenticated;
grant insert (title, author, status, started_on, finished_on, buy_url, quote, reflection, visibility)
  on public.books to authenticated;
grant update (title, author, status, started_on, finished_on, buy_url, quote, reflection, visibility)
  on public.books to authenticated;

alter table public.books enable row level security;

create policy "Anyone reads public books"
  on public.books for select to anon
  using (visibility = 'public');

create policy "Members read all books"
  on public.books for select to authenticated
  using ((select public.is_member()));

create policy "Members add books as themselves"
  on public.books for insert to authenticated
  with check ((select public.is_member()) and added_by = (select auth.uid()));

create policy "Members edit books"
  on public.books for update to authenticated
  using ((select public.is_member()))
  with check ((select public.is_member()));

create policy "Members delete books"
  on public.books for delete to authenticated
  using ((select public.is_member()));

-- Reading notes: private, any number, each of us edits only our own.

create table public.book_notes (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  chapter text null check (chapter is null or length(chapter) <= 80),
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index book_notes_book_created_idx on public.book_notes (book_id, created_at);

create trigger book_notes_updated_at
  before update on public.book_notes
  for each row execute function public.set_updated_at();

revoke all on public.book_notes from anon, authenticated;
grant select, delete on public.book_notes to authenticated;
grant insert (book_id, chapter, body) on public.book_notes to authenticated;
grant update (chapter, body) on public.book_notes to authenticated;

alter table public.book_notes enable row level security;

create policy "Members read all reading notes"
  on public.book_notes for select to authenticated
  using ((select public.is_member()));

create policy "Members write reading notes as themselves"
  on public.book_notes for insert to authenticated
  with check ((select public.is_member()) and author_id = (select auth.uid()));

create policy "Authors edit their reading notes"
  on public.book_notes for update to authenticated
  using ((select public.is_member()) and author_id = (select auth.uid()))
  with check ((select public.is_member()) and author_id = (select auth.uid()));

create policy "Authors delete their reading notes"
  on public.book_notes for delete to authenticated
  using ((select public.is_member()) and author_id = (select auth.uid()));
