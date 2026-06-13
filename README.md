# QualityHub

A quality engineering portfolio project demonstrating E2E UI automation, API testing, contract testing, and CI/CD quality gates.

[![Playwright Tests](https://github.com/chiwi-yue/QualityHub/actions/workflows/playwright.yml/badge.svg)](https://github.com/chiwi-yue/QualityHub/actions/workflows/playwright.yml)
[![Karate Tests](https://github.com/chiwi-yue/QualityHub/actions/workflows/karate.yml/badge.svg)](https://github.com/chiwi-yue/QualityHub/actions/workflows/karate.yml)
[![Contract Tests](https://github.com/chiwi-yue/QualityHub/actions/workflows/contract.yml/badge.svg)](https://github.com/chiwi-yue/QualityHub/actions/workflows/contract.yml)

## Stack

| Layer | Tool | Version |
|---|---|---|
| UI / E2E | Playwright (TypeScript) | 1.52+ |
| API | Karate (JUnit5 / Maven) | 1.4.1 |
| Contract | Pact (consumer-driven) | 16.x |
| CI | GitHub Actions | — |
| Language | Node.js / Java | 22 / 21 |

## Project Structure

```
QualityHub/
├── apps/
│   └── task-api/                    # Express REST API — the system under test
│       ├── server.js                # JWT auth + tasks CRUD (in-memory)
│       └── public/index.html        # Minimal task manager UI
├── tests/
│   ├── pages/
│   │   ├── LoginPage.ts             # Page Object — auth forms
│   │   ├── TasksPage.ts             # Page Object — task list interactions
│   │   └── TodoPage.ts              # Page Object — TodoMVC (Day 2 demo)
│   ├── contract/
│   │   ├── consumer.spec.ts         # Pact consumer — defines API contract
│   │   ├── provider.spec.ts         # Pact provider — verifies task-api
│   │   └── pacts/TaskUI-TaskAPI.json # Generated contract file
│   ├── tasks.spec.ts                # E2E tests against task-api UI
│   ├── todo.spec.ts                 # E2E tests — TodoMVC (Day 2 demo)
│   └── example.spec.ts             # Smoke test — playwright.dev
├── karate/
│   └── src/test/resources/com/qualityhub/
│       ├── tasks.feature            # Auth + CRUD lifecycle against task-api
│       ├── posts.feature            # JSONPlaceholder — data-driven outline
│       └── users.feature            # JSONPlaceholder — schema + negative tests
├── .github/workflows/
│   ├── playwright.yml               # Playwright CI job
│   ├── karate.yml                   # Karate CI job
│   └── contract.yml                 # Pact contract CI job
└── playwright.config.ts
```

## Local Setup

**Prerequisites:** Node.js 22+, Java 21, Maven 3.x

```bash
git clone https://github.com/chiwi-yue/QualityHub.git
cd QualityHub
npm ci
cd apps/task-api && npm ci && cd ../..
npx playwright install --with-deps chromium
```

> **macOS Homebrew note:** If `mvn --version` reports Java 26, prefix Karate commands with `JAVA_HOME=/opt/homebrew/opt/openjdk@21`. Karate 1.4.1 requires Java 17–21.

## Running Tests

```bash
# Playwright E2E (auto-starts task-api)
npm test

# Playwright interactive UI mode
npm run test:ui

# Karate API tests
cd karate && JAVA_HOME=/opt/homebrew/opt/openjdk@21 mvn test

# Pact contract tests (consumer + provider)
npm run test:contract

# Contract consumer only (generates pact file)
npm run test:contract:consumer

# Contract provider only (verifies against pact file)
npm run test:contract:provider
```

## What's Tested

**Playwright — task-api UI (`localhost:3001`)**
- Register a new user and land on the tasks view
- Add a task, add multiple tasks
- Delete a task
- Complete a task (visual verification)
- Invalid login shows error message
- Logout returns to login screen

**Playwright — external demos**
- TodoMVC: add, complete, filter, clear (Page Object Model)
- playwright.dev: title smoke test

**Karate — task-api (`localhost:3001`)**
- Register + login — JWT returned
- Full task lifecycle: create → read → update → delete
- Unauthenticated request → 401
- Wrong password → 401
- Missing task title → 400

**Karate — JSONPlaceholder (external API examples)**
- `GET /posts` — schema validation, response size assertion, `Scenario Outline`
- `GET /users` — nested schema validation across all 10 records
- `GET /users/999` — 404 negative test

**Pact — TaskUI → TaskAPI contract**
- `POST /api/auth/login` — consumer defines expected JWT shape
- `GET /api/tasks` — consumer defines expected task array schema
- `POST /api/tasks` — consumer defines expected created task shape
- Provider verified against all 3 interactions using real JWT injection
