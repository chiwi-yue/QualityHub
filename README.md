# QualityHub

A quality engineering portfolio project demonstrating E2E UI automation and API testing with CI/CD integration.

[![Playwright Tests](https://github.com/chiwi-yue/QualityHub/actions/workflows/playwright.yml/badge.svg)](https://github.com/chiwi-yue/QualityHub/actions/workflows/playwright.yml)
[![Karate Tests](https://github.com/chiwi-yue/QualityHub/actions/workflows/karate.yml/badge.svg)](https://github.com/chiwi-yue/QualityHub/actions/workflows/karate.yml)

## Stack

| Layer | Tool | Version |
|---|---|---|
| UI / E2E | Playwright (TypeScript) | 1.52+ |
| API | Karate (JUnit5 / Maven) | 1.4.1 |
| CI | GitHub Actions | — |
| Language | Node.js / Java | 22 / 21 |

## Project Structure

```
QualityHub/
├── tests/
│   ├── pages/
│   │   └── TodoPage.ts          # Page Object for TodoMVC
│   ├── todo.spec.ts             # E2E tests — add, complete, filter, delete
│   └── example.spec.ts          # Smoke test — playwright.dev title check
├── karate/
│   └── src/test/
│       ├── java/com/qualityhub/
│       │   └── KarateRunner.java
│       └── resources/com/qualityhub/
│           ├── posts.feature    # Posts API — GET, POST, data-driven outline
│           └── users.feature    # Users API — schema validation, negative test
├── .github/workflows/
│   ├── playwright.yml
│   └── karate.yml
└── playwright.config.ts
```

## Local Setup

**Prerequisites:** Node.js 22+, Java 21, Maven 3.x

```bash
# Clone and install Node deps
git clone https://github.com/chiwi-yue/QualityHub.git
cd QualityHub
npm ci
npx playwright install --with-deps chromium
```

> **macOS Homebrew note:** If `mvn --version` reports Java 26, prefix Karate commands with `JAVA_HOME=/opt/homebrew/opt/openjdk@21`. Karate 1.4.1 requires Java 17–21. To make it permanent: add `export JAVA_HOME=/opt/homebrew/opt/openjdk@21` to `~/.zshrc`.

## Running Tests

```bash
# Playwright (UI/E2E)
npm test

# Playwright with interactive UI
npm run test:ui

# Karate (API)
cd karate && mvn test

# Karate on macOS with Homebrew Java 26 default
cd karate && JAVA_HOME=/opt/homebrew/opt/openjdk@21 mvn test
```

## What's Tested

**Playwright — TodoMVC (`demo.playwright.dev/todomvc`)**
- Add single and multiple todos
- Complete a todo and verify in Completed filter
- Clear completed items
- Active filter shows only incomplete todos

**Karate — JSONPlaceholder API (`jsonplaceholder.typicode.com`)**
- `GET /posts` — list schema validation, response size assertion
- `POST /posts` — resource creation, data-driven with `Scenario Outline`
- `GET /users` — full nested schema validation across all 10 users
- `GET /users/1` — field-level assertions on a known record
- `GET /users/999` — 404 negative test
