/**
 * Mask script — obfuscates PII fields in a seeded fixture file.
 * Use this before committing snapshots or uploading to CI artifacts.
 *
 * Masking rules:
 *   username  → first 2 chars + "****"      (e.g. "jo****")
 *   password  → always "********"           (never log real passwords)
 *   token     → first 10 chars + "..."      (JWT prefix only)
 *   task title → kept as-is                 (not PII in this domain)
 *
 * Usage:
 *   node tools/mask.js data/fixtures/seeded.json
 *   node tools/mask.js data/fixtures/seeded.json --out data/fixtures/masked.json
 */

import { readFileSync, writeFileSync } from 'fs';

const [,, inputPath, ...rest] = process.argv;

if (!inputPath) {
  console.error('Usage: node tools/mask.js <input.json> [--out <output.json>]');
  process.exit(1);
}

const outIdx = rest.indexOf('--out');
const outputPath = outIdx !== -1 ? rest[outIdx + 1] : null;

// ── Masking functions ─────────────────────────────────────────────────────────
function maskUsername(u) {
  if (!u || u.length < 2) return '****';
  return u.slice(0, 2) + '****';
}

function maskToken(t) {
  if (!t) return '***';
  return t.slice(0, 10) + '...';
}

function maskUser(user) {
  return {
    ...user,
    username: maskUsername(user.username),
    password: '********',
    token:    maskToken(user.token),
    tasks: user.tasks.map(task => ({ ...task, username: maskUsername(task.username) })),
  };
}

// ── Run ───────────────────────────────────────────────────────────────────────
let raw;
try {
  raw = readFileSync(inputPath, 'utf8');
} catch {
  console.error(`Cannot read file: ${inputPath}`);
  process.exit(1);
}

const data = JSON.parse(raw);
const masked = Array.isArray(data) ? data.map(maskUser) : maskUser(data);
const out = JSON.stringify(masked, null, 2);

if (outputPath) {
  writeFileSync(outputPath, out);
  console.log(`Masked data written → ${outputPath}`);
} else {
  process.stdout.write(out + '\n');
}
