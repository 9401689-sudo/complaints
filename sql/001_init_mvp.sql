create extension if not exists "uuid-ossp";

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

create table if not exists institutions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  submit_url text not null,
  max_attachments integer not null default 5,
  max_text_length integer not null default 4000,
  accepted_formats jsonb not null default '["image/jpeg","image/png"]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  institution_id uuid references institutions(id) on delete set null,
  body_template text not null,
  variables_schema jsonb not null default '[]'::jsonb,
  default_values jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cases (
  id uuid primary key default uuid_generate_v4(),
  case_number text not null unique default next_case_number(),

  institution_id uuid references institutions(id) on delete set null,
  template_id uuid references templates(id) on delete set null,

  nextcloud_case_folder text not null,
  nextcloud_incoming_folder text not null,
  nextcloud_artifacts_folder text not null,
  nextcloud_result_folder text not null,

  submission_number text,
  submitted_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
