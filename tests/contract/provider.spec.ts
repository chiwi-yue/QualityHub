import { Verifier } from '@pact-foundation/pact';
import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_URL = 'http://localhost:3002'; // separate port to avoid conflicts with running dev server

let server: ChildProcess;
let testToken: string;

async function waitForServer(url: string, timeout = 10000): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server never became ready at ${url}`);
}

beforeAll(async () => {
  server = spawn('node', ['apps/task-api/server.js'], {
    env: { ...process.env, PORT: '3002' },
    cwd: path.resolve(__dirname, '../..'),
  });
  server.stderr?.on('data', (d: Buffer) => process.stderr.write(d));

  await waitForServer(`${API_URL}/api/health`);

  // Register the shared test user whose token will be injected into all authenticated requests
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'pact_user', password: 'PactPass1' }),
  });
  testToken = ((await res.json()) as { token: string }).token;
}, 15000);

afterAll(async () => {
  server?.kill();
  await new Promise((r) => setTimeout(r, 300));
});

describe('TaskAPI provider contract verification', () => {
  test('satisfies the TaskUI consumer contract', async () => {
    await new Verifier({
      provider: 'TaskAPI',
      providerBaseUrl: API_URL,
      pactUrls: [path.resolve(__dirname, 'pacts/TaskUI-TaskAPI.json')],
      logLevel: 'warn',

      // Replace the placeholder token from consumer interactions with a real JWT
      requestFilter: (req, _res, next) => {
        if (!req.headers['authorization'] || req.headers['authorization'] === 'Bearer token') {
          req.headers['authorization'] = `Bearer ${testToken}`;
        }
        next();
      },

      stateHandlers: {
        'a registered user exists': async () => {
          // Register testuser:password for the login interaction
          await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'testuser', password: 'password' }),
          }).catch(() => {}); // 409 means already registered — fine
          return Promise.resolve();
        },
        'user has tasks': async () => {
          // Create a task for pact_user so GET /api/tasks returns a non-empty list
          await fetch(`${API_URL}/api/tasks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${testToken}`,
            },
            body: JSON.stringify({ title: 'Buy groceries' }),
          });
          return Promise.resolve();
        },
        'user is authenticated': async () => Promise.resolve(),
      },
    }).verifyProvider();
  }, 60000);
});
