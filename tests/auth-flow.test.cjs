const {test}=require('node:test');
const assert=require('node:assert/strict');
const auth=require('../auth-flow.js');
const admin='owner@example.com';
const input={email:'agent@example.com',password:'chosen-password',confirmation:'chosen-password',register:true};
function client({license={role:'agent',status:'active'},licenseError=null,authError=null,session={access_token:'test'},email=input.email}={}){
 const calls=[];
 const user={id:'test-user',email};
 const c={calls,from(){return {select(){return {eq(){return {async maybeSingle(){calls.push('license');return {data:license,error:licenseError};}};}};}};},auth:{
 async signUp(){calls.push('signup');return {data:{user,session},error:authError};},
 async signInWithPassword(){calls.push('signin');return {data:authError?null:{user,session},error:authError};},
 async getUser(){calls.push('getUser');return {data:{user}};},async signOut(){calls.push('signout');}}};return c;
}
test('activation rejects mismatching confirmation before contacting provider',async()=>{const c=client();await assert.rejects(auth.submit(c,{...input,confirmation:'different'},admin),/Konfirmasi/);assert.deepEqual(c.calls,[]);});
test('signup without a session waits for email confirmation',async()=>{const c=client({session:null});assert.deepEqual(await auth.submit(c,input,admin),{pendingConfirmation:true});assert.ok(!c.calls.includes('getUser'));});
test('rate limiting never produces a fallback authenticated user',async()=>{const c=client({authError:{status:429,message:'rate limited'}});await assert.rejects(auth.submit(c,input,admin),/Terlalu banyak/);assert.ok(!c.calls.includes('getUser'));});
test('wrong password cannot enter workspace',async()=>{const c=client({authError:{message:'Invalid login credentials'}});await assert.rejects(auth.submit(c,{...input,register:false},admin),/tidak sesuai/);assert.deepEqual(c.calls,['signin']);});
test('blocked users are signed out after authenticated license check',async()=>{const c=client({license:{status:'blocked'}});await assert.rejects(auth.submit(c,{...input,register:false},admin),/diblokir/);assert.ok(c.calls.includes('signout'));});
test('missing access tables report setup error, including for admin',async()=>{const c=client({licenseError:{code:'PGRST205'}});await assert.rejects(auth.submit(c,{...input,email:admin},admin),/Data akses belum tersedia/);assert.ok(!c.calls.includes('signup'));});
test('approved ordinary user signs in without administrator privileges',async()=>{const c=client();const result=await auth.submit(c,{...input,register:false},admin);assert.equal(result.user.email,input.email);assert.equal(auth.isAdmin(result.user,result.license,admin),false);});
test('admin substring and user metadata cannot grant administrator access',()=>{assert.equal(auth.isAdmin({email:'admin-fake@example.com',user_metadata:{role:'superadmin'}},{role:'agent'},admin),false);assert.equal(auth.isAdmin({email:admin},null,admin),true);});
