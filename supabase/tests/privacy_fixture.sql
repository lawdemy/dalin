-- Privacy check fixture. Run in the SQL Editor, test the site, then run
-- privacy_cleanup.sql. Adds one public and one private test entry, written by
-- the first profile. Safe to run more than once.

insert into public.entries (slug, title, entry_date, body, visibility, category, mood, author_id)
select v.slug, v.title, v.entry_date::date, v.body::jsonb, v.visibility::public.entry_visibility,
       'everyday', 'happy', p.id
from (values
  ('privacy-test-public', 'Privacy test: public entry', '2026-10-12',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"This entry is public and should appear on the site."}]}]}',
   'public'),
  ('privacy-test-private', 'Privacy test: PRIVATE entry', '2026-10-13',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"SECRET-PRIVATE-TEXT must never be visible to visitors."}]}]}',
   'private')
) as v (slug, title, entry_date, body, visibility)
cross join (select id from public.profiles order by created_at limit 1) p
on conflict (slug) do nothing;

select slug, visibility from public.entries where slug like 'privacy-test-%';
