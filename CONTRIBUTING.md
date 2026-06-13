# Contributing to QualityHub

## Node version

This project pins Node via `.nvmrc`. Always use it:

```bash
nvm use        # reads .nvmrc automatically
node --version # should match the version in .nvmrc
```

CI reads the same file (`node-version-file: '.nvmrc'`), so local and CI are always in sync.
If you need to upgrade Node, change `.nvmrc` and update all three workflow files in one commit.

## Adding a new dependency

Before `npm install <pkg>`, do a 30-second check:

1. **What test runner does it use internally?**
   ```bash
   npm info <pkg> devDependencies
   ```
   If it lists `vitest`, use Vitest for its tests. If it lists `jest`, use Jest.
   Mixing runners causes ESM/require conflicts that only surface on CI.

2. **Does it publish ESM-only packages?**
   ```bash
   npm info <pkg> type   # "module" = ESM-only
   ```
   ESM-only packages can't be `require()`'d by Jest without extra config.
   Vitest handles native ESM without shims — prefer it for any ESM-heavy dependency.

3. **Check peer dependency conflicts before committing:**
   ```bash
   npm ls --depth=0 2>&1 | grep WARN
   ```
   Resolve any peer dep warnings before pushing — they become hard CI failures.

## Test suite directory structure

Each runner owns a top-level directory. Never nest one runner's tests inside another's scan path:

```
e2e/          ← Playwright (testDir: './e2e')
contract/     ← Vitest + Pact
karate/       ← Maven/JUnit5
```

If you add a new suite, give it its own directory and update the relevant runner config to scope to it.
Adding files to an existing directory without checking what else scans it is how Playwright ends up
running Pact specs (and failing with cryptic ESM errors).

## Testing CI locally

Install `act` to run GitHub Actions workflows locally before pushing:

```bash
brew install act
act push --job test        # run the Playwright job
act push --job contract    # run the contract job
```

This catches Linux-vs-macOS differences and `node_modules` resolution issues before they hit remote CI.

## Checklist before opening a PR

- [ ] `nvm use` is active (Node matches `.nvmrc`)
- [ ] `npm test` passes (Playwright)
- [ ] `npm run test:contract` passes (Pact consumer + provider)
- [ ] `cd karate && JAVA_HOME=/opt/homebrew/opt/openjdk@21 mvn test` passes (Karate)
- [ ] `npm ls --depth=0` shows no peer dep warnings
- [ ] New test files are in the correct runner's directory
