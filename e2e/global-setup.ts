import { readFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const FIXTURES_PATH = join(process.cwd(), 'data', 'fixtures', 'seeded.json');

/**
 * Registers each fixture user against the running task-api before tests run.
 * Tests that want a known user can import FIXTURE_USERS from fixtures.ts
 * instead of generating a random one.
 *
 * This is opt-in — most tests still use uniqueUser() for full isolation.
 * Fixture users are useful when a test needs pre-existing tasks (e.g. search,
 * filter, pagination) rather than creating data inline.
 */
async function globalSetup() {
  let fixtures: Array<{ username: string; password: string }>;

  try {
    fixtures = JSON.parse(readFileSync(FIXTURES_PATH, 'utf8'));
  } catch {
    console.warn('[globalSetup] No fixture file found — skipping pre-seed.');
    return;
  }

  let seeded = 0;
  for (const { username, password } of fixtures) {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    // 201 = registered fresh; 409 = already exists (server restart skipped)
    if (res.status === 201 || res.status === 409) seeded++;
  }

  console.log(`[globalSetup] Seeded ${seeded}/${fixtures.length} fixture users.`);
}

export default globalSetup;
