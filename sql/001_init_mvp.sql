create schema if not exists complaints;
set search_path to complaints, public;

create extension if not exists "uuid-ossp";

alter sequence if exists public.complaints_case_number_seq set schema complaints;
alter function if exists public.next_case_number() set schema complaints;
alter function if exists public.set_updated_at() set schema complaints;
alter table if exists public.institutions set schema complaints;
alter table if exists public.templates set schema complaints;
alter table if exists public.cases set schema complaints;
alter table if exists public.case_variables set schema complaints;
alter table if exists public.case_files set schema complaints;
alter table if exists public.case_artifacts set schema complaints;
alter table if exists public.case_logs set schema complaints;

create sequence if not exists complaints_case_number_seq start 1;

create or replace function next_case_number()
returns text
language plpgsql
as $$
declare
  seq_num bigint;
begin
  seq_num := nextval('complaints_case_number_seq');
  return 'CASE-' || lpad(seq_num::text, 6, '0');
end;
$$;

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  nickname text not null unique,
  password_hash text not null,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  last_used_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table users add column if not exists updated_at timestamptz not null default now();
create index if not exists idx_user_sessions_user_id on user_sessions(user_id);
create index if not exists idx_user_sessions_token_hash on user_sessions(token_hash);
create table if not exists institutions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null default 'authority',
  visibility text not null default 'public',
  owner_user_id uuid references users(id) on delete set null,
  submit_url text not null,
  max_attachments integer not null default 5,
  max_text_length integer not null default 4000,
  accepted_formats jsonb not null default '["image/jpeg","image/png"]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null default 'authority',
  visibility text not null default 'public',
  owner_user_id uuid references users(id) on delete set null,
  institution_id uuid references institutions(id) on delete set null,
  body_template text not null,
  variables_schema jsonb not null default '[]'::jsonb,
  default_values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cases (
  id uuid primary key default uuid_generate_v4(),
  case_number text not null unique default next_case_number(),
  case_status text not null default 'created',

  parent_case_id uuid references cases(id) on delete set null,
  owner_user_id uuid references users(id) on delete set null,
  institution_id uuid references institutions(id) on delete set null,
  template_id uuid references templates(id) on delete set null,

  nextcloud_case_folder text not null,
  nextcloud_incoming_folder text not null,
  nextcloud_artifacts_folder text not null,
  nextcloud_result_folder text not null,

  submission_number text,
  case_date text not null default to_char(now(), 'DD.MM.YYYY'),
  registration_date text,
  response_comment text,
  submitted_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cases add column if not exists title text;
alter table cases add column if not exists description text;
alter table cases add column if not exists parent_case_id uuid references cases(id) on delete set null;
alter table cases add column if not exists owner_user_id uuid references users(id) on delete set null;
alter table cases add column if not exists case_status text;
update cases
set case_status = case
  when exists(
    select 1
    from case_files cf
    where cf.case_id = cases.id
      and cf.file_path like cases.nextcloud_result_folder || '/%'
  ) then 'has_reply'
  when coalesce(nullif(trim(submission_number), ''), '') <> '' then 'sent'
  else 'created'
end
where coalesce(nullif(trim(case_status), ''), '') = '';
alter table cases alter column case_status set default 'created';
alter table cases alter column case_status set not null;
alter table cases add column if not exists case_date text;
alter table cases alter column case_date set default to_char(now(), 'DD.MM.YYYY');
update cases
set case_date = to_char(created_at, 'DD.MM.YYYY')
where coalesce(nullif(trim(case_date), ''), '') = '';
alter table cases alter column case_date set not null;
alter table cases add column if not exists registration_date text;
alter table cases add column if not exists response_comment text;

alter table institutions drop column if exists active;
alter table templates drop column if exists active;
alter table institutions add column if not exists category text not null default 'authority';
alter table templates add column if not exists category text not null default 'authority';
alter table institutions add column if not exists visibility text not null default 'public';
alter table templates add column if not exists visibility text not null default 'public';
alter table institutions add column if not exists owner_user_id uuid references users(id) on delete set null;
alter table templates add column if not exists owner_user_id uuid references users(id) on delete set null;

create table if not exists case_variables (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references cases(id) on delete cascade,
  var_key text not null,
  var_value text,
  created_at timestamptz not null default now(),
  unique(case_id, var_key)
);

create table if not exists case_files (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references cases(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  checksum text,
  preview_url text,
  selected_for_submission boolean not null default false,
  sort_order integer not null default 0,
  source_mtime timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists case_artifacts (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references cases(id) on delete cascade,
  artifact_type text not null,
  file_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists case_logs (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references cases(id) on delete cascade,
  action text not null,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_cases_case_number on cases(case_number);
create index if not exists idx_case_variables_case_id on case_variables(case_id);
create index if not exists idx_case_files_case_id on case_files(case_id);
create index if not exists idx_case_artifacts_case_id on case_artifacts(case_id);
create index if not exists idx_case_logs_case_id on case_logs(case_id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_templates_set_updated_at on templates;
create trigger trg_templates_set_updated_at
before update on templates
for each row
execute function set_updated_at();

drop trigger if exists trg_cases_set_updated_at on cases;
create trigger trg_cases_set_updated_at
before update on cases
for each row
execute function set_updated_at();

