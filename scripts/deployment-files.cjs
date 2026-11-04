// Deliberate deployment allowlist excludes .local, env files, SQL, and secrets.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const files=['index.html','admin-theme.css','public-site.js','public-config.js','validation.js','auth-flow.js','workspace-layout.js','workspace-layout.css','workspace-app.js','theme-config.js','page-navigation.js','styled-select.js','package.json','vercel.json','scripts/build.cjs','scripts/runtime-config.cjs','scripts/compose.cjs'];
for(const directory of ['pages','styles','styles/pages'])for(const name of fs.readdirSync(path.join(root,directory)))if(fs.statSync(path.join(root,directory,name)).isFile())files.push(directory+'/'+name);
for(const name of ['brand-compass.svg','favicon.svg','favicon.ico','apple-touch-icon.png','icon-192.png','icon-512.png','jejakimani-home-video-poster.webp']) files.push('assets/'+name);
process.stdout.write(JSON.stringify(files.map(file=>({file,data:fs.readFileSync(path.join(root,file)).toString('base64'),encoding:'base64'}))));
