/**
 * Master Server Runner — Reflected XSS Lab & Attacker C2
 * Starts all three servers bound to 0.0.0.0 (enabling multi-laptop demonstrations)
 */
const { spawn } = require('child_process');
const path = require('path');
const { getLanIp } = require('./lib/network');

const lanIp = getLanIp();

console.log('================================================================');
console.log('       🛡️ REFLECTED XSS LAB & ATTACKER C2 OPERATIONS');
console.log('================================================================');

const servers = [
  { name: 'VULNERABLE TARGET', file: 'app_vulnerable.js', port: 5000, color: '\x1b[31m' },
  { name: 'PATCHED TARGET   ', file: 'app_secure.js',     port: 5001, color: '\x1b[32m' },
  { name: 'ATTACKER C2      ', file: 'app_attacker.js',   port: 5002, color: '\x1b[36m' }
];

const processes = [];

servers.forEach(srv => {
  const filePath = path.join(__dirname, srv.file);
  const child = spawn(process.execPath, [filePath], {
    stdio: 'inherit',
    env: { ...process.env, HOST: '0.0.0.0' }
  });

  child.on('error', (err) => {
    console.error(`${srv.color}[${srv.name}] Failed to start: ${err.message}\x1b[0m`);
  });

  processes.push(child);
});

console.log('\n✅ All servers initialized (Bound to 0.0.0.0):');
console.log(`\n💻 LAPTOP 1 — ATTACKER C2 CONSOLE:`);
console.log(`   - Local:   http://localhost:5002`);
console.log(`   - Network: http://${lanIp}:5002`);

console.log(`\n💻 LAPTOP 2 — VICTIM BANK (TARGET):`);
console.log(`   - Local:   http://localhost:5000`);
console.log(`   - Network: http://${lanIp}:5000`);

console.log(`\n🛡️ HARDENED BANK (DEFENSE COMPARISON):`);
console.log(`   - Local:   http://localhost:5001`);
console.log(`   - Network: http://${lanIp}:5001`);

console.log('\n👉 Press Ctrl+C at any time to terminate all servers cleanly.\n');

function shutdown() {
  console.log('\n[SHUTDOWN] Stopping all lab servers...');
  processes.forEach(p => {
    try { p.kill('SIGTERM'); } catch (e) {}
  });
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
