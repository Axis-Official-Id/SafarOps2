const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
global.Deno={env:{get:name=>name==='SUPABASE_URL'?'https://service.invalid':'server-only-test-key'}};
const source=fs.readFileSync(require('node:path').join(__dirname,'../supabase/functions/safarops-accounts/index.ts'),'utf8');
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const token='a'.repeat(64);
const jwt=claims=>'header.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.verified-by-provider-in-test';
async function invoke(body,routes={},claims={}){
 const requests=[];const original=global.fetch;
 global.fetch=async(url,options={})=>{
  const path=new URL(url).pathname; const payload=options.body?JSON.parse(options.body):null;
  requests.push({path,method:options.method,body:payload,url});
  const route=routes[path];
  if(!route)throw Error('Unexpected provider call: '+path);
  const value=typeof route==='function'?route({payload,url}):route;
  return new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json'}});
 };
 try{const {handler}=await modulePromise;const response=await handler(new Request('https://edge.invalid',{method:'POST',headers:{Authorization:'Bearer '+jwt(claims)},body:JSON.stringify(body)}));return {status:response.status,body:await response.json(),requests};}
 finally{global.fetch=original;}
}
const user={id:'provider-user-id',email:'agent@example.com',app_metadata:{}};
test('server rejects activation and password changes shorter than six characters',async()=>{
 const activation=await invoke({action:'activate',email:user.email,token,password:'abc12'});
 assert.equal(activation.status,400);assert.equal(activation.requests.length,0);
 const change=await invoke({action:'change-password',password:'abc12',token},{'/auth/v1/user':{...user,app_metadata:{password_change_required:true}},'/rest/v1/safarops_licenses':[{role:'agent',status:'active'}]});
 assert.equal(change.status,400);assert.equal(change.requests.length,2);
});
test('activation claims a single-use invite before creating a confirmed account',async()=>{
 const r=await invoke({action:'activate',email:user.email,token,password:'abc123'},{
  '/rest/v1/safarops_invitations':[{bootstrap:false}],'/rest/v1/rpc/safarops_claim_invitation':[{bootstrap:false}],'/auth/v1/admin/users':{id:user.id}
 });
 assert.equal(r.status,200);assert.equal(r.requests[1].body.invitation_hash,createHash('sha256').update(token).digest('hex'));
 assert.equal(r.requests[2].body.email_confirm,true);assert.equal(r.requests[2].body.app_metadata.safarops_invited,true);
});
test('a consumed invitation never creates or overwrites an account',async()=>{
 const r=await invoke({action:'activate',email:user.email,token,password:'private-strong-password'},{'/rest/v1/safarops_invitations':[{bootstrap:false}],'/rest/v1/rpc/safarops_claim_invitation':[]});
 assert.equal(r.status,403);assert.equal(r.requests.length,2);
});
test('an ordinary invite cannot use bootstrap mode',async()=>{
 const r=await invoke({action:'bootstrap',email:user.email,token,password:'123456'},{'/rest/v1/safarops_invitations':[{bootstrap:false}]});assert.equal(r.status,403);assert.equal(r.requests.length,1);
});
test('an agent cannot list all accounts',async()=>{
 const r=await invoke({action:'accounts'},{'/auth/v1/user':user,'/rest/v1/safarops_licenses':[{role:'agent',status:'active'}]});assert.equal(r.status,403);
});
test('blocked administrators cannot use management endpoints',async()=>{
 const r=await invoke({action:'invite',email:'new@example.com'},{'/auth/v1/user':user,'/rest/v1/safarops_licenses':[{role:'superadmin',status:'blocked'}]});assert.equal(r.status,403);
});
test('temporary admin password alone cannot rotate the password',async()=>{
 const r=await invoke({action:'change-password',password:'a-new-strong-password'},{'/auth/v1/user':{...user,app_metadata:{password_change_required:true}},'/rest/v1/safarops_licenses':[{role:'superadmin',status:'active'}]},{app_metadata:{password_change_required:true}});assert.equal(r.status,403);assert.equal(r.requests.length,2);
});
test('old temporary tokens stay denied after setup has completed',async()=>{
 const r=await invoke({action:'accounts'},{'/auth/v1/user':user},{app_metadata:{password_change_required:true}});assert.equal(r.status,401);assert.equal(r.requests.length,1);
});
test('setup with a valid private token rotates password and revokes refresh sessions',async()=>{
 const r=await invoke({action:'change-password',password:'a-new-strong-password',token},{'/auth/v1/user':{...user,app_metadata:{password_change_required:true}},'/rest/v1/safarops_licenses':[{role:'superadmin',status:'active'}],'/rest/v1/safarops_invitations':[{expires_at:new Date(Date.now()+60000).toISOString()}],'/auth/v1/admin/users/provider-user-id':{},'/auth/v1/logout':{}},{app_metadata:{password_change_required:true}});
 assert.equal(r.status,200);assert.equal(r.requests[3].body.app_metadata.password_change_required,false);assert.equal(r.requests[4].path,'/auth/v1/logout');assert.ok(r.requests[4].url.endsWith('?scope=global'));
});
