-- 0013: our vision board. Run after 0011.
--
-- A vision belongs to one of us (owner_id) or to the family (owner_id null).
-- `area` is free text on purpose, not an enum: a vision can be about anything.
-- Visions are members only and have no public side, so anon gets no access.
-- We both see every vision. Family visions can be changed by either of us;
-- an individual vision only by its owner.

create type public.vision_status as enum ('dreaming', 'working', 'achieved');

create table public.visions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 200),
  area text not null check (length(trim(area)) between 1 and 60),
  owner_id uuid null references public.profiles (id) on delete cascade,
  description text null check (description is null or length(description) <= 5000),
  target_date date null,
  status public.vision_status not null default 'dreaming',
  achieved_on date null,
  photo_id uuid null references public.photos (id) on delete set null,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (achieved_on is null or status = 'achieved')
);

create index visions_created_idx on public.visions (created_at desc);

create trigger visions_updated_at
  before update on public.visions
  for each row execute function public.set_updated_at();

revoke all on public.visions from anon, authenticated;
grant select, delete on public.visions to authenticated;
grant insert (title, area, owner_id, description, target_date, status, achieved_on, photo_id)
  on public.visions to authenticated;
grant update (title, area, owner_id, description, target_date, status, achieved_on, photo_id)
  on public.visions to authenticated;

alter table public.visions enable row level security;

create policy "Members read all visions"
  on public.visions for select to authenticated
  using ((select public.is_member()));

create policy "Members add family visions or their own"
  on public.visions for insert to authenticated
  with check (
    (select public.is_member())
    and created_by = (select auth.uid())
    and (owner_id is null or owner_id = (select auth.uid()))
  );

create policy "Members edit family visions or their own"
  on public.visions for update to authenticated
  using ((select public.is_member()) and (owner_id is null or owner_id = (select auth.uid())))
  with check ((select public.is_member()) and (owner_id is null or owner_id = (select auth.uid())));

create policy "Members delete family visions or their own"
  on public.visions for delete to authenticated
  using ((select public.is_member()) and (owner_id is null or owner_id = (select auth.uid())));

-- Notifications ------------------------------------------------------------------------

alter table public.notifications
  add column vision_id uuid null references public.visions (id) on delete cascade;

-- Same as 0011 plus p_vision, so repeat edits only merge for the same vision.
drop function private.notify(text, text, text, text, uuid, uuid, uuid, uuid, date, interval);

create function private.notify(
  p_kind text,
  p_title text,
  p_body text,
  p_href text,
  p_entry uuid default null,
  p_note uuid default null,
  p_book uuid default null,
  p_recipient uuid default null,
  p_visible date default null,
  p_dedupe interval default null,
  p_vision uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  r uuid;
begin
  if actor is null then
    return;
  end if;
  for r in
    select id from public.profiles
    where id <> actor and (p_recipient is null or id = p_recipient)
  loop
    if p_dedupe is not null then
      update public.notifications
        set title = p_title, body = p_body, created_at = now()
        where recipient_id = r
          and actor_id = actor
          and kind = p_kind
          and read_at is null
          and entry_id is not distinct from p_entry
          and note_id is not distinct from p_note
          and book_id is not distinct from p_book
          and vision_id is not distinct from p_vision
          and created_at > now() - p_dedupe;
      if found then
        continue;
      end if;
    end if;
    insert into public.notifications
      (recipient_id, actor_id, kind, title, body, href, entry_id, note_id, book_id, vision_id, visible_from)
    values
      (r, actor, p_kind, left(p_title, 200), left(p_body, 300), p_href,
       p_entry, p_note, p_book, p_vision, coalesce(p_visible, public.diary_today()));
  end loop;
end;
$$;

create function private.on_vision_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform private.notify('vision_added',
      private.actor_name() || case when new.owner_id is null then ' added a family vision'
                                   else ' added a vision' end,
      new.title, '/admin/vision/' || new.id, p_vision => new.id);
  elsif new.status = 'achieved' and old.status is distinct from 'achieved' then
    perform private.notify('vision_achieved',
      private.actor_name() || ' marked a vision as achieved',
      new.title, '/admin/vision/' || new.id, p_vision => new.id);
  elsif (old.title, old.area, old.owner_id, old.description, old.target_date, old.status,
         old.achieved_on, old.photo_id)
        is distinct from
        (new.title, new.area, new.owner_id, new.description, new.target_date, new.status,
         new.achieved_on, new.photo_id) then
    perform private.notify('vision_updated', private.actor_name() || ' updated a vision',
      new.title, '/admin/vision/' || new.id, p_vision => new.id, p_dedupe => interval '1 hour');
  end if;
  return null;
end;
$$;
create trigger visions_notify
  after insert or update on public.visions
  for each row execute function private.on_vision_change();
