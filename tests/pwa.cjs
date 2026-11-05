const assert = require('node:assert/strict');
const fs = require('node:fs');
const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
assert.equal(manifest.display, 'standalone');
assert.ok(manifest.icons.length > 0);
for (const icon of manifest.icons) assert.ok(fs.existsSync(icon.src.replace(/^\.\//,'')));
const sw = fs.readFileSync('sw.js','utf8');
for (const asset of ['index.html','manifest.webmanifest','pwa-init.js','icon.svg']) assert.ok(sw.includes(asset));
console.log('Aion PWA static checks passed');
