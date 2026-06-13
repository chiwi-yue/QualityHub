# Test Strategy — QualityHub

## 1. Scope

### System under test
`task-api` — an Express REST API with JWT authentication and in-memory task CRUD, served alongside a minimal browser UI. The API surface is:

| Endpoint | Description |
|---|---|
| `POST /api/auth/register` | Create account, returns JWT |
| `POST /api/auth/login` | Authenticate, returns JWT |
| `GET /api/tasks` | List authenticated user's tasks |
| `POST /api/tasks` | Create task |
| `PUT /api/tasks/:id` | Update task |
| `DELETE /api/tasks/:id` | Delete task |

### In scope
- Functional correctness of all six endpoints (status codes, response shape, error handling)
- End-to-end user journeys through the browser UI
- API contract between the UI consumer and the API provider
- Performance SLOs under realistic and peak load
- Test data generation and PII handling patterns

### Out of scope
- Unit tests for `task-api` internals — the in-memory store and JWT logic are covered at the API layer; unit tests would duplicate coverage without adding signal
- Cross-browser compatibility — Chromium covers the functional surface; browser-compat requires a real product requirement to justify the maintenance cost
- Security testing (OWASP, penetration testing) — outside the portfolio scope

---

## 2. Risk-based approach

Testing effort is weighted by failure impact and failure likelihood:

| Risk | Impact | Likelihood | Coverage |
|---|---|---|---|
| Auth bypass — unauthenticated access to tasks | High | Medium | Karate: explicit 401 test for missing + invalid token |
| API contract drift — UI breaks silently when API changes shape | High | High | Pact: consumer-driven contract verified on every push |
| Performance regression — API slows under load | Medium | Medium | k6: p95 threshold as CI quality gate |
| UI journey broken — user can't add/delete tasks | High | Low | Playwright: full CRUD E2E suite |
| Missing required fields accepted | Medium | Low | Karate: 400 test for missing task title |

---

## 3. Test layers and tool rationale

### Layer 1 — API tests (Karate)
**Why Karate:** BDD syntax (Gherkin) makes scenarios readable to non-engineers. Built-in schema matching (`match each`) and `Scenario Outline` for data-driven cases avoid boilerplate. JUnit5 runner integrates with Maven CI without additional config.

**Coverage pattern:**
- Happy path first: register → login → full CRUD lifecycle in one scenario, proving the flow works before testing edges
- Negative tests isolated: 401 (no token), 401 (wrong password), 400 (missing field) each in their own scenario so failures are unambiguous
- Schema validation on responses, not just status codes — catches field renames and type changes

### Layer 2 — Contract tests (Pact)
**Why Pact:** The consumer (UI) and provider (API) are developed together here, but in real teams they're often separate — the provider changes without telling consumers. Consumer-driven contracts flip the direction: the consumer defines what it needs, and the provider's CI verifies it can still deliver.

**Key implementation detail:** The consumer spec uses `'Bearer token'` as a placeholder. The provider verifier's `requestFilter` replaces this with a real JWT on every request, allowing the full auth middleware to run without the consumer needing to embed credentials.

### Layer 3 — E2E tests (Playwright)
**Why Playwright:** Auto-waiting, reliable `getByTestId` locators, and the Page Object Model pattern keep tests maintainable as the UI evolves. `waitForResponse` guards against race conditions between UI updates and async API calls.

**Coverage pattern:**
- One unique user per test (`user_${Date.now()}_${random}`) — no shared state between parallel tests
- Page Objects encapsulate all locators and actions — specs describe behaviour, not DOM structure
- `globalSetup` pre-registers fixture users for tests that need pre-existing data

### Layer 4 — Performance tests (k6)
**Why k6:** JavaScript scripting with Go runtime — familiar syntax, no JVM overhead. Thresholds defined in the script act as quality gates: k6 exits non-zero if breached, failing CI automatically.

**Three-tier strategy:**
- **Smoke** (1 VU, 30s): zero errors, p95 < 200ms. Runs first — if the API is broken, load produces meaningless data
- **Load** (10 VUs, ramp + 1m sustain): error rate < 1%, p95 < 500ms. Validates SLOs under production-like concurrency
- **Stress** (up to 100 VUs): manual only. Designed to find breaking points, not validate SLOs. Excluded from CI to avoid 3-minute runs on every push

---

## 4. Test data strategy

**Isolation:** Each E2E test registers a unique user. No test reads or modifies another test's data. This makes tests safe to run in parallel and eliminates order-dependency.

**Fixtures:** `data/fixtures/seeded.json` is a committed baseline generated with `faker.seed(42)`. The fixed seed means identical usernames, passwords, and task titles on every run — stable diffs, reproducible local setup. Playwright's `globalSetup` pre-registers these users before the suite runs.

**Realistic data:** Faker.js produces realistic usernames and task titles (e.g. `"We need to synthesize the virtual ADP firewall!"`) rather than `test123`. Realistic data surfaces bugs that pattern-matched test strings hide — validation logic that accepts `"test"` but rejects a long natural-language string, for example.

**PII masking:** `tools/mask.js` obfuscates username, password, and JWT fields before fixture files are shared or uploaded as CI artifacts. This demonstrates the pattern required in regulated environments where test data is derived from production exports.

---

## 5. CI quality gates

Every push to `main` must pass all four pipelines:

| Pipeline | Gate | Failure means |
|---|---|---|
| Playwright | All 12 E2E tests pass | A user journey is broken |
| Karate | All 16 API scenarios pass | An endpoint is broken or regressed |
| Contract | All 3 Pact interactions verified | Provider no longer satisfies consumer expectations |
| Performance | Smoke: p95 < 200ms, errors = 0 / Load: p95 < 500ms, errors < 1% | API is too slow or unreliable under load |

Merge is blocked if any gate fails. The Playwright pipeline additionally deploys an Allure HTML report to GitHub Pages on every successful `main` push.

---

## 6. What's not automated and why

| Area | Reason not automated |
|---|---|
| Exploratory testing | By definition unscripted — done manually before releases |
| Accessibility (a11y) | No product requirement in this portfolio scope; would use axe-playwright if required |
| Visual regression | No design system to regress against; would use Playwright snapshots if required |
| Load testing above 10 VUs in CI | See stress test rationale in section 3 |
