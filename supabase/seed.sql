-- seed.sql: run after the migrations, and again after creating the two users.
-- Safe to run more than once.

-- The single site_settings row. Edit the text later in /admin/about.
insert into public.site_settings (id, couple_names, welcome_line)
values (1, 'Our Diary', 'Welcome to our little corner of the internet.')
on conflict (id) do nothing;

-- The two of us. Create both users first (Authentication → Users → Add user),
-- then replace the emails and names below and run this again.
-- Only users listed here can read private content or write anything.
insert into public.profiles (id, display_name)
select u.id, v.display_name
from (values
  ('first-person@example.com', 'First name'),
  ('second-person@example.com', 'First name')
) as v (email, display_name)
join auth.users u on lower(u.email) = lower(v.email)
on conflict (id) do update set display_name = excluded.display_name;

-- Check: this should list exactly two rows.
select p.display_name, u.email
from public.profiles p
join auth.users u on u.id = p.id;
