create table if not exists employee_triggers (
  id uuid primary key default gen_random_uuid(),
  employee_name text not null,
  employee_email text not null,
  date_of_joining date not null,
  employment_status text not null default 'active',
  onboarding_form_sent boolean not null default false,
  onboarding_form_sent_at timestamptz,
  experience_form_sent boolean not null default false,
  experience_form_sent_at timestamptz,
  exit_form_sent boolean not null default false,
  exit_form_sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table employee_triggers add column if not exists onboarding_form_sent boolean not null default false;
alter table employee_triggers add column if not exists experience_form_sent boolean not null default false;
alter table employee_triggers add column if not exists exit_form_sent boolean not null default false;
