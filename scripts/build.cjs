const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const files = ['index.html', 'admin-theme.css', 'public-site.js', 'public-config.js', 'validation.js', 'auth-flow.js', 'workspace-layout.js', 'workspace-layout.css'];
const assets = ['brand-compass.svg', 'favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'jejakimani-home-video-poster.webp'];

fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
fs.writeFileSync(path.join(dist,'runtime-config.js'), require('./runtime-config.cjs')());
for (const file of files) fs.copyFileSync(path.join(root, file), path.join(dist, file));
for (const file of assets) fs.copyFileSync(path.join(root, 'assets', file), path.join(dist, 'assets', file));
console.log(`Built ${files.length} application files and ${assets.length} assets in dist/`);
