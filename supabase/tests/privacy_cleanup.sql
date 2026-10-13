-- Removes the entries added by privacy_fixture.sql.
delete from public.entries where slug in ('privacy-test-public', 'privacy-test-private');
