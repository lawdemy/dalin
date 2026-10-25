-- 0011: notifications between the two of us, in the app (the bell) and on
-- our phones (web push). Run after 0006, 0008 and 0009.
--
-- Notifications are written by triggers, so every change made through the
-- app (or anywhere else) is covered and the browser can't fake one. Each
-- notification goes to the other member, never to the person who acted.
-- A note's notification stays hidden until the morning the note is due,
-- so it doesn't spoil the surprise.
--
-- Push: the server sends phone notifications by calling claim_pushes() with
-- a secret that lives only in this database (private.app_config) and in
-- Vercel (PUSH_SECRET). No service-role key is used. After running this
-- migration, read the secret with:
--   select value from private.app_config where key = 'push_secret';

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.app_config (
  key text primary key,
  value text not null
);
insert into private.app_config (key, value)
values ('push_secret', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;

-- Notifications ------------------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  -- Who did it; null for things visitors do (e.g. a scholarship application).
  actor_id uuid null references public.profiles (id) on delete set null,
  kind text not null,
  title text not null,
  body text not null default '',
  href text not null default '/admin',
  entry_id uuid null references public.entries (id) on delete cascade,
  note_id uuid null references public.notes (id) on delete cascade,
  book_id uuid null references public.books (id) on delete cascade,
  visible_from date not null default public.diary_today(),
  created_at timestamptz not null default now(),
  read_at timestamptz null,
  pushed_at timestamptz null
);

create index notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);
create index notifications_unpushed_idx
  on public.notifications (visible_from) where pushed_at is null;

revoke all on public.notifications from anon, authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

alter table public.notifications enable row level security;

create policy "Recipients read their notifications once due"
  on public.notifications for select to authenticated
  using (
    (select public.is_member())
    and recipient_id = (select auth.uid())
    and visible_from <= public.diary_today()
  );

create policy "Recipients mark their notifications read"
  on public.notifications for update to authenticated
  using ((select public.is_member()) and recipient_id = (select auth.uid()))
  with check ((select public.is_member()) and recipient_id = (select auth.uid()));

create policy "Recipients clear their notifications"
  on public.notifications for delete to authenticated
  using ((select public.is_member()) and recipient_id = (select auth.uid()));

-- Phone subscriptions (one row per device that turned notifications on) ------------

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  endpoint text not null unique check (endpoint ~ '^https://' and length(endpoint) <= 1000),
  p256dh text not null check (length(p256dh) <= 200),
  auth text not null check (length(auth) <= 100),
  user_agent text null check (user_agent is null or length(user_agent) <= 300),
  created_at timestamptz not null default now()
);

revoke all on public.push_subscriptions from anon, authenticated;
grant select, delete on public.push_subscriptions to authenticated;

alter table public.push_subscriptions enable row level security;

create policy "Members see their own devices"
  on public.push_subscriptions for select to authenticated
  using ((select public.is_member()) and profile_id = (select auth.uid()));

create policy "Members remove their own devices"
  on public.push_subscriptions for delete to authenticated
  using ((select public.is_member()) and profile_id = (select auth.uid()));

/** Saves this device for the signed-in member (a device moves to whoever subscribed last). */
create function public.save_push_subscription(
  p_endpoint text, p_p256dh text, p_auth text, p_user_agent text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_member() then
    raise exception 'not allowed';
  end if;
  delete from public.push_subscriptions where endpoint = p_endpoint;
  insert into public.push_subscriptions (profile_id, endpoint, p256dh, auth, user_agent)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, left(p_user_agent, 300));
end;
$$;
revoke execute on function public.save_push_subscription(text, text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text, text) to authenticated;

-- Writing notifications ----------------------------------------------------------------

