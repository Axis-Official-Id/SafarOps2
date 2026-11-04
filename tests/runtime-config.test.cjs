const {test}=require('node:test');
const assert=require('node:assert/strict');
const runtimeConfig=require('../scripts/runtime-config.cjs');
test('public config rejects privileged keys and never serializes server secrets',()=>{
 const old={...process.env};
 try{
  process.env.SUPABASE_URL='https://example.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY='sb_secret_forbidden';
  assert.throws(runtimeConfig,/Secret\/service-role/);
  process.env.SUPABASE_PUBLISHABLE_KEY='sb_publishable_example';
  process.env.SUPABASE_SERVICE_ROLE_KEY='must-never-leak';
  process.env.ADMIN_EMAIL='private@example.com';
  const output=runtimeConfig();
  assert.ok(output.includes('sb_publishable_example'));
  assert.ok(!output.includes('must-never-leak'));
  assert.ok(!output.includes('private@example.com'));
  delete process.env.SUPABASE_URL;
  assert.throws(runtimeConfig,/Set SUPABASE_URL/);
 }finally{process.env=old;}
});
