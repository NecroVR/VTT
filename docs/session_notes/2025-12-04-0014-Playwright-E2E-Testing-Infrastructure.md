# Session Notes: Playwright E2E Testing Infrastructure

**Date**: 2025-12-04
**Session ID**: 0014
**Topic**: Playwright E2E Testing Infrastructure Setup

---

## Session Summary

Successfully set up Playwright E2E testing infrastructure for the VTT project, including configuration, directory structure, base classes, test fixtures, and helper utilities.

---

## Objectives

1. Create root `playwright.config.ts` with proper configuration
2. Set up E2E test directory structure
3. Create base page classes and utilities
4. Add test data fixtures
5. Update package.json with E2E test scripts

---

## Files Created

### Configuration Files

**`playwright.config.ts`** (Root)
- Configured test directory as `./tests/e2e`
- Set up Chromium browser for testing
- Configured baseURL as `http://localhost:5173`
- Added dual webServer configuration:
  - Backend: `pnpm --filter @vtt/server dev` on port 3000
  - Frontend: `pnpm --filter @vtt/web dev` on port 5173
- Set up trace and screenshot capture on failures
- Configured retries and workers for CI/local environments

### Directory Structure

```
tests/e2e/
├── pages/
│   └── BasePage.ts
├── fixtures/
│   └── test-data.ts
├── utils/
│   └── helpers.ts
├── auth/
│   └── .gitkeep
├── games/
│   └── .gitkeep
└── gameplay/
    └── .gitkeep
```

### Test Infrastructure Files

**`tests/e2e/pages/BasePage.ts`**
- Base class for Page Object Model pattern
- Provides common methods: `goto()`, `waitForLoad()`
- All page objects should extend this class

**`tests/e2e/fixtures/test-data.ts`**
- Exported test user credentials (owner, player)
- Test game data for E2E scenarios
- Centralized test data management

**`tests/e2e/utils/helpers.ts`**
- `login()` function for authentication
- `logout()` function for session cleanup
- Reusable utility functions for common operations

**`.gitkeep` Files**
- Placeholder files in `auth/`, `games/`, `gameplay/` directories
- Ensures empty directories are tracked in git

---

## Files Modified

**`package.json`** (Root)
- Added `test:e2e`: Run all E2E tests
- Added `test:e2e:ui`: Run tests in UI mode for debugging
- Added `test:e2e:debug`: Run tests in debug mode with inspector

**`pnpm-lock.yaml`**
- Updated dependencies for Playwright

---

## Key Decisions

1. **Single Browser Configuration**: Started with Chromium only to keep tests fast and focused
2. **Page Object Pattern**: Implemented BasePage class to encourage maintainable test structure
3. **Dual WebServer Setup**: Configured Playwright to automatically start both backend and frontend servers
4. **Directory Organization**: Separated tests by feature area (auth, games, gameplay)
5. **Helper Functions**: Created reusable login/logout utilities to reduce test boilerplate

---

## Testing Capabilities

### Current Setup Supports

- Running E2E tests with `pnpm test:e2e`
- Interactive test development with `pnpm test:e2e:ui`
- Debug mode with `pnpm test:e2e:debug`
- Automatic server startup before tests
- Screenshot capture on failures
- Trace recording on first retry

### Test Organization

Tests should be organized as follows:
- `tests/e2e/auth/` - Authentication and authorization tests
- `tests/e2e/games/` - Game creation, editing, deletion tests
- `tests/e2e/gameplay/` - In-game features (tokens, scenes, dice, etc.)

---

## Implementation Details

### Playwright Configuration Highlights

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'pnpm --filter @vtt/server dev',
      url: 'http://localhost:3000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'pnpm --filter @vtt/web dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
```

### BasePage Class

Provides foundation for Page Object Model pattern:

```typescript
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string) {
    await this.page.goto(path);
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }
}
```

### Test Helpers

Reusable authentication utilities:

```typescript
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(games|dashboard)/);
}
```

---

## Git Commit

**Commit Message**:
```
test(e2e): Add Playwright E2E testing infrastructure

- Created playwright.config.ts with chromium browser setup
- Configured dual webServer for @vtt/server and @vtt/web
- Added E2E test directory structure under tests/e2e/
- Created BasePage class for page object pattern
- Added test data fixtures for users and games
- Implemented helper functions for login/logout
- Added npm scripts: test:e2e, test:e2e:ui, test:e2e:debug
- Organized tests into auth/, games/, and gameplay/ directories
```

**Commit Hash**: `fca85c4`
**Files Changed**: 9 files
**Insertions**: 822
**Deletions**: 8

---

## Next Steps

1. **Write First E2E Test**: Create initial authentication test in `tests/e2e/auth/`
2. **Install Playwright Browsers**: Run `npx playwright install chromium`
3. **Create Page Objects**: Build page objects for Login, GameList, GameCreation, etc.
4. **Add Game Tests**: Implement E2E tests for game CRUD operations
5. **Add Gameplay Tests**: Create tests for in-game features (tokens, scenes, dice)
6. **CI Integration**: Configure E2E tests to run in GitHub Actions

---

## Notes

- Playwright version 1.57.0 is already installed
- No docker-compose file exists, so Docker deployment steps were skipped
- Browser installation required: `npx playwright install chromium`
- Tests will automatically start dev servers when running
- Test reports will be generated in `playwright-report/`

---

## Success Criteria

- Playwright configuration created
- Directory structure established
- Base classes and utilities implemented
- Package.json scripts added
- Changes committed and pushed to GitHub

All success criteria met.