/**
 * Notifies the other member (or p_recipient) about something the signed-in
 * member did. With p_dedupe, an unread notice of the same kind about the same
 * thing from the last p_dedupe is refreshed instead of repeated (and isn't
 * pushed again), so a run of small edits makes one notification.
 */
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
  p_dedupe interval default null
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
          and created_at > now() - p_dedupe;
      if found then
        continue;
      end if;
    end if;
    insert into public.notifications
      (recipient_id, actor_id, kind, title, body, href, entry_id, note_id, book_id, visible_from)
    values
      (r, actor, p_kind, left(p_title, 200), left(p_body, 300), p_href,
       p_entry, p_note, p_book, coalesce(p_visible, public.diary_today()));
  end loop;
end;
$$;

/** The signed-in member's display name, for notification titles. */
create function private.actor_name()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select display_name from public.profiles where id = auth.uid()), 'Someone');
$$;

/** Shortens text for a notification line. */
create function private.snippet(t text, n int default 140)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when length(t) > n then rtrim(left(t, n - 1)) || '…' else coalesce(t, '') end;
$$;

-- Entries
create function private.on_entry_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform private.notify('entry_created', private.actor_name() || ' wrote a new entry',
      new.title, '/admin/entries/' || new.id, p_entry => new.id);
  elsif (old.title, old.body, old.entry_date, old.location, old.mood, old.category, old.visibility)
        is distinct from
        (new.title, new.body, new.entry_date, new.location, new.mood, new.category, new.visibility) then
    perform private.notify('entry_updated',
      private.actor_name() || case when old.visibility = 'private' and new.visibility = 'public'
                                   then ' shared an entry on Moments'
                                   else ' edited an entry' end,
      new.title, '/admin/entries/' || new.id, p_entry => new.id, p_dedupe => interval '1 hour');
  end if;
  return null;
end;
$$;
create trigger entries_notify
  after insert or update on public.entries
  for each row execute function private.on_entry_change();

-- Comments
create function private.on_comment_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  t text := (select title from public.entries where id = new.entry_id);
begin
  perform private.notify('comment',
    private.actor_name() || ' commented on “' || private.snippet(t, 60) || '”',
    private.snippet(new.body), '/admin/entries/' || new.entry_id || '#comments',
    p_entry => new.entry_id);
  return null;
end;
$$;
create trigger comments_notify
  after insert on public.comments
  for each row execute function private.on_comment_insert();

-- Notes: the recipient hears about it on the morning it's due; the author
-- hears about the reply.
create function private.on_note_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform private.notify('note_received', private.actor_name() || ' left you a note',
      'Open DaLin to read it.', '/admin#note-' || new.id,
      p_note => new.id, p_recipient => new.recipient_id, p_visible => new.deliver_on);
  elsif old.reply is null and new.reply is not null then
    perform private.notify('note_reply', private.actor_name() || ' replied to your note',
      private.snippet(new.reply), '/admin', p_note => new.id, p_recipient => new.author_id);
  elsif old.deliver_on is distinct from new.deliver_on then
    update public.notifications
      set visible_from = new.deliver_on
      where note_id = new.id and kind = 'note_received' and pushed_at is null;
  end if;
  return null;
end;
$$;
create trigger notes_notify
  after insert or update on public.notes
  for each row execute function private.on_note_change();

-- About us, the hero photo and the Moments switch
create function private.on_settings_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.moments_enabled is distinct from new.moments_enabled then
    perform private.notify('moments_toggled',
      private.actor_name() || case when new.moments_enabled then ' turned Moments on'
                                   else ' turned Moments off' end,
      case when new.moments_enabled then 'Public entries show on the site again.'
           else 'Public entries are hidden from visitors.' end,
      '/admin/settings');
  elsif (old.couple_names, old.welcome_line, old.hero_photo_id, old.our_story, old.how_we_met,
         old.engagement_date, old.engagement_place, old.engagement_story)
        is distinct from
        (new.couple_names, new.welcome_line, new.hero_photo_id, new.our_story, new.how_we_met,
         new.engagement_date, new.engagement_place, new.engagement_story) then
    perform private.notify('about_updated', private.actor_name() || ' updated About us',
      'Take a look at the public site.', '/about', p_dedupe => interval '1 hour');
  end if;
  return null;
