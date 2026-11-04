// Secrets stay in Supabase's Edge Function environment, never browser bundles.
const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store'};
const json = (body, status=200) => new Response(JSON.stringify(body), {status,headers:{...cors,'Content-Type':'application/json'}});
const hash = async (token) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const randomHex = (bytes=32) => Array.from(crypto.getRandomValues(new Uint8Array(bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
export async function handler(req) {
 if(req.method==='OPTIONS') return new Response(null,{headers:cors});
 if(req.method!=='POST') return json({error:'Method not allowed'},405);
 if(Number(req.headers.get('content-length')||0)>10000) return json({error:'Request too large'},413);
 const url=Deno.env.get('SUPABASE_URL'), key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 async function api(path, method='GET', body, bearer=key) {
  const res=await fetch(url+path,{method,headers:{apikey:key,Authorization:'Bearer '+bearer,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await res.json().catch(()=>null);
  if(!res.ok) {
   console.error('Account API failure',{path:path.split('?')[0],status:res.status,code:data?.code,message:data?.msg||data?.message});
   throw new Error('Database request failed');
  }
  return data;
 }
 try {
  const raw=await req.text(); if(raw.length>10000) return json({error:'Request too large'},413);
  const input=JSON.parse(raw), email=String(input.email||'').trim().toLowerCase();
  if(input.action==='activate' || input.action==='bootstrap') {
   const password=input.password, token=String(input.token||'');
   const initial=input.action==='bootstrap';
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[a-f0-9]{64}$/.test(token) || typeof password!=='string' || password.length<6 || password.length>128)
    return json({error:'Gunakan tautan aktivasi administrator dan kata sandi minimal 6 karakter.'},400);
   const digest=await hash(token);
   // Match mode before claiming; ordinary invitation cannot bootstrap a weak password.
   const invitations=await api('/rest/v1/safarops_invitations?email=eq.'+encodeURIComponent(email)+'&token_hash=eq.'+digest+'&select=bootstrap');
   if(!invitations.length || invitations[0].bootstrap!==initial) return json({error:'Tautan aktivasi tidak valid atau kedaluwarsa.'},403);
   const claimed=await api('/rest/v1/rpc/safarops_claim_invitation','POST',{account_email:email,invitation_hash:digest});
   if(!claimed.length) return json({error:'Tautan aktivasi tidak valid, sudah digunakan, atau kedaluwarsa.'},403);
   try {
    await api('/auth/v1/admin/users','POST',{email,password,email_confirm:true,app_metadata:{safarops_invited:true,password_change_required:initial}});
   } catch {
    // Never overwrite an existing account's password via an activation invitation.
    return json({error:'Akun tidak dapat diaktifkan. Jika sudah aktif, masuk dengan kata sandi Anda; jika belum, minta tautan baru dari administrator.'},409);
   }
   return json({activated:true});
  }
  const bearer=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  let user;
  try {user=await api('/auth/v1/user','GET',undefined,bearer);} catch {return json({error:'Silakan masuk kembali.'},401);}
  // Decode claims only after Supabase has verified the bearer token.
  const claims=JSON.parse(atob(bearer.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
  if(claims.app_metadata?.password_change_required && !user.app_metadata?.password_change_required) return json({error:'Silakan masuk kembali dengan kata sandi baru.'},401);
  const licenses=await api('/rest/v1/safarops_licenses?email=eq.'+encodeURIComponent(user.email.toLowerCase())+'&select=role,status');
  if(!licenses.length || licenses[0].status!=='active') return json({error:'Akses akun tidak aktif.'},403);
  if(input.action==='change-password') {
   if(!user.app_metadata?.password_change_required) return json({error:'Setup kata sandi sudah selesai.'},403);
   if(typeof input.password!=='string' || input.password.length<6 || input.password.length>128) return json({error:'Kata sandi baru minimal 6 karakter.'},400);
   if(user.app_metadata?.password_change_required) {
    const setupToken=String(input.token||'');
    if(!/^[a-f0-9]{64}$/.test(setupToken)) return json({error:'Buka tautan setup admin pribadi untuk mengganti kata sandi sementara.'},403);
    const setup=await api('/rest/v1/safarops_invitations?email=eq.'+encodeURIComponent(user.email.toLowerCase())+'&token_hash=eq.'+await hash(setupToken)+'&bootstrap=eq.true&select=expires_at');
    if(!setup.length || new Date(setup[0].expires_at).getTime()<Date.now()) return json({error:'Tautan setup admin tidak valid atau kedaluwarsa.'},403);
   }
   await api('/auth/v1/admin/users/'+user.id,'PUT',{password:input.password,app_metadata:{...user.app_metadata,password_change_required:false}});
   await api('/auth/v1/logout?scope=global','POST',undefined,bearer);
   return json({updated:true});
  }
  if(user.app_metadata?.password_change_required || licenses[0].role!=='superadmin') return json({error:'Akses administrator diperlukan.'},403);
  if(input.action==='accounts') return json({accounts:await api('/rest/v1/rpc/safarops_account_directory','POST',{})});
  if(input.action==='invite') {
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({error:'Format email tidak valid.'},400);
   const existing=await api('/rest/v1/safarops_licenses?email=eq.'+encodeURIComponent(email)+'&select=email,status');
   if(existing.length && existing[0].status!=='active') return json({error:'Aktifkan akun sebelum membuat undangan.'},400);
   if(!existing.length) await api('/rest/v1/safarops_licenses','POST',{email,role:input.role==='superadmin'?'superadmin':'agent',status:'active'});
   const token=randomHex();
   const expires_at=new Date(Date.now()+7*86400000).toISOString();
   // Upsert without exposing invitation hashes to any signed-in client.
   const res=await fetch(url+'/rest/v1/safarops_invitations?on_conflict=email',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},body:JSON.stringify({email,token_hash:await hash(token),expires_at,consumed_at:null,bootstrap:false})});
   if(!res.ok) throw new Error('Invitation failed');
   return json({email,token,expires_at});
  }
  if(input.action==='set-role') {
   const role=input.role==='superadmin'?'superadmin':'agent';
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({error:'Format email tidak valid.'},400);
   const target=await api('/rest/v1/safarops_licenses?email=eq.'+encodeURIComponent(email)+'&select=email,role,status');
   if(!target.length) return json({error:'Akun tidak ditemukan.'},404);
   if(target[0].role==='superadmin' && role==='agent') {
    if(email===user.email.toLowerCase()) return json({error:'Anda tidak dapat menurunkan peran akun sendiri.'},400);
    const admins=await api('/rest/v1/safarops_licenses?role=eq.superadmin&status=eq.active&select=email');
    if(admins.length<=1) return json({error:'Minimal satu Super Admin aktif harus dipertahankan.'},400);
   }
   await api('/rest/v1/safarops_licenses?email=eq.'+encodeURIComponent(email),'PATCH',{role});
   return json({email,role});
  }
  if(input.action==='reset-password') {
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({error:'Format email tidak valid.'},400);
   const target=await api('/rest/v1/safarops_licenses?email=eq.'+encodeURIComponent(email)+'&select=email,status');
   if(!target.length || target[0].status!=='active') return json({error:'Akun harus berstatus aktif sebelum kata sandi direset.'},400);
   const directory=await api('/rest/v1/rpc/safarops_account_directory','POST',{});
   const account=directory.find((item)=>String(item.email||'').toLowerCase()===email);
   if(!account?.user_id) return json({error:'Akun belum diaktifkan. Gunakan tautan aktivasi terlebih dahulu.'},400);
   if(account.user_id===user.id) return json({error:'Gunakan pengaturan akun untuk mengganti kata sandi Super Admin yang sedang masuk.'},400);
   const authUser=await api('/auth/v1/admin/users/'+account.user_id);
   const token=randomHex();
   const temporary_password='S!'+randomHex(12);
   const expires_at=new Date(Date.now()+24*60*60*1000).toISOString();
   const invitation=await fetch(url+'/rest/v1/safarops_invitations?on_conflict=email',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},body:JSON.stringify({email,token_hash:await hash(token),expires_at,consumed_at:null,bootstrap:true})});
   if(!invitation.ok) throw new Error('Password reset setup failed');
   await api('/auth/v1/admin/users/'+account.user_id,'PUT',{password:temporary_password,app_metadata:{...(authUser.app_metadata||{}),safarops_invited:true,password_change_required:true}});
   return json({email,temporary_password,token,expires_at});
  }
  return json({error:'Unknown action'},400);
 } catch {return json({error:'Permintaan gagal. Silakan coba kembali.'},400);}
}
if(import.meta.main) Deno.serve(handler);
