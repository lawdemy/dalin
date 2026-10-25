-- 0012: the education foundation. Run after 0011.
--
-- Visitors apply for an academic scholarship or school fees support (primary
-- school to PhD; public or private schools). Only nationals of African
-- countries may apply. Under-18s apply through a parent or guardian.
--
-- Privacy: applications hold personal data about children and families.
-- Visitors can't read any application, not even their own; they can only
-- submit one (submit_application) and attach documents to it with the
-- one-time token it returns. Daniel and Linda (members) read and review.
-- Document files are private Cloudinary assets under
-- dalin/applications/<application id>/.

create type public.application_status as enum
  ('new', 'reviewing', 'shortlisted', 'approved', 'declined', 'funded');

/** Nationals of these 54 countries may apply. */
create function private.is_african_country(code text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select code = any (array[
    'DZ','AO','BJ','BW','BF','BI','CV','CM','CF','TD','KM','CG','CD','CI','DJ','EG','GQ','ER',
    'SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ',
    'NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','ZM','ZW'
  ]);
$$;

create table public.scholarship_applications (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  status public.application_status not null default 'new',

  -- The student
  full_name text not null check (length(trim(full_name)) between 2 and 120),
  date_of_birth date not null check (date_of_birth >= '1940-01-01'),
  gender text null check (gender is null or gender in ('female', 'male')),
  nationality text not null check (private.is_african_country(nationality)),
  country_of_residence text not null check (length(country_of_residence) between 2 and 80),
  state_region text null check (state_region is null or length(state_region) <= 80),
  city text not null check (length(trim(city)) between 1 and 80),
  email text null check (email is null or (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 200)),
  phone text not null check (length(phone) between 7 and 25),

  -- Parent or guardian (required for under-18s; checked when submitted)
  guardian_name text null check (guardian_name is null or length(guardian_name) <= 120),
  guardian_relationship text null check (guardian_relationship is null or length(guardian_relationship) <= 60),
  guardian_phone text null check (guardian_phone is null or length(guardian_phone) between 7 and 25),
  guardian_email text null check (guardian_email is null or (guardian_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(guardian_email) <= 200)),

  -- Schooling
  level text not null check (level in ('primary', 'junior_secondary', 'senior_secondary', 'undergraduate', 'masters', 'phd')),
  class_year text not null check (length(trim(class_year)) between 1 and 60),
  school_name text not null check (length(trim(school_name)) between 2 and 160),
  school_type text not null check (school_type in ('public', 'private')),
  school_city text not null check (length(trim(school_city)) between 1 and 80),
  school_country text not null check (length(school_country) between 2 and 80),
  course text null check (course is null or length(course) <= 160),
  recent_results text not null check (length(trim(recent_results)) between 2 and 2000),
  achievements text null check (achievements is null or length(achievements) <= 2000),

  -- The need
  support_type text not null check (support_type in ('scholarship', 'school_fees', 'both')),
  amount_requested numeric(14, 2) not null check (amount_requested > 0 and amount_requested < 1e12),
  currency text not null check (currency in ('NGN','GHS','KES','ZAR','EGP','XOF','XAF','USD','GBP','EUR')),
  fee_period text not null check (fee_period in ('term', 'semester', 'session', 'programme')),
  fee_breakdown text null check (fee_breakdown is null or length(fee_breakdown) <= 2000),
  other_support text null check (other_support is null or length(other_support) <= 1000),
  financial_situation text not null check (length(trim(financial_situation)) between 20 and 3000),
  statement text not null check (length(trim(statement)) between 50 and 5000),
  heard_from text null check (heard_from is null or length(heard_from) <= 200),

  consented_at timestamptz not null default now(),

  -- Attaching documents after submitting (hash of a one-time token)
  upload_token_hash text null,
  upload_expires_at timestamptz null,

  -- Review (members only)
  amount_approved numeric(14, 2) null check (amount_approved is null or amount_approved >= 0),
  review_notes text null check (review_notes is null or length(review_notes) <= 5000),
  reviewed_by uuid null references public.profiles (id) on delete set null,
  reviewed_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scholarship_applications_created_idx on public.scholarship_applications (created_at desc);
create index scholarship_applications_status_idx on public.scholarship_applications (status, created_at desc);

create trigger scholarship_applications_updated_at
  before update on public.scholarship_applications
  for each row execute function public.set_updated_at();

create table public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.scholarship_applications (id) on delete cascade,
  kind text not null check (kind in ('fee_invoice', 'admission_letter', 'results', 'id_document', 'other')),
  public_id text not null unique,
  format text not null check (format in ('pdf', 'jpg', 'webp')),
  bytes int not null check (bytes > 0 and bytes <= 10485760),
  pages int null,
  width int null,
  height int null,
  original_name text null check (original_name is null or length(original_name) <= 200),
  created_at timestamptz not null default now()
);

create index application_documents_application_idx on public.application_documents (application_id);

-- Members only. Visitors go through the functions below.
revoke all on public.scholarship_applications from anon, authenticated;
revoke all on public.application_documents from anon, authenticated;
grant select, delete on public.scholarship_applications to authenticated;
grant update (status, amount_approved, review_notes, reviewed_by, reviewed_at)
  on public.scholarship_applications to authenticated;
grant select, delete on public.application_documents to authenticated;

alter table public.scholarship_applications enable row level security;
alter table public.application_documents enable row level security;

create policy "Members read applications"
  on public.scholarship_applications for select to authenticated
  using ((select public.is_member()));
create policy "Members review applications"
  on public.scholarship_applications for update to authenticated
  using ((select public.is_member()))
  with check ((select public.is_member()));
create policy "Members delete applications"
  on public.scholarship_applications for delete to authenticated
  using ((select public.is_member()));

create policy "Members read application documents"
  on public.application_documents for select to authenticated
  using ((select public.is_member()));
create policy "Members delete application documents"
  on public.application_documents for delete to authenticated
  using ((select public.is_member()));

-- Notifications about applications
alter table public.notifications
  add column application_id uuid null references public.scholarship_applications (id) on delete cascade;

-- Submitting -----------------------------------------------------------------------

/**
 * Submits an application (the server validates it first; the table checks
 * hold either way). Returns its id, a reference to quote, and a one-time
 * token for attaching documents within two hours. Limited to 3 applications
 * per phone or email a day and 300 a day overall. Both members are notified.
 */
create function public.submit_application(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_ref text;
  v_token text := encode(extensions.gen_random_bytes(24), 'hex');
  v_dob date := (p ->> 'date_of_birth')::date;
  v_phone text := p ->> 'phone';
  v_email text := nullif(lower(trim(p ->> 'email')), '');
  v_age int;
begin
  if v_dob > (now() at time zone 'Africa/Lagos')::date then
    raise exception 'date of birth is in the future' using errcode = 'P0004';
  end if;
  -- Under-18s need a parent or guardian.
  v_age := extract(year from age((now() at time zone 'Africa/Lagos')::date, v_dob));
  if v_age < 18 and (nullif(trim(p ->> 'guardian_name'), '') is null
                     or nullif(trim(p ->> 'guardian_phone'), '') is null
                     or nullif(trim(p ->> 'guardian_relationship'), '') is null) then
    raise exception 'guardian required' using errcode = 'P0001';
  end if;

  if (select count(*) from public.scholarship_applications
      where created_at > now() - interval '1 day'
        and (phone = v_phone or (v_email is not null and email = v_email))) >= 3 then
    raise exception 'too many from this applicant' using errcode = 'P0002';
  end if;
  if (select count(*) from public.scholarship_applications
      where created_at > now() - interval '1 day') >= 300 then
    raise exception 'too many today' using errcode = 'P0003';
  end if;

  loop
    v_ref := 'DLF-' || to_char(now(), 'YY') || '-' || upper(encode(extensions.gen_random_bytes(3), 'hex'));
    exit when not exists (select 1 from public.scholarship_applications where reference = v_ref);
  end loop;

  insert into public.scholarship_applications (
    reference, full_name, date_of_birth, gender, nationality, country_of_residence,
    state_region, city, email, phone,
    guardian_name, guardian_relationship, guardian_phone, guardian_email,
    level, class_year, school_name, school_type, school_city, school_country, course,
    recent_results, achievements,
    support_type, amount_requested, currency, fee_period, fee_breakdown, other_support,
    financial_situation, statement, heard_from,
    upload_token_hash, upload_expires_at
  ) values (
    v_ref, trim(p ->> 'full_name'), v_dob, nullif(p ->> 'gender', ''), p ->> 'nationality',
    p ->> 'country_of_residence', nullif(trim(p ->> 'state_region'), ''), trim(p ->> 'city'),
    v_email, v_phone,
    nullif(trim(p ->> 'guardian_name'), ''), nullif(trim(p ->> 'guardian_relationship'), ''),
    nullif(trim(p ->> 'guardian_phone'), ''), nullif(lower(trim(p ->> 'guardian_email')), ''),
    p ->> 'level', trim(p ->> 'class_year'), trim(p ->> 'school_name'), p ->> 'school_type',
    trim(p ->> 'school_city'), p ->> 'school_country', nullif(trim(p ->> 'course'), ''),
    trim(p ->> 'recent_results'), nullif(trim(p ->> 'achievements'), ''),
    p ->> 'support_type', (p ->> 'amount_requested')::numeric, p ->> 'currency', p ->> 'fee_period',
    nullif(trim(p ->> 'fee_breakdown'), ''), nullif(trim(p ->> 'other_support'), ''),
    trim(p ->> 'financial_situation'), trim(p ->> 'statement'), nullif(trim(p ->> 'heard_from'), ''),
    encode(extensions.digest(v_token, 'sha256'), 'hex'), now() + interval '2 hours'
  )
  returning id into v_id;

  insert into public.notifications
    (recipient_id, actor_id, kind, title, body, href, application_id)
  select pr.id, null, 'application', 'New application: ' || left(trim(p ->> 'full_name'), 80),
         case p ->> 'support_type' when 'scholarship' then 'Scholarship'
                                   when 'school_fees' then 'School fees support'
                                   else 'Scholarship or school fees' end
           || ' · ' || replace(initcap(replace(p ->> 'level', '_', ' ')), 'Phd', 'PhD')
           || ' · ' || v_ref,
         '/admin/foundation/' || v_id, v_id
  from public.profiles pr;

  return jsonb_build_object('id', v_id, 'reference', v_ref, 'token', v_token);
end;
$$;

/** True while the token is valid for this application; returns how many more documents fit. */
create function public.application_upload_slots(p_application uuid, p_token text)
returns int
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  ok boolean;
begin
  select a.upload_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
         and a.upload_expires_at > now()
    into ok
    from public.scholarship_applications a where a.id = p_application;
  if not coalesce(ok, false) then
    return 0;
  end if;
  return greatest(0, 6 - (select count(*)::int from public.application_documents
                          where application_id = p_application));
end;
$$;

/** Records a document the server has already checked with Cloudinary. */
create function public.add_application_document(
  p_application uuid, p_token text, p_kind text, p_public_id text, p_format text,
  p_bytes int, p_pages int, p_width int, p_height int, p_name text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.application_upload_slots(p_application, p_token) < 1 then
    raise exception 'not allowed';
  end if;
  if p_public_id !~ ('^dalin/applications/' || p_application::text || '/[0-9a-f-]{36}$') then
    raise exception 'bad file';
  end if;
  insert into public.application_documents
    (application_id, kind, public_id, format, bytes, pages, width, height, original_name)
  values
    (p_application, p_kind, p_public_id, p_format, p_bytes, p_pages, p_width, p_height, left(p_name, 200));
end;
$$;

revoke execute on function public.submit_application(jsonb) from public;
revoke execute on function public.application_upload_slots(uuid, text) from public;
revoke execute on function
  public.add_application_document(uuid, text, text, text, text, int, int, int, int, text) from public;
grant execute on function public.submit_application(jsonb) to anon, authenticated;
grant execute on function public.application_upload_slots(uuid, text) to anon, authenticated;
grant execute on function
  public.add_application_document(uuid, text, text, text, text, int, int, int, int, text)
  to anon, authenticated;
