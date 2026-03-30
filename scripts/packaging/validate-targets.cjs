#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const targets = [
  { id: 'linux', args: ['--linux', 'AppImage', 'deb', '--x64', '--dir'] },
  { id: 'win', args: ['--win', 'nsis', '--x64', '--dir'] },
  { id: 'mac', args: ['--mac', 'dmg', '--x64', '--dir'] },
];

const classify = (output) => {
  if (/Cannot find module 'dmg-license'/.test(output)) return 'missing_optional_dependency:dmg-license';
  if (/Forbidden/.test(output) && /github\.com\/electron\/electron\/releases/.test(output)) return 'external_network_block:electron_binary_download';
  if (/node-v\d+\.\d+\.\d+-headers\.tar\.gz/.test(output) && /403/.test(output)) return 'external_network_block:node_headers_download';
  return 'unknown';
};

const results = [];

for (const t of targets) {
  const cmd = ['electron-builder', ...t.args, '-c.npmRebuild=false'];
  console.log(`\n[packaging:validate] Running ${t.id}: npx ${cmd.join(' ')}`);
  const r = spawnSync('npx', cmd, { encoding: 'utf8' });
  const combined = `${r.stdout || ''}\n${r.stderr || ''}`;
  const ok = r.status === 0;
  const reason = ok ? 'ok' : classify(combined);
  results.push({ target: t.id, ok, exitCode: r.status ?? 1, reason });
  console.log(`[packaging:validate] ${t.id} => ${ok ? 'OK' : 'FAIL'} (${reason})`);
}

console.log('\n[packaging:validate] Summary');
for (const row of results) {
  console.log(`- ${row.target}: ${row.ok ? 'OK' : 'FAIL'} (exit=${row.exitCode}, reason=${row.reason})`);
}

if (results.some((r) => !r.ok)) {
  process.exit(1);
}
