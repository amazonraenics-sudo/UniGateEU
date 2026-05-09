-- ============================================================
-- UniGateEU — Complete Supabase Schema
-- Run this entire file in Supabase SQL Editor
-- https://supabase.com/dashboard/project/dbpslhovztmfwyoxrjee/sql
-- ============================================================

-- ── USERS ────────────────────────────────────────────────────
create table if not exists public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text,
  avatar_url   text,
  credits      integer not null default 10,
  role         text not null default 'user' check (role in ('user', 'admin')),
  onboarding_completed boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- ── PROFILES ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users(id) on delete cascade,
  nationality           text,
  degree_level          text,
  field_of_study        text,
  gpa                   numeric(4,2),
  language_score        text,
  language_score_value  numeric(5,2),
  target_countries      text[] default '{}',
  budget_range          text,
  start_date            text,
  work_experience       integer default 0,
  research_experience   boolean default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique(user_id)
);

alter table public.profiles enable row level security;

create policy "Users can manage own profile"
  on public.profiles for all
  using (auth.uid() = user_id);

-- ── UNIVERSITIES ──────────────────────────────────────────────
create table if not exists public.universities (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  country             text not null,
  city                text not null,
  ranking             integer,
  tuition_min         integer default 0,
  tuition_max         integer,
  tuition_currency    text default 'EUR',
  acceptance_rate     numeric(5,2),
  programs            text[] default '{}',
  language_requirements jsonb default '{}',
  deadline_fall       text,
  deadline_spring     text,
  website             text,
  description         text,
  logo_url            text,
  created_at          timestamptz not null default now()
);

alter table public.universities enable row level security;

create policy "Universities are publicly readable"
  on public.universities for select
  using (true);

create policy "Only admins can modify universities"
  on public.universities for all
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- ── APPLICATIONS ─────────────────────────────────────────────
create table if not exists public.applications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  university_id  uuid references public.universities(id) on delete set null,
  program        text not null,
  status         text not null default 'researching'
                   check (status in ('researching','preparing','submitted','accepted','rejected','waitlisted')),
  deadline       date,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.applications enable row level security;

create policy "Users can manage own applications"
  on public.applications for all
  using (auth.uid() = user_id);

-- ── DOCUMENTS ────────────────────────────────────────────────
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  name         text not null,
  type         text not null default 'other'
                 check (type in ('transcript','recommendation','sop','cv','language_test','other')),
  file_url     text,
  file_size    integer,
  ai_analysis  text,
  status       text not null default 'pending'
                 check (status in ('pending','analyzing','analyzed','approved')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "Users can manage own documents"
  on public.documents for all
  using (auth.uid() = user_id);

-- ── SCHOLARSHIPS ──────────────────────────────────────────────
create table if not exists public.scholarships (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  provider     text not null,
  country      text not null,
  amount       integer,
  currency     text default 'EUR',
  deadline     text,
  eligibility  text[] default '{}',
  fields       text[] default '{}',
  link         text,
  description  text,
  created_at   timestamptz not null default now()
);

alter table public.scholarships enable row level security;

create policy "Scholarships are publicly readable"
  on public.scholarships for select
  using (true);

create policy "Only admins can modify scholarships"
  on public.scholarships for all
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- ── CREDIT TRANSACTIONS ───────────────────────────────────────
create table if not exists public.credit_transactions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  amount             integer not null,
  type               text not null check (type in ('purchase','usage','refund','bonus')),
  feature            text,
  description        text not null,
  stripe_payment_id  text,
  created_at         timestamptz not null default now()
);

alter table public.credit_transactions enable row level security;

create policy "Users can view own transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.credit_transactions for insert
  with check (auth.uid() = user_id);

-- ── NEW USER TRIGGER ──────────────────────────────────────────
-- Automatically creates a public.users row with 10 free credits
-- whenever someone signs up via Supabase Auth

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url, credits, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    10,
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── STORAGE BUCKET ────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder
create policy "Users can upload own documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Documents are publicly readable"
  on storage.objects for select
  using (bucket_id = 'documents');

create policy "Users can delete own documents"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── ADMIN HELPER ──────────────────────────────────────────────
-- Run this separately to grant yourself admin access:
-- update public.users set role = 'admin' where email = 'your@email.com';
