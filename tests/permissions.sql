-- Transaction-only integration test: every fixture and account mutation rolls back.
begin;
do $$
declare
 a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); p uuid:=gen_random_uuid(); q uuid:=gen_random_uuid();
 j uuid:=gen_random_uuid(); owner_id uuid; count_rows integer;
begin
 insert into public.safarops_licenses(email) values ('security-a@safarops.invalid'),('security-b@safarops.invalid');
 insert into auth.users(id,email,raw_app_meta_data) values
 (a,'security-a@safarops.invalid','{"safarops_invited":true}'),
 (b,'security-b@safarops.invalid','{"safarops_invited":true}');
 set constraints auth.safarops_require_invitation immediate;
 insert into public.safarops_packages(id,user_id,code,name) values(p,a,'TEST-A','Account A'),(q,b,'TEST-B','Account B');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated','email','security-a@safarops.invalid')::text,true);
 execute 'set local role authenticated';
 select count(*) into count_rows from public.safarops_packages;
 if count_rows<>1 then raise exception 'Cross-account read isolation failed'; end if;
 update public.safarops_licenses set role='superadmin' where email='security-a@safarops.invalid';
 get diagnostics count_rows=row_count;
 if count_rows<>0 then raise exception 'Self privilege escalation was permitted'; end if;
 perform public.safarops_save_profile('{"agency_name":"Security Test"}');
 if not exists(select 1 from public.safarops_licenses where agency_name='Security Test') then raise exception 'Owner profile update failed'; end if;
 begin
  insert into public.safarops_jamaah(user_id,package_id,jamaah_code,full_name) values(a,q,'WRONG','Wrong account');
  raise exception 'Cross-account package reference was permitted';
 exception when raise_exception then
  if sqlerrm<>'Package must belong to the same account' then raise; end if;
 end;
 insert into public.safarops_jamaah(id,user_id,package_id,jamaah_code,full_name) values(j,a,p,'RIGHT','Right account');
 insert into public.safarops_payments(user_id,jamaah_id,trx_code,amount) values(a,j,'RIGHT',1);
 execute 'reset role';
 update public.safarops_licenses set status='blocked' where email='security-a@safarops.invalid';
 execute 'set local role authenticated';
 select count(*) into count_rows from public.safarops_packages;
 if count_rows<>0 then raise exception 'Blocked account retained read access'; end if;
 execute 'reset role';
 select id into owner_id from auth.users where email='admin@ruangkarir.site';
 if owner_id is null then raise exception 'Admin account missing'; end if;
 update auth.users set raw_app_meta_data=raw_app_meta_data || '{"password_change_required":false}'::jsonb where id=owner_id;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated','email','admin@ruangkarir.site','app_metadata',jsonb_build_object('password_change_required',false))::text,true);
 execute 'set local role authenticated';
 select count(*) into count_rows from public.safarops_packages;
 if count_rows<>2 then raise exception 'Admin could not read every account'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated','email','admin@ruangkarir.site','app_metadata',jsonb_build_object('password_change_required',true))::text,true);
 select count(*) into count_rows from public.safarops_packages;
 if count_rows<>0 then raise exception 'Stale temporary credential token retained access'; end if;
 execute 'reset role';
end;
$$;
rollback;
select 'PASS: owner isolation, profile saving, cross-account references, privilege escalation denial, blocked account denial, admin access, stale temporary token denial. All fixtures rolled back.' as result;
