/**
 * Smoke test — 1 VU, 30 seconds.
 * Confirms every endpoint responds correctly under minimal load.
 * Run before load/stress to catch basic breakage fast.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { getToken, authHeaders, BASE_URL } from './lib/auth.js';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate==0'],        // zero errors tolerated in smoke
    http_req_duration: ['p(95)<200'],    // p95 under 200ms
  },
};

export function setup() {
  const token = getToken(`smoke_${Date.now()}`);
  return { token };
}

export default function ({ token }) {
  const headers = authHeaders(token);

  // Create a task
  const create = http.post(
    `${BASE_URL}/api/tasks`,
    JSON.stringify({ title: 'k6 smoke task' }),
    headers
  );
  check(create, {
    'POST /api/tasks: 201': (r) => r.status === 201,
    'task has id': (r) => r.json('id') !== undefined,
  });

  const taskId = create.json('id');

  // List tasks
  const list = http.get(`${BASE_URL}/api/tasks`, headers);
  check(list, {
    'GET /api/tasks: 200': (r) => r.status === 200,
    'response is array': (r) => Array.isArray(r.json()),
  });

  // Update task
  const update = http.put(
    `${BASE_URL}/api/tasks/${taskId}`,
    JSON.stringify({ title: 'k6 smoke task', completed: true }),
    headers
  );
  check(update, { 'PUT /api/tasks/:id: 200': (r) => r.status === 200 });

  // Delete task
  const del = http.del(`${BASE_URL}/api/tasks/${taskId}`, null, headers);
  check(del, { 'DELETE /api/tasks/:id: 204': (r) => r.status === 204 });

  sleep(1);
}
