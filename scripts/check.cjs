const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'admin-theme.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'public-site.js'), 'utf8');
const assets = [...new Set([...html.matchAll(/(?:src|href|content)=["'](?:https?:\/\/[^"']+)?\/?(assets\/[^"']+)["']/g)].map(match => match[1]))];

for (const asset of assets) {
  if (!fs.existsSync(path.join(root, asset))) throw new Error(`Missing public asset: ${asset}`);
}
for (const [name, text] of [['index.html', html], ['landing.css', css], ['public-site.js', js], ['validation.js', fs.readFileSync(path.join(root, 'validation.js'), 'utf8')]]) {
  if (!text.trim()) throw new Error(`${name} is empty`);
}
if (html.includes('id="public-view"') || !html.includes('id="auth-password-confirm"')) throw new Error('Login entry point missing');
if (!html.includes('id="auth-password"') || !html.includes('minlength="6"')) throw new Error('Existing sign-in validation changed');
if (!js.includes('App.init()')) throw new Error('Workspace initialization missing');
console.log(`Source check passed: ${assets.length} referenced local assets present.`);
for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new (require('node:vm').Script)(script[1]);
