/**
 * Load test — ramps to 10 VUs over 30s, holds for 1 min, ramps down.
 * Validates the API meets SLOs under expected production-like traffic.
 *
 * Quality gates (thresholds):
 *   p95 response time < 500ms
 *   error rate        < 1%
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { getToken, authHeaders, BASE_URL } from './lib/auth.js';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // ramp up
    { duration: '1m',  target: 10 },   // sustained load
    { duration: '20s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],   // < 1% errors
    http_req_duration: ['p(95)<500'],   // p95 < 500ms
  },
};

// setup() runs once before the load — register one user per VU via __VU
export function setup() {
  // Pre-register 10 users so VUs don't race on registration during the test
  const tokens = {};
  for (let i = 1; i <= 10; i++) {
    tokens[i] = getToken(`load_user_${i}_${Date.now()}`);
  }
  return { tokens };
}

export default function ({ tokens }) {
  const token = tokens[__VU] || tokens[1];
  const headers = authHeaders(token);

  const create = http.post(
    `${BASE_URL}/api/tasks`,
    JSON.stringify({ title: `load task ${__ITER}` }),
    headers
  );
  check(create, { 'POST /api/tasks: 201': (r) => r.status === 201 });

  const taskId = create.json('id');
  if (!taskId) return;

  const list = http.get(`${BASE_URL}/api/tasks`, headers);
  check(list, { 'GET /api/tasks: 200': (r) => r.status === 200 });

  http.del(`${BASE_URL}/api/tasks/${taskId}`, null, headers);

  sleep(1);
}
