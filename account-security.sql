-- Apply with Supabase migrations. No plaintext passwords or invitation tokens.
create table if not exists public.safarops_invitations (
 email text primary key references public.safarops_licenses(email) on delete cascade,
 token_hash text not null unique,
 expires_at timestamptz not null default now() + interval '7 days',
 consumed_at timestamptz,
 bootstrap boolean not null default false
);
alter table public.safarops_invitations enable row level security;
revoke all on public.safarops_invitations from public, anon, authenticated;
grant all on public.safarops_invitations to service_role;
drop policy if exists invitations_no_client_access on public.safarops_invitations;
create policy invitations_no_client_access on public.safarops_invitations
 for all to anon, authenticated using (false) with check (false);
-- This historical maintenance helper must never be callable over the Data API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

create or replace function private.safarops_access()
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from auth.users u join public.safarops_licenses l on l.email=lower(u.email)
 where u.id=(select auth.uid()) and l.status='active'
 and coalesce(u.raw_app_meta_data->>'password_change_required','false') <> 'true'
 and coalesce((select auth.jwt())->'app_metadata'->>'password_change_required','false') <> 'true');
$$;
create or replace function private.is_safarops_admin()
returns boolean language sql stable security definer set search_path = '' as $$
 select private.safarops_access() and exists(select 1 from auth.users u
 join public.safarops_licenses l on l.email=lower(u.email)
 where u.id=(select auth.uid()) and l.role='superadmin' and l.status='active');
$$;
revoke all on function private.safarops_access() from public, anon;
grant execute on function private.safarops_access() to authenticated;

drop policy if exists licenses_read_self_or_admin on public.safarops_licenses;
create policy licenses_read_self_or_admin on public.safarops_licenses for select to authenticated
 using ((select private.safarops_access()) and
 (email=lower(coalesce((select auth.jwt())->>'email','')) or (select private.is_safarops_admin())));
drop policy if exists packages_owner_all on public.safarops_packages;
create policy packages_owner_all on public.safarops_packages for all to authenticated
 using ((select private.safarops_access()) and (user_id=(select auth.uid()) or (select private.is_safarops_admin())))
 with check ((select private.safarops_access()) and (user_id=(select auth.uid()) or (select private.is_safarops_admin())));
drop policy if exists jamaah_owner_all on public.safarops_jamaah;
create policy jamaah_owner_all on public.safarops_jamaah for all to authenticated
 using ((select private.safarops_access()) and (user_id=(select auth.uid()) or (select private.is_safarops_admin())))
 with check ((select private.safarops_access()) and (user_id=(select auth.uid()) or (select private.is_safarops_admin())));
drop policy if exists payments_owner_all on public.safarops_payments;
create policy payments_owner_all on public.safarops_payments for all to authenticated
 using ((select private.safarops_access()) and (user_id=(select auth.uid()) or (select private.is_safarops_admin())))
 with check ((select private.safarops_access()) and (user_id=(select auth.uid()) or (select private.is_safarops_admin())));

-- An authenticated owner can update profile fields, never role/email/status.
-- Keep the privileged implementation outside the exposed public schema.
create or replace function private.safarops_save_profile(profile jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if not private.safarops_access() then raise exception 'Access denied'; end if;
 update public.safarops_licenses set
 agency_name=coalesce(profile->>'agency_name',agency_name),
 agency_address=profile->>'agency_address', agency_phone=profile->>'agency_phone',
 director_name=profile->>'director_name', ppiu_number=profile->>'ppiu_number',
 bank_info=profile->>'bank_info', logo_base64=profile->>'logo_base64',
 banner_base64=profile->>'banner_base64', is_setup=true
 where email=(select lower(email) from auth.users where id=auth.uid());
end;
$$;
revoke all on function private.safarops_save_profile(jsonb) from public, anon;
grant execute on function private.safarops_save_profile(jsonb) to authenticated;

create or replace function public.safarops_save_profile(profile jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
begin
 perform private.safarops_save_profile(profile);
end;
$$;
revoke all on function public.safarops_save_profile(jsonb) from public, anon;
grant execute on function public.safarops_save_profile(jsonb) to authenticated;
revoke select on public.safarops_licenses from anon;
revoke execute on function public.safarops_activation_allowed(text) from anon, authenticated;

-- Service-only atomic claim prevents two requests from consuming one invitation.
create or replace function public.safarops_claim_invitation(account_email text, invitation_hash text)
returns table(bootstrap boolean) language sql security invoker set search_path = '' as $$
 update public.safarops_invitations i set consumed_at=now()
 where i.email=account_email and i.token_hash=invitation_hash and i.consumed_at is null
 and i.expires_at>now() and exists(select 1 from public.safarops_licenses l where l.email=i.email and l.status='active')
 returning i.bootstrap;
$$;
revoke all on function public.safarops_claim_invitation(text,text) from public, anon, authenticated;
grant execute on function public.safarops_claim_invitation(text,text) to service_role;

create or replace function public.safarops_account_directory()
returns table(email text,user_id uuid,activated boolean)
language sql security definer set search_path = '' as $$
 select l.email,u.id,u.id is not null from public.safarops_licenses l
 left join auth.users u on lower(u.email)=l.email order by l.email;
$$;
revoke all on function public.safarops_account_directory() from public, anon, authenticated;
grant execute on function public.safarops_account_directory() to service_role;

-- Public signup cannot claim an approved email before its private invitation.
create or replace function private.safarops_require_invitation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if not exists(select 1 from auth.users u join public.safarops_licenses l on l.email=lower(u.email)
 where u.id=new.id and l.status='active' and u.raw_app_meta_data->>'safarops_invited'='true') then
  raise exception 'Use a private administrator invitation to activate this account';
 end if;
 return new;
end;
$$;
revoke all on function private.safarops_require_invitation() from public, anon, authenticated;
create constraint trigger safarops_require_invitation after insert on auth.users
 deferrable initially deferred for each row execute function private.safarops_require_invitation();

create or replace function private.safarops_check_related_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if tg_table_name='safarops_jamaah' then
  if new.package_id is not null and not exists(select 1 from public.safarops_packages p where p.id=new.package_id and p.user_id=new.user_id) then
   raise exception 'Package must belong to the same account';
  end if;
 elsif tg_table_name='safarops_payments' then
  if not exists(select 1 from public.safarops_jamaah j where j.id=new.jamaah_id and j.user_id=new.user_id) then
   raise exception 'Jamaah must belong to the same account';
  end if;
 end if;
 return new;
end;
$$;
revoke all on function private.safarops_check_related_owner() from public, anon, authenticated;
create trigger safarops_jamaah_owner before insert or update on public.safarops_jamaah
for each row execute function private.safarops_check_related_owner();
create trigger safarops_payment_owner before insert or update on public.safarops_payments
for each row execute function private.safarops_check_related_owner();
