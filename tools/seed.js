/**
 * Seed script — registers N users and creates tasks for each against the running task-api.
 *
 * Usage:
 *   node tools/seed.js                        # defaults: 3 users, 4 tasks each
 *   node tools/seed.js --users 5 --tasks 3    # custom counts
 *   node tools/seed.js --seed 42              # fixed faker seed → reproducible output
 *   node tools/seed.js --save                 # write result to data/fixtures/seeded.json
 *   BASE_URL=http://staging:3001 node tools/seed.js
 */

import { faker } from '@faker-js/faker';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : fallback;
};

const USER_COUNT    = parseInt(get('--users', '3'));
const TASKS_PER_USER = parseInt(get('--tasks', '4'));
const FAKER_SEED    = args.includes('--seed') ? parseInt(get('--seed', '0')) : null;
const SAVE          = args.includes('--save');
const BASE_URL      = process.env.BASE_URL || 'http://localhost:3001';

if (FAKER_SEED !== null) faker.seed(FAKER_SEED);

// ── HTTP helpers ──────────────────────────────────────────────────────────────
async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Seed logic ────────────────────────────────────────────────────────────────
async function seedUser() {
  const username = faker.internet.username().replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20);
  const password = faker.internet.password({ length: 12, memorable: false });

  // Register the user; if already exists (e.g. re-running against a live server), log in instead
  let token;
  try {
    ({ token } = await post('/api/auth/register', { username, password }));
  } catch (err) {
    if (!err.message.includes('409')) throw err;
    ({ token } = await post('/api/auth/login', { username, password }));
  }

  const tasks = [];
  for (let i = 0; i < TASKS_PER_USER; i++) {
    const task = await post(
      '/api/tasks',
      {
        title: faker.hacker.phrase(),
        completed: faker.datatype.boolean(0.3),
      },
      token
    );
    tasks.push(task);
  }

  return { username, password, token, tasks };
}

async function run() {
  console.log(`Seeding ${USER_COUNT} users × ${TASKS_PER_USER} tasks → ${BASE_URL}`);
  if (FAKER_SEED !== null) console.log(`Faker seed: ${FAKER_SEED} (reproducible)`);

  const results = [];
  for (let i = 0; i < USER_COUNT; i++) {
    const user = await seedUser();
    console.log(`  ✓ ${user.username} (${user.tasks.length} tasks)`);
    results.push(user);
  }

  if (SAVE) {
    const outDir  = join(__dirname, '..', 'data', 'fixtures');
    const outFile = join(outDir, 'seeded.json');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(outFile, JSON.stringify(results, null, 2));
    console.log(`\nSaved → data/fixtures/seeded.json`);
  }

  console.log(`\nDone — ${results.length * TASKS_PER_USER} tasks across ${results.length} users.`);
  return results;
}

run().catch(err => { console.error(err.message); process.exit(1); });
