-- 0008: one reply per note (run after 0006).
--
-- The recipient of a note may answer it once, on or after its delivery
-- day. The reply is final: it can't be edited, removed or sent twice.
-- Once a note has a reply, its author can no longer change the note.
-- replied_at is set by the database, never by the client.

alter table public.notes
  add column reply text check (reply is null or length(trim(reply)) between 1 and 1000),
  add column replied_at timestamptz;

grant update (reply) on public.notes to authenticated;

create policy "Recipients reply to delivered notes"
  on public.notes for update to authenticated
  using (
    (select public.is_member())
    and recipient_id = (select auth.uid())
    and deliver_on <= public.diary_today()
  )
  with check (
    (select public.is_member())
    and recipient_id = (select auth.uid())
    and deliver_on <= public.diary_today()
  );

-- Column grants are per role, not per person, so this trigger decides who
-- may change what: the recipient only the reply (once), the author only
-- their own note (and only until it has a reply).
create function public.guard_note_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if new.reply is distinct from old.reply then
    if me is distinct from old.recipient_id then
      raise exception 'Only the recipient can reply to a note' using errcode = '42501';
    end if;
    if old.reply is not null then
      raise exception 'This note already has a reply' using errcode = '23514';
    end if;
    if new.message is distinct from old.message or new.deliver_on is distinct from old.deliver_on then
      raise exception 'A reply can''t change the note' using errcode = '42501';
    end if;
    new.replied_at := now();
  else
    -- Not a reply: only the author may change their note, and only until
    -- it has been answered.
    if me is distinct from old.author_id then
      raise exception 'Only the author can change a note' using errcode = '42501';
    end if;
    if old.reply is not null then
      raise exception 'A note with a reply can''t be changed' using errcode = '23514';
    end if;
    new.replied_at := old.replied_at;
  end if;
  return new;
end;
$$;

create trigger notes_guard_update
  before update on public.notes
  for each row execute function public.guard_note_update();

create index notes_author_replied_idx on public.notes (author_id, replied_at desc)
  where replied_at is not null;
