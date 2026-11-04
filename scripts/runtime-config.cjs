const fs = require('node:fs');
const path = require('node:path');
function runtimeConfig() {
  // Explicit allowlist: never serialize process.env or server credentials.
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || '';
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url) || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    throw new Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY before building. Secret/service-role keys are forbidden.');
  }
  return 'window.SAFAROPS_CONFIG = Object.freeze('+JSON.stringify({CLOUD_ENDPOINT:url,CLOUD_PUBLIC_KEY:key})+');\n';
}
module.exports = runtimeConfig;
if(require.main===module) fs.writeFileSync(path.join(__dirname,'..','runtime-config.js'),runtimeConfig());
