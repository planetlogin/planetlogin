# PlanetLogin — Bench harness

Black-box load over a running flavor → the performance leaderboard. Same scenario
for every flavor, so the numbers are comparable.

```bash
./run.sh node ../../planetlogin-svelte/build/index.js
# tune: BENCH_CONCURRENCY=50 BENCH_DURATION_MS=5000 ./run.sh <cmd>
```

Reports req/s + p50/p95/p99 for `GET /auth/config` (framework overhead — the fair
cross-flavor metric), `GET /auth/session` (JWT verify), and `POST /auth/password/login`
(argon2 cost — same lib across flavors, so it measures the runtime, not the hash).
