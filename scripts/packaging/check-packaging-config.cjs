#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const required = [
  'package.json',
  'build/installer.nsh',
  'resources',
  'dist/electron/app/electron/main.js',
  'dist/renderer/index.html',
];

let failed = false;
for (const rel of required) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    failed = true;
    console.error(`[packaging:check] missing: ${rel}`);
  }
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const build = pkg.build || {};

const hasTargets = Boolean(build.win && build.mac && build.linux);
if (!hasTargets) {
  failed = true;
  console.error('[packaging:check] missing one or more platform targets: win/mac/linux');
}

if (!Array.isArray(build.extraResources) || build.extraResources.length === 0) {
  failed = true;
  console.error('[packaging:check] extraResources is empty');
}

if (failed) {
  process.exit(1);
}

console.log('[packaging:check] OK - packaging base config is present for win/mac/linux');
