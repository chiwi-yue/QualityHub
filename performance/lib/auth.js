import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

/**
 * Register a unique user and return their JWT.
 * Each VU calls this once in setup() or init so tokens don't collide.
 */
export function getToken(username, password = 'PerfPass1') {
  const res = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({ username, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res, { 'register: status 201': (r) => r.status === 201 });
  return res.json('token');
}

export function authHeaders(token) {
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
}

export { BASE_URL };
