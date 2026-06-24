// PlanetLogin bench harness — black-box load over a running flavor's endpoints.
// Measures req/s + latency percentiles. Light endpoints (config/session) reflect
// framework overhead (the fair cross-flavor metric); password reflects argon2 cost
// (same lib across flavors). Pure Node, no deps.
const BASE = (process.env.PLANETLOGIN_TEST_URL || 'http://127.0.0.1:8810').replace(/\/$/, '');
const DURATION = Number(process.env.BENCH_DURATION_MS || 3000);
const CONCURRENCY = Number(process.env.BENCH_CONCURRENCY || 20);
const USER = 'demo@planetlogin.test', PASS = 'planet42';

const drain = async (res) => { await res.text(); return res; };
const post = (p, b) => fetch(BASE + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) });

async function login() {
  const r = await post('/auth/password/login', { identifier: USER, password: PASS });
  return (await r.json()).token;
}

async function measure(name, makeReq) {
  const lat = []; let count = 0, errors = 0;
  const end = performance.now() + DURATION;
  async function worker() {
    while (performance.now() < end) {
      const t0 = performance.now();
      try { const r = await makeReq(); await drain(r); if (r.status >= 500) errors++; }
      catch { errors++; }
      lat.push(performance.now() - t0); count++;
    }
  }
  const t0 = performance.now();
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const secs = (performance.now() - t0) / 1000;
  lat.sort((a, b) => a - b);
  const pct = (p) => lat.length ? +lat[Math.min(lat.length - 1, Math.floor(lat.length * p))].toFixed(1) : 0;
  return { name, rps: Math.round(count / secs), p50: pct(0.5), p95: pct(0.95), p99: pct(0.99), n: count, errors };
}

const token = await login();
const scenarios = [
  ['GET /auth/config', () => fetch(BASE + '/auth/config')],
  ['GET /auth/session', () => fetch(BASE + '/auth/session', { headers: { authorization: `Bearer ${token}` } })],
  ['POST /auth/password/login (argon2)', () => post('/auth/password/login', { identifier: USER, password: PASS })],
];

const rows = [];
for (const [name, fn] of scenarios) { await measure(name, fn); rows.push(await measure(name, fn)); } // 1 warmup + 1 measured

console.log(`\nPlanetLogin bench · ${BASE} · ${CONCURRENCY} conc · ${DURATION}ms each\n`);
console.log('| endpoint | req/s | p50 ms | p95 ms | p99 ms | errors |');
console.log('|---|--:|--:|--:|--:|--:|');
for (const r of rows) console.log(`| ${r.name} | ${r.rps} | ${r.p50} | ${r.p95} | ${r.p99} | ${r.errors} |`);
console.log('\n' + JSON.stringify({ base: BASE, concurrency: CONCURRENCY, results: rows }));
