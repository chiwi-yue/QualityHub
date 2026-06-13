# QualityHub

A quality engineering portfolio demonstrating a complete, layered test strategy — E2E UI automation, API testing, consumer-driven contract testing, performance testing, and test data management — all wired into a CI/CD pipeline with automated reporting.

[![Playwright Tests](https://github.com/chiwi-yue/QualityHub/actions/workflows/playwright.yml/badge.svg)](https://github.com/chiwi-yue/QualityHub/actions/workflows/playwright.yml)
[![Karate Tests](https://github.com/chiwi-yue/QualityHub/actions/workflows/karate.yml/badge.svg)](https://github.com/chiwi-yue/QualityHub/actions/workflows/karate.yml)
[![Contract Tests](https://github.com/chiwi-yue/QualityHub/actions/workflows/contract.yml/badge.svg)](https://github.com/chiwi-yue/QualityHub/actions/workflows/contract.yml)
[![Performance Tests](https://github.com/chiwi-yue/QualityHub/actions/workflows/performance.yml/badge.svg)](https://github.com/chiwi-yue/QualityHub/actions/workflows/performance.yml)

**Live Allure Report:** https://chiwi-yue.github.io/QualityHub/

---

## Test Strategy

### Philosophy

This project follows the **test pyramid** — more fast, focused tests at lower layers; fewer slow, broad tests at the top. Each layer has a distinct job. No layer duplicates what another already covers.

```
          ┌─────────────┐
          │   E2E (14)  │  ← Playwright: does the UI work end-to-end?
          └──────┬──────┘
         ┌───────┴───────┐
         │  Contract (4) │  ← Pact: do consumer/provider agree on the API shape?
         └───────┬───────┘
        ┌────────┴────────┐
        │   API (16+)     │  ← Karate: does every endpoint behave correctly?
        └────────┬────────┘
      ┌──────────┴──────────┐
      │  Performance (2 CI) │  ← k6: do SLOs hold under load?
      └─────────────────────┘
```

### Layer responsibilities

| Layer | Tool | Answers | Quality gate |
|---|---|---|---|
| E2E | Playwright | Does the full user journey work through the browser? | All 14 pass |
| API | Karate | Does each endpoint return correct status, shape, and errors? | All 16 pass |
| Contract | Pact | Does the provider still satisfy what the consumer expects? | 3 interactions verified |
| Performance | k6 | Does the API meet SLOs under realistic and peak load? | p95 < 500ms, errors < 1% |

### What's deliberately out of scope

- **Unit tests for the SUT** — `task-api` is a portfolio SUT, not production code; its internals are covered at the API layer
- **Cross-browser E2E** — Chromium covers the functional surface; browser-compat testing would require a real product requirement
- **Stress in CI** — stress test (100 VUs) runs manually to find limits, not as a merge gate; it would add 3+ minutes for no merge-time signal

### Test data approach

Tests own their data. Each E2E test registers a unique user (`user_${Date.now()}_${random}`) so no test shares state with another. For tests that need pre-existing data (future: search, filtering), `data/fixtures/seeded.json` provides a deterministic baseline generated with `faker.seed(42)` and pre-registered in Playwright's `globalSetup`.

---

## CI Pipeline

Every push to `main` triggers four independent workflow jobs in parallel:

```
git push
    │
    ├── playwright.yml ──► npm test (14 E2E tests, Chromium)
    │                          └── allure generate → deploy to GitHub Pages
    │
    ├── karate.yml ──────► mvn test (16 API tests, Java 21)
    │
    ├── contract.yml ────► vitest run consumer → vitest run provider
    │                          └── uploads pacts/TaskUI-TaskAPI.json as artifact
    │
    └── performance.yml ─► k6 smoke → k6 load (quality gates as thresholds)
                               └── uploads k6-summary.json as artifact
```

All four must pass for a merge to be considered clean. The Playwright job additionally deploys the Allure HTML report to GitHub Pages on every successful `main` push — giving a live, human-readable test report at:

**https://chiwi-yue.github.io/QualityHub/**

The report shows test timeline, individual step breakdown, pass/fail history, and failure screenshots — without needing to dig into CI logs.

---

## Key Engineering Decisions

These are the non-obvious choices made and why.

**Vitest instead of Jest for contract tests**
`@pact-foundation/pact` v16 uses native ESM internally. Jest 30 requires Node 24+ to handle synchronous ESM VM APIs; CI runs Node 22. Vitest handles native ESM without shims and requires zero configuration changes to the test files.

**Top-level directory per test runner**
Playwright, Vitest, and k6 all have greedy glob patterns. Nesting them under a shared `tests/` directory caused Playwright to pick up Pact spec files. Separating into `e2e/`, `contract/`, `karate/`, `performance/` prevents runners from accidentally executing each other's tests.

**`waitForResponse` in Playwright page objects**
After clicking "Add Task", the DOM update is driven by an async `fetch`. Without waiting for the POST response to complete, assertions on task count would race against the network call and fail intermittently. The fix is in `TasksPage.addTask()` and `TasksPage.deleteTask()` — both gate on the API response before returning.

**`setup()` for k6 auth, not inline**
Calling `register` inside the default function (the VU loop) means auth requests pollute the performance metrics and 10 VUs race on registration simultaneously. `setup()` runs once before VUs start, pre-registers all users, and passes tokens in — so the measurement window contains only task CRUD traffic.

**Consumer-driven contracts with real JWT injection**
The Pact consumer spec uses `'Bearer token'` as a placeholder. The provider verifier's `requestFilter` intercepts every request and replaces that placeholder with a real JWT obtained from a pre-registered test user. This lets the provider run its full auth middleware without the consumer needing to know credentials.

**`faker.seed(42)` for committed fixtures**
Unseeded Faker generates different output on every run, which means `data/fixtures/seeded.json` would change on every `npm run seed:save` — noisy diffs, no stable baseline. A fixed seed produces identical usernames, passwords, and task titles every time while still looking like realistic data.

---

## Stack

| Layer | Tool | Version |
|---|---|---|
| UI / E2E | Playwright (TypeScript) | 1.52+ |
| API | Karate (JUnit5 / Maven) | 1.4.1 |
| Contract | Pact (consumer-driven) | 16.x |
| Performance | k6 | 2.x |
| Reporting | Allure | 2.x → GitHub Pages |
| Test data | Faker.js | 9.x |
| CI | GitHub Actions | — |
| Language | Node.js / Java | 22 / 21 |

---

## Project Structure

```
QualityHub/
├── apps/
│   └── task-api/                    # Express REST API — the system under test
│       ├── server.js                # JWT auth + tasks CRUD (in-memory)
│       └── public/index.html        # Minimal task manager UI
├── e2e/                             # Playwright E2E tests
│   ├── pages/
│   │   ├── LoginPage.ts             # Page Object — auth forms
│   │   ├── TasksPage.ts             # Page Object — task list interactions
│   │   └── TodoPage.ts              # Page Object — TodoMVC
│   ├── global-setup.ts              # Pre-registers fixture users before suite
│   ├── fixtures.ts                  # Typed fixture user loader
│   ├── tasks.spec.ts                # E2E tests against task-api UI
│   ├── todo.spec.ts                 # E2E tests — TodoMVC
│   └── example.spec.ts              # Smoke test — playwright.dev
├── contract/                        # Vitest + Pact contract tests
│   ├── consumer.spec.ts             # Defines what TaskUI expects from TaskAPI
│   ├── provider.spec.ts             # Verifies TaskAPI meets the contract
│   └── pacts/TaskUI-TaskAPI.json    # Generated contract file
├── performance/                     # k6 performance tests
│   ├── smoke.js                     # 1 VU, 30s — confirms API responds
│   ├── load.js                      # 10 VUs, ramp + sustain — SLO validation
│   ├── stress.js                    # Up to 100 VUs — find breaking point (manual)
│   └── lib/auth.js                  # Shared auth helper
├── karate/                          # Karate API tests (Maven/JUnit5)
│   └── src/test/resources/com/qualityhub/
│       ├── tasks.feature            # Auth + CRUD lifecycle against task-api
│       ├── posts.feature            # JSONPlaceholder — data-driven outline
│       └── users.feature            # JSONPlaceholder — schema + negative tests
├── tools/
│   ├── seed.js                      # Faker.js seeder — registers users + tasks
│   └── mask.js                      # PII obfuscator for fixture snapshots
├── data/fixtures/
│   ├── seeded.json                  # Committed baseline (faker.seed(42))
│   └── masked.json                  # PII-masked version for safe sharing
└── .github/workflows/
    ├── playwright.yml               # E2E tests + Allure → GitHub Pages
    ├── karate.yml                   # Karate API tests
    ├── contract.yml                 # Pact contract tests
    └── performance.yml              # k6 smoke + load quality gates
```

---

## Local Setup

**Prerequisites:** Node.js 22+, Java 21, Maven 3.x, k6

```bash
git clone https://github.com/chiwi-yue/QualityHub.git
cd QualityHub
npm ci
cd apps/task-api && npm ci && cd ../..
npx playwright install --with-deps chromium
```

> **macOS Homebrew note:** If `mvn --version` reports Java 26, prefix Karate commands with `JAVA_HOME=/opt/homebrew/opt/openjdk@21`. Karate 1.4.1 requires Java 17–21.

---

## Running Tests

```bash
# Playwright E2E (auto-starts task-api)
npm test

# Playwright interactive UI mode
npm run test:ui

# Generate + open Allure report after test run
npm run allure:generate
npm run allure:open

# Karate API tests
cd karate && JAVA_HOME=/opt/homebrew/opt/openjdk@21 mvn test

# Pact contract tests
npm run test:contract

# k6 performance (requires: npm run start:api in another terminal)
npm run perf:smoke    # 1 VU, 30s
npm run perf:load     # 10 VUs, ramp + sustain
npm run perf:stress   # 100 VUs, manual only

# Test data
npm run seed          # seed with random Faker data
npm run seed:save     # seed with --seed 42, write to data/fixtures/
npm run mask          # obfuscate PII in seeded.json → masked.json
```

---

## What's Tested

**Playwright — task-api UI**
- Register a new user and land on the tasks view
- Add a single task; add multiple tasks
- Delete a task
- Complete a task (visual verification)
- Invalid login shows error message
- Logout returns to login screen
- TodoMVC: add, complete, filter, clear (Page Object Model)

**Karate — task-api REST API**
- Register + login — JWT returned
- Full task lifecycle: create → read → update → delete
- Unauthenticated request → 401
- Wrong password → 401
- Missing task title → 400
- JSONPlaceholder: `Scenario Outline`, schema validation, 404 negative test

**Pact — TaskUI → TaskAPI contract**
- `POST /api/auth/login` — JWT shape
- `GET /api/tasks` — task array schema
- `POST /api/tasks` — created task shape
- Provider verified with real JWT injection

**k6 — performance SLOs**
- Smoke: zero errors, p95 < 200ms at 1 VU
- Load: error rate < 1%, p95 < 500ms at 10 VUs sustained
