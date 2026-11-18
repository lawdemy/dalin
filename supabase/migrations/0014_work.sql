-- 0014: our work planner. Run after 0013.
--
-- Businesses (work_companies) hold projects (work_projects); tasks can sit
-- under a business, a project, or neither. A task is for one of us
-- (assignee_id) or for both (assignee_id null). We both see and can change
-- everything here: it's how we keep each other's day in view. Members only,
-- no public side.

create type public.task_status as enum ('pending', 'in_progress', 'done');
create type public.task_priority as enum ('low', 'normal', 'high', 'urgent');
create type public.task_repeat as enum ('none', 'daily', 'weekdays', 'weekly', 'monthly');

-- Businesses -----------------------------------------------------------------------------

create table public.work_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  -- Index into the app's colour list (bg-co-1 … bg-co-8).
  color smallint not null default 0 check (color between 0 and 7),
  archived boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now()
);

create unique index work_companies_name_idx on public.work_companies (lower(trim(name)));

-- Projects ---------------------------------------------------------------------------------

create table public.work_projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.work_companies (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  archived boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now()
);

create unique index work_projects_name_idx
  on public.work_projects (company_id, lower(trim(name)));

-- Tasks ------------------------------------------------------------------------------------

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 300),
  notes text null check (notes is null or length(notes) <= 5000),
  company_id uuid null references public.work_companies (id) on delete set null,
  project_id uuid null references public.work_projects (id) on delete set null,
  -- Null: a task for both of us.
  assignee_id uuid null references public.profiles (id) on delete set null,
  status public.task_status not null default 'pending',
  priority public.task_priority not null default 'normal',
  due_date date null,
  repeat public.task_repeat not null default 'none',
  -- [{ "text": "...", "done": false }, …]
  checklist jsonb not null default '[]'
    check (jsonb_typeof(checklist) = 'array' and jsonb_array_length(checklist) <= 50),
  -- Set by the trigger below, never by the app.
  done_at timestamptz null,
  done_by uuid null references public.profiles (id) on delete set null,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_open_idx on public.tasks (due_date) where status <> 'done';
create index tasks_done_idx on public.tasks (done_at desc) where status = 'done';

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

/**
 * Keeps a task's business in step with its project, and records when and by
 * whom it was finished.
 */
create function private.prepare_task()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.project_id is not null then
    new.company_id := (select company_id from public.work_projects where id = new.project_id);
  end if;
  if new.status = 'done' then
    if tg_op = 'INSERT' or old.status is distinct from 'done' then
      new.done_at := now();
      new.done_by := auth.uid();
    end if;
  else
    new.done_at := null;
    new.done_by := null;
  end if;
  return new;
end;
$$;
create trigger tasks_prepare
  before insert or update on public.tasks
  for each row execute function private.prepare_task();

-- Access -----------------------------------------------------------------------------------

revoke all on public.work_companies, public.work_projects, public.tasks from anon, authenticated;

grant select, delete on public.work_companies, public.work_projects, public.tasks to authenticated;
grant insert (name, color, archived) on public.work_companies to authenticated;
grant update (name, color, archived) on public.work_companies to authenticated;
grant insert (company_id, name, archived) on public.work_projects to authenticated;
grant update (name, archived) on public.work_projects to authenticated;
grant insert (title, notes, company_id, project_id, assignee_id, status, priority, due_date,
              repeat, checklist)
  on public.tasks to authenticated;
grant update (title, notes, company_id, project_id, assignee_id, status, priority, due_date,
              repeat, checklist)
  on public.tasks to authenticated;

alter table public.work_companies enable row level security;
alter table public.work_projects enable row level security;
alter table public.tasks enable row level security;

create policy "Members read businesses" on public.work_companies for select to authenticated
  using ((select public.is_member()));
create policy "Members add businesses" on public.work_companies for insert to authenticated
  with check ((select public.is_member()) and created_by = (select auth.uid()));
create policy "Members edit businesses" on public.work_companies for update to authenticated
  using ((select public.is_member())) with check ((select public.is_member()));
create policy "Members delete businesses" on public.work_companies for delete to authenticated
  using ((select public.is_member()));

create policy "Members read projects" on public.work_projects for select to authenticated
  using ((select public.is_member()));
create policy "Members add projects" on public.work_projects for insert to authenticated
  with check ((select public.is_member()) and created_by = (select auth.uid()));
create policy "Members edit projects" on public.work_projects for update to authenticated
  using ((select public.is_member())) with check ((select public.is_member()));
create policy "Members delete projects" on public.work_projects for delete to authenticated
  using ((select public.is_member()));

create policy "Members read tasks" on public.tasks for select to authenticated
  using ((select public.is_member()));
create policy "Members add tasks" on public.tasks for insert to authenticated
  with check ((select public.is_member()) and created_by = (select auth.uid()));
create policy "Members edit tasks" on public.tasks for update to authenticated
  using ((select public.is_member())) with check ((select public.is_member()));
create policy "Members delete tasks" on public.tasks for delete to authenticated
  using ((select public.is_member()));

-- Notifications ----------------------------------------------------------------------------

alter table public.notifications
  add column task_id uuid null references public.tasks (id) on delete cascade;

-- Same as 0013 plus p_task.
drop function private.notify(text, text, text, text, uuid, uuid, uuid, uuid, date, interval, uuid);

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
  p_vision uuid default null,
  p_task uuid default null
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
          and task_id is not distinct from p_task
          and created_at > now() - p_dedupe;
      if found then
        continue;
      end if;
    end if;
    insert into public.notifications
      (recipient_id, actor_id, kind, title, body, href, entry_id, note_id, book_id, vision_id,
       task_id, visible_from)
    values
      (r, actor, p_kind, left(p_title, 200), left(p_body, 300), p_href,
       p_entry, p_note, p_book, p_vision, p_task, coalesce(p_visible, public.diary_today()));
  end loop;
end;
$$;

/**
 * Tells the other person when they're given a task, and when a task that is
 * theirs or shared gets finished.
 */
create function private.on_task_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if new.assignee_id is not null and new.assignee_id <> actor
     and (tg_op = 'INSERT' or old.assignee_id is distinct from new.assignee_id) then
    perform private.notify('task_assigned', private.actor_name() || ' gave you a task',
      new.title, '/admin/work/' || new.id, p_recipient => new.assignee_id, p_task => new.id);
  elsif tg_op = 'UPDATE' and new.status = 'done' and old.status is distinct from 'done'
        and (new.assignee_id is distinct from actor or new.created_by is distinct from actor) then
    perform private.notify('task_done', private.actor_name() || ' finished a task',
      new.title, '/admin/work/' || new.id, p_task => new.id);
  end if;
  return null;
end;
$$;
create trigger tasks_notify
  after insert or update on public.tasks
  for each row execute function private.on_task_change();
