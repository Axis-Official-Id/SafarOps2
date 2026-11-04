const {test}=require('node:test');
const assert=require('node:assert/strict');
const auth=require('../auth-flow.js');
const input={email:'agent@example.com',password:'chosen-password',confirmation:'chosen-password',register:true,token:'a'.repeat(64)};
function client({license={role:'agent',status:'active'},licenseError=null,authError=null,activationError=null,session={access_token:'test'},metadata={}}={}){
 const calls=[];
 const user={id:'test-user',email:input.email,app_metadata:metadata};
 return {calls,functions:{async invoke(name,{body}){calls.push(body.action);return {data:activationError?{error:activationError}:{activated:true}};}},
 from(){return {select(){return {eq(){return {async maybeSingle(){calls.push('license');return {data:license,error:licenseError};}};}};}};},auth:{
 async signInWithPassword(){calls.push('signin');return {data:authError?null:{user,session},error:authError};},
 async getUser(){calls.push('getUser');return {data:{user}};},async signOut(){calls.push('signout');}}};
}
test('activation needs only email and one password without a private link',async()=>{const c=client();const result=await auth.submit(c,{email:input.email,password:input.password,register:true});assert.equal(result.user.id,'test-user');assert.deepEqual(c.calls,['activate','signin','getUser','license']);});

test('new passwords reject fewer than six characters',async()=>{const c=client();await assert.rejects(auth.submit(c,{...input,password:'12345',confirmation:'12345'}),/6 karakter/);assert.deepEqual(c.calls,[]);});
test('six-character passwords can activate an invited account',async()=>{const c=client();const result=await auth.submit(c,{...input,password:'abc123',confirmation:'abc123'});assert.equal(result.user.id,'test-user');assert.deepEqual(c.calls,['activate','signin','getUser','license']);});
test('failed invitation never authenticates',async()=>{const c=client({activationError:'Tautan sudah digunakan'});await assert.rejects(auth.submit(c,input),/sudah digunakan/);assert.deepEqual(c.calls,['activate']);});
test('activation requires real login and license validation',async()=>{const c=client();const result=await auth.submit(c,input);assert.equal(result.user.id,'test-user');assert.deepEqual(c.calls,['activate','signin','getUser','license']);});
test('wrong password is denied',async()=>{const c=client({authError:{message:'Invalid credentials'}});await assert.rejects(auth.submit(c,{...input,register:false}),/tidak sesuai/);assert.deepEqual(c.calls,['signin']);});
test('missing session is denied',async()=>{const c=client({session:null});await assert.rejects(auth.submit(c,{...input,register:false}),/Sesi masuk/);assert.deepEqual(c.calls,['signin']);});
test('blocked user signs out',async()=>{const c=client({license:{status:'blocked'}});await assert.rejects(auth.submit(c,{...input,register:false}),/diblokir/);assert.ok(c.calls.includes('signout'));});
test('missing access tables fail closed',async()=>{const c=client({licenseError:{code:'PGRST205'}});await assert.rejects(auth.submit(c,{...input,register:false}),/Data akses belum tersedia/);assert.ok(c.calls.includes('signout'));});
test('email and editable metadata do not grant admin',()=>{assert.equal(auth.isAdmin({id:'x',email:'admin@ruangkarir.site',user_metadata:{role:'superadmin'}},null),false);assert.equal(auth.isAdmin({id:'x'},{role:'superadmin',status:'active'}),true);assert.equal(auth.isAdmin({id:'x'},{role:'superadmin',status:'blocked'}),false);});
test('temporary credentials require password setup',async()=>{const c=client({metadata:{password_change_required:true}});const result=await auth.submit(c,{...input,register:false});assert.equal(result.passwordChangeRequired,true);assert.ok(!c.calls.includes('license'));});
test('missing license never grants access',async()=>{const c=client({license:null});await assert.rejects(auth.submit(c,{...input,register:false}),/belum diberi akses/);assert.ok(c.calls.includes('signout'));});