end;
$$;
create trigger site_settings_notify
  after update on public.site_settings
  for each row execute function private.on_settings_update();

-- Photos shared on the public side
create function private.on_photo_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.is_public and not old.is_public) or (new.show_on_about and not old.show_on_about) then
    perform private.notify('photo_shared', private.actor_name() || ' shared a photo',
      case when new.is_public and not old.is_public then 'Added to the public gallery.'
           else 'Added to the About page.' end,
      case when new.is_public and not old.is_public then '/gallery' else '/about' end,
      p_dedupe => interval '1 hour');
  end if;
  return null;
end;
$$;
create trigger photos_notify
  after update of is_public, show_on_about on public.photos
  for each row execute function private.on_photo_update();

-- Bookshelf
create function private.on_book_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform private.notify('book_added', private.actor_name() || ' added a book to the bookshelf',
      new.title || ' by ' || new.author, '/admin/books/' || new.id, p_book => new.id);
  elsif new.status = 'finished' and old.status is distinct from 'finished' then
    perform private.notify('book_finished',
      private.actor_name() || ' finished “' || private.snippet(new.title, 60) || '”',
      new.title || ' by ' || new.author, '/admin/books/' || new.id, p_book => new.id);
  elsif (old.title, old.author, old.status, old.started_on, old.finished_on, old.buy_url,
         old.quote, old.reflection, old.visibility)
        is distinct from
        (new.title, new.author, new.status, new.started_on, new.finished_on, new.buy_url,
         new.quote, new.reflection, new.visibility) then
    perform private.notify('book_updated', private.actor_name() || ' updated a book',
      new.title, '/admin/books/' || new.id, p_book => new.id, p_dedupe => interval '1 hour');
  end if;
  return null;
end;
$$;
create trigger books_notify
  after insert or update on public.books
  for each row execute function private.on_book_change();

create function private.on_book_note_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  t text := (select title from public.books where id = new.book_id);
begin
  perform private.notify('book_note',
    private.actor_name() || ' wrote a reading note on “' || private.snippet(t, 60) || '”',
    private.snippet(coalesce(new.chapter || ': ', '') || new.body), '/admin/books/' || new.book_id || '#notes',
    p_book => new.book_id);
  return null;
end;
$$;
create trigger book_notes_notify
  after insert on public.book_notes
  for each row execute function private.on_book_note_insert();

-- Sending pushes ---------------------------------------------------------------------

/**
 * Hands the server the notifications that are due and not yet pushed, one
 * row per device to send to, and marks them pushed. Only callers holding the
 * push secret get anything; the app calls it right after each change and
 * once every morning (for notes scheduled for that day).
 */
create function public.claim_pushes(p_secret text)
returns table (notification_id uuid, title text, body text, href text,
               endpoint text, p256dh text, auth text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_secret is null
     or p_secret is distinct from (select value from private.app_config where key = 'push_secret') then
    raise exception 'not allowed';
  end if;
  return query
    with due as (
      update public.notifications n
        set pushed_at = now()
        where n.pushed_at is null
          and n.visible_from <= public.diary_today()
          and n.visible_from > public.diary_today() - 3
        returning n.id, n.recipient_id, n.title, n.body, n.href
    )
    select due.id, due.title, due.body, due.href, s.endpoint, s.p256dh, s.auth
    from due
    join public.push_subscriptions s on s.profile_id = due.recipient_id;
end;
$$;

/** Forgets devices whose push address no longer works (uninstalled, revoked). */
create function public.drop_push_subscriptions(p_secret text, p_endpoints text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_secret is null
     or p_secret is distinct from (select value from private.app_config where key = 'push_secret') then
    raise exception 'not allowed';
  end if;
  delete from public.push_subscriptions where endpoint = any (p_endpoints);
end;
$$;

revoke execute on function public.claim_pushes(text) from public;
revoke execute on function public.drop_push_subscriptions(text, text[]) from public;
grant execute on function public.claim_pushes(text) to anon, authenticated;
grant execute on function public.drop_push_subscriptions(text, text[]) to anon, authenticated;
