#!/usr/bin/env node
/**
 * Load test: Cloudflare Worker AI endpoint
 * Creates a disposable test user, gets JWT, fires concurrent requests.
 * Usage: node scripts/load-test.mjs
 */

const SUPABASE_URL = 'https://ufqjwuegvtnmrxpdlxws.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmcWp3dWVndnRubXJ4cGRseHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDcwODcsImV4cCI6MjA4Nzc4MzA4N30.B15W29zRLMMU7nGRwef1Luh8hnoEbczUfx-0f2XYtRQ';
const WORKER_URL = 'https://coupleai-auth.nihatavci.workers.dev';
const CONCURRENCY = 20;
const DURATION_MS = 30_000;

const TEST_EMAIL = `loadtest+${Date.now()}@mailinator.com`;
const TEST_PASSWORD = 'LoadTest123!';

async function signUp() {
  console.log(`[auth] Creating test user: ${TEST_EMAIL}`);
  const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const data = await r.json();
  if (!data.access_token) throw new Error(`Sign-up failed: ${JSON.stringify(data)}`);
  console.log(`[auth] Got JWT (${data.access_token.length} chars)`);
  return data.access_token;
}

async function fireRequest(jwt, idx) {
  const start = Date.now();
  try {
    const r = await fetch(`${WORKER_URL}/api/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `Load test request ${idx}. Suggest one short flirty reply.` }],
        model: 'gemini-2.0-flash',
      }),
      signal: AbortSignal.timeout(35_000),
    });
    const elapsed = Date.now() - start;
    return { status: r.status, elapsed };
  } catch (err) {
    return { status: 'ERR', elapsed: Date.now() - start, err: err.message };
  }
}

async function runLoadTest(jwt) {
  const results = [];
  const deadline = Date.now() + DURATION_MS;
  let reqIdx = 0;

  console.log(`\n[load] Firing ${CONCURRENCY} concurrent workers for ${DURATION_MS / 1000}s...\n`);

  async function worker() {
    while (Date.now() < deadline) {
      const idx = ++reqIdx;
      const result = await fireRequest(jwt, idx);
      results.push(result);
      const bar = result.status === 200 ? '✓' : result.status === 429 ? '~' : '✗';
      process.stdout.write(`${bar}${result.status}(${result.elapsed}ms) `);
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);
  console.log('\n');
  return results;
}

function summarize(results) {
  const byStatus = {};
  const latencies = [];
  let errors = 0;

  for (const r of results) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    if (r.status === 200 || r.status === 429) latencies.push(r.elapsed);
    if (r.status === 'ERR' || (r.status >= 500)) errors++;
  }

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] ?? 0;

  console.log('=== RESULTS ===');
  console.log(`Total requests: ${results.length}`);
  console.log(`Status breakdown: ${JSON.stringify(byStatus)}`);
  console.log(`Latency (p50/p95/p99): ${p50}ms / ${p95}ms / ${p99}ms`);
  console.log(`Hard errors (500+/ERR): ${errors}`);
  console.log('');

  if (errors > 0) {
    console.log('❌ FAIL — hard errors detected. Worker may be crashing under load.');
  } else if (!byStatus[429]) {
    console.log('⚠️  WARNING — no 429s seen. Rate limiting may not be firing.');
  } else if (p99 > 30_000) {
    console.log('⚠️  WARNING — p99 > 30s. Some requests hitting timeout.');
  } else {
    console.log('✅ PASS — no hard errors, rate limiting active, latency acceptable.');
  }
}

async function main() {
  try {
    const jwt = await signUp();
    const results = await runLoadTest(jwt);
    summarize(results);
  } catch (err) {
    console.error('[fatal]', err.message);
    process.exit(1);
  }
}

main();
