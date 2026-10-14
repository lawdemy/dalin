-- 0006: personal notes between the two of us, shown on the dashboard.
--
-- A note is written by one member for the other and appears on the chosen
-- morning (deliver_on, a date in Lagos time). The recipient can't read it
-- before that day: RLS hides future notes from them. The author can always
-- see, edit and delete their own notes. Visitors can't see notes at all.

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  message text not null check (length(trim(message)) between 1 and 1000),
  deliver_on date not null,
  created_at timestamptz not null default now(),
  constraint notes_not_to_self check (author_id <> recipient_id)
);

create index notes_recipient_deliver_idx on public.notes (recipient_id, deliver_on desc);
create index notes_author_deliver_idx on public.notes (author_id, deliver_on desc);

-- "Today" in the diary's time zone.
create function public.diary_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Africa/Lagos')::date;
$$;

revoke all on public.notes from anon, authenticated;
grant select, delete on public.notes to authenticated;
grant insert (recipient_id, message, deliver_on) on public.notes to authenticated;
grant update (message, deliver_on) on public.notes to authenticated;

alter table public.notes enable row level security;

create policy "Authors read their notes; recipients from the delivery day"
  on public.notes for select to authenticated
  using (
    (select public.is_member())
    and (
      author_id = (select auth.uid())
      or (recipient_id = (select auth.uid()) and deliver_on <= public.diary_today())
    )
  );

create policy "Members write notes for the other member"
  on public.notes for insert to authenticated
  with check (
    (select public.is_member())
    and author_id = (select auth.uid())
    and recipient_id <> (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = recipient_id)
  );

create policy "Authors edit their notes"
  on public.notes for update to authenticated
  using ((select public.is_member()) and author_id = (select auth.uid()))
  with check ((select public.is_member()) and author_id = (select auth.uid()));

create policy "Authors delete their notes"
  on public.notes for delete to authenticated
  using ((select public.is_member()) and author_id = (select auth.uid()));
