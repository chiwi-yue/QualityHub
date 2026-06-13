/**
 * Stress test — pushes well past expected load to find the breaking point.
 * Ramps aggressively; thresholds are intentionally relaxed vs load test.
 * Not run in CI — execute manually to profile capacity limits.
 *
 *   npm run perf:stress
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { getToken, authHeaders, BASE_URL } from './lib/auth.js';

export const options = {
  stages: [
    { duration: '30s', target: 20  },  // warm up
    { duration: '30s', target: 50  },  // approach breaking point
    { duration: '1m',  target: 50  },  // hold at peak
    { duration: '30s', target: 100 },  // push past limit
    { duration: '30s', target: 0   },  // recovery
  ],
  thresholds: {
    http_req_failed:   ['rate<0.05'],   // < 5% errors (relaxed for stress)
    http_req_duration: ['p(99)<2000'],  // p99 < 2s under extreme load
  },
};

export function setup() {
  const tokens = {};
  for (let i = 1; i <= 100; i++) {
    tokens[i] = getToken(`stress_${i}_${Date.now()}`);
  }
  return { tokens };
}

export default function ({ tokens }) {
  const token = tokens[__VU] || tokens[1];
  const headers = authHeaders(token);

  const create = http.post(
    `${BASE_URL}/api/tasks`,
    JSON.stringify({ title: `stress task ${__ITER}` }),
    headers
  );
  check(create, { 'POST /api/tasks: 201': (r) => r.status === 201 });

  const taskId = create.json('id');
  if (!taskId) return;

  http.get(`${BASE_URL}/api/tasks`, headers);
  http.del(`${BASE_URL}/api/tasks/${taskId}`, null, headers);

  sleep(0.5);
}
