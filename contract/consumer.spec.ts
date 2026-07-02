import { PactV4, MatchersV3 } from '@pact-foundation/pact';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { like, eachLike, integer, boolean: pactBool, string: pactStr } = MatchersV3;

const pact = new PactV4({
  consumer: 'TaskUI',
  provider: 'TaskAPI',
  dir: path.resolve(__dirname, 'pacts'),
  logLevel: 'warn',
});

describe('TaskAPI consumer contract', () => {
  test('POST /api/auth/login returns a JWT', async () => {
    await pact
      .addInteraction()
      .given('a registered user exists')
      .uponReceiving('a login request with valid credentials')
      .withRequest('POST', '/api/auth/login', (b) => {
        b.jsonBody({ username: 'testuser', password: 'password' });
      })
      .willRespondWith(200, (b) => {
        b.jsonBody({ token: like('eyJ') });
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser', password: 'password' }),
        });
        expect(res.status).toBe(200);
        const body = await res.json() as { token: string };
        expect(typeof body.token).toBe('string');
      });
  });

  test('GET /api/tasks returns a list of tasks for an authenticated user', async () => {
    await pact
      .addInteraction()
      .given('user has tasks')
      .uponReceiving('an authenticated request to list tasks')
      .withRequest('GET', '/api/tasks', (b) => {
        b.headers({ Authorization: like('Bearer token') });
      })
      .willRespondWith(200, (b) => {
        b.jsonBody(
          eachLike({
            id: integer(1),
            title: pactStr('Buy groceries'),
            completed: pactBool(false),
            username: pactStr('testuser'),
          })
        );
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/api/tasks`, {
          headers: { Authorization: 'Bearer token' },
        });
        expect(res.status).toBe(200);
        const tasks = await res.json() as Record<string, unknown>[];
        expect(Array.isArray(tasks)).toBe(true);
        expect(tasks[0]).toMatchObject({
          id: expect.any(Number),
          title: expect.any(String),
          completed: expect.any(Boolean),
        });
      });
  });

  test('POST /api/tasks creates a task', async () => {
    await pact
      .addInteraction()
      .given('user is authenticated')
      .uponReceiving('an authenticated request to create a task')
      .withRequest('POST', '/api/tasks', (b) => {
        b.headers({ Authorization: like('Bearer token') }).jsonBody({ title: 'New task' });
      })
      .willRespondWith(201, (b) => {
        b.jsonBody({
          id: integer(1),
          title: like('New task'),
          completed: pactBool(false),
          username: like('testuser'),
        });
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/api/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token',
          },
          body: JSON.stringify({ title: 'New task' }),
        });
        expect(res.status).toBe(201);
        const task = await res.json() as Record<string, unknown>;
        expect(task.id).toBeDefined();
        expect(task.title).toBe('New task');
        expect(task.completed).toBe(false);
      });
  });
});
