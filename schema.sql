-- SafarOps2 initial Supabase schema
-- Run once in Supabase Dashboard > SQL Editor for project ordxatirqolmduiferjk.
-- This creates an owner whitelist row for admin@ruangkarir.site. It does not
-- create an Auth user or password. Activate that email in the app after running
-- this file, then choose a password in the activation screen.

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.safarops_licenses (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(trim(email))),
  agency_name text not null default 'Belum Setup',
  ppiu_number text,
  agency_address text,
  agency_phone text,
  director_name text,
  bank_info text,
  logo_base64 text,
  banner_base64 text,
  role text not null default 'agent' check (role in ('agent','superadmin')),
  status text not null default 'active' check (status in ('active','frozen','blocked')),
  is_setup boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.safarops_packages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  name text not null,
  departure_date date,
  return_date date,
  airline text,
  duration_days integer not null default 9,
  quota integer not null default 40,
  price numeric(14,2) not null default 32000000,
  status text not null default 'Open',
  theme text not null default 'makkah',
  created_at timestamptz not null default now()
);

create table if not exists public.safarops_jamaah (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id uuid references public.safarops_packages(id) on delete set null,
  jamaah_code text not null,
  nik text,
  full_name text not null,
  passport_name text,
  gender text,
  birth_place text,
  birth_date date,
  phone text,
  email text,
  address text,
  package_price numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  crm_stage text not null default 'Leads Baru',
  doc_ktp boolean not null default false,
  doc_kk boolean not null default false,
  doc_passport boolean not null default false,
  doc_photo boolean not null default false,
  doc_vaccine boolean not null default false,
  passport_number text,
  passport_expiry date,
  rooming text,
  mahram_group text,
  mahram_relation text,
  imigrasi_city text,
  job_company text,
  created_at timestamptz not null default now()
);

create table if not exists public.safarops_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  jamaah_id uuid not null references public.safarops_jamaah(id) on delete cascade,
  trx_code text not null,
  payment_date date not null default current_date,
  amount numeric(14,2) not null check (amount >= 0),
  method text not null default 'Transfer',
  status text not null default 'Confirmed',
  reference_note text,
  created_at timestamptz not null default now()
);

create index if not exists safarops_packages_user_departure_idx on public.safarops_packages(user_id,departure_date);
create index if not exists safarops_jamaah_user_created_idx on public.safarops_jamaah(user_id,created_at desc);
create index if not exists safarops_payments_user_date_idx on public.safarops_payments(user_id,payment_date desc);
create index if not exists safarops_payments_jamaah_idx on public.safarops_payments(jamaah_id);

alter table public.safarops_licenses enable row level security;
alter table public.safarops_packages enable row level security;
alter table public.safarops_jamaah enable row level security;
alter table public.safarops_payments enable row level security;

create or replace function private.is_safarops_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.safarops_licenses l
    where l.email = lower(coalesce(auth.jwt()->>'email',''))
      and l.role = 'superadmin' and l.status = 'active'
  );
$$;
revoke all on function private.is_safarops_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_safarops_admin() to authenticated;

create or replace function public.safarops_activation_allowed(account_email text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.safarops_licenses l
    where l.email = lower(trim(account_email)) and l.status = 'active'
  );
$$;
revoke all on function public.safarops_activation_allowed(text) from public;
grant execute on function public.safarops_activation_allowed(text) to anon, authenticated;

grant select on public.safarops_licenses to anon, authenticated;
grant insert, update, delete on public.safarops_licenses to authenticated;
grant select, insert, update, delete on public.safarops_packages, public.safarops_jamaah, public.safarops_payments to authenticated;

drop policy if exists licenses_read_self_or_admin on public.safarops_licenses;
create policy licenses_read_self_or_admin on public.safarops_licenses for select to authenticated
  using (email = lower(coalesce(auth.jwt()->>'email','')) or private.is_safarops_admin());
drop policy if exists licenses_admin_insert on public.safarops_licenses;
create policy licenses_admin_insert on public.safarops_licenses for insert to authenticated
  with check (private.is_safarops_admin());
drop policy if exists licenses_admin_update on public.safarops_licenses;
create policy licenses_admin_update on public.safarops_licenses for update to authenticated
  using (private.is_safarops_admin()) with check (private.is_safarops_admin());
drop policy if exists licenses_admin_delete on public.safarops_licenses;
create policy licenses_admin_delete on public.safarops_licenses for delete to authenticated
  using (private.is_safarops_admin());

drop policy if exists packages_owner_all on public.safarops_packages;
create policy packages_owner_all on public.safarops_packages for all to authenticated
  using (user_id = (select auth.uid()) or private.is_safarops_admin())
  with check (user_id = (select auth.uid()) or private.is_safarops_admin());
drop policy if exists jamaah_owner_all on public.safarops_jamaah;
create policy jamaah_owner_all on public.safarops_jamaah for all to authenticated
  using (user_id = (select auth.uid()) or private.is_safarops_admin())
  with check (user_id = (select auth.uid()) or private.is_safarops_admin());
drop policy if exists payments_owner_all on public.safarops_payments;
create policy payments_owner_all on public.safarops_payments for all to authenticated
  using (user_id = (select auth.uid()) or private.is_safarops_admin())
  with check (user_id = (select auth.uid()) or private.is_safarops_admin());

insert into public.safarops_licenses(email,agency_name,role,status,is_setup)
values ('admin@ruangkarir.site','SafarOps HQ','superadmin','active',true)
on conflict (email) do update set role='superadmin', status='active';

-- After this script succeeds, use the app's "Aktivasi Kata Sandi" option with
-- admin@ruangkarir.site. Choose a password there; this SQL never stores a password.
