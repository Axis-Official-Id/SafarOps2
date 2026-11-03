const http = require('node:http');
const paths = ['/', '/admin-theme.css', '/auth-flow.js', '/public-site.js', '/public-config.js', '/validation.js', '/assets/brand-compass.svg', '/assets/favicon.svg', '/assets/favicon.ico', '/assets/apple-touch-icon.png', '/assets/icon-192.png', '/assets/icon-512.png', '/assets/jejakimani-home-video-poster.webp'];
const port = Number(process.argv[2] || process.env.PORT || 4173);
async function get(path) {
  return new Promise((resolve,reject) => http.get({ hostname: '127.0.0.1', port, path }, response => {
    response.resume(); response.on('end', () => resolve({path,status:response.statusCode,type:response.headers['content-type']}));
  }).on('error', reject));
}
(async () => {
  const results=await Promise.all(paths.map(get));
  for (const result of results) {
    if (result.status !== 200) throw new Error(`${result.path}: HTTP ${result.status}`);
  }
  const missing=await get('/assets/does-not-exist.png');
  if(missing.status!==404)throw new Error('Missing assets must return 404');
  console.log(`Local HTTP check passed: ${results.length} public paths served, missing asset returned 404.`);
})().catch(error=>{console.error(error.message);process.exitCode=1;});
