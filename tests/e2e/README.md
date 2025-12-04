# VTT E2E Test Suite

Comprehensive Playwright E2E test suite with **45 tests** covering authentication, game management, and gameplay.

## Quick Start

### Install Dependencies
```bash
npm install
npx playwright install chromium
```

### Run All Tests
```bash
npx playwright test
```

### Run Specific Categories
```bash
# Authentication tests (15 tests)
npx playwright test tests/e2e/auth

# Game management tests (12 tests)
npx playwright test tests/e2e/games

# Gameplay tests (18 tests)
npx playwright test tests/e2e/gameplay
```

### Run Single Test File
```bash
npx playwright test tests/e2e/auth/login.spec.ts
npx playwright test tests/e2e/auth/registration.spec.ts
npx playwright test tests/e2e/games/create-game.spec.ts
npx playwright test tests/e2e/games/game-list.spec.ts
npx playwright test tests/e2e/gameplay/token-interaction.spec.ts
npx playwright test tests/e2e/gameplay/dice-rolling.spec.ts
```

## Development

### Debug Tests with UI Mode
```bash
npx playwright test --ui
```

### Run Tests in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### Run Specific Test by Name
```bash
npx playwright test -g "user can log in"
```

### Generate Test Code
```bash
npx playwright codegen http://localhost:5173
```

## Test Structure

```
tests/e2e/
├── auth/
│   ├── login.spec.ts (8 tests)
│   └── registration.spec.ts (7 tests)
├── games/
│   ├── create-game.spec.ts (7 tests)
│   └── game-list.spec.ts (5 tests)
├── gameplay/
│   ├── token-interaction.spec.ts (10 tests)
│   └── dice-rolling.spec.ts (8 tests)
├── pages/
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── RegisterPage.ts
│   ├── GamesListPage.ts
│   ├── CreateGamePage.ts
│   └── GameSessionPage.ts
├── fixtures/
│   └── test-data.ts
└── utils/
    └── helpers.ts
```

## Test Coverage

### Authentication (15 tests)
- User registration with validation
- User login with error handling
- Session persistence
- Logout functionality
- Protected route access

### Game Management (12 tests)
- Game creation with validation
- Games list display
- Empty state handling
- Navigation to games
- Multiple game support

### Gameplay (18 tests)
- Token creation, movement, deletion
- Token persistence
- Canvas interactions
- Dice rolling with various notations
- Roll result display

## Configuration

Tests are configured in `playwright.config.ts`:
- **Base URL**: `http://localhost:5173`
- **API Server**: `http://localhost:3000/health`
- **Browser**: Chromium
- **Parallel**: Yes (non-CI)
- **Retries**: 2 (CI only)
- **Screenshots**: On failure
- **Trace**: On first retry

## Troubleshooting

### Tests Failing on Selectors
The tests use multiple selector strategies for flexibility:
```typescript
// Try data-testid first, then fallback to semantic selectors
this.submitButton = page.locator('button[type="submit"], button:has-text("Submit")');
```

Adjust selectors in page objects to match your actual DOM structure.

### Timing Issues
Tests include waits for network idle and UI state:
```typescript
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000); // For animations/debouncing
```

Adjust timeouts if your app is slower.

### Port Conflicts
Ensure ports 5173 (web) and 3000 (API) are available:
```bash
# Windows
netstat -ano | findstr :5173
netstat -ano | findstr :3000
```

### Server Not Starting
The config automatically starts web and API servers. Ensure:
- Dependencies are installed: `npm install`
- Both packages have dev scripts in package.json
- Monorepo workspaces are configured correctly

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

### Test Independence
Each test is independent and can run in any order:
```typescript
test.beforeEach(async ({ page }) => {
  // Fresh login for each test
  await loginPage.goto();
  await loginPage.login(testUser.email, testUser.password);
});
```

### Unique Test Data
Tests use timestamps to prevent conflicts:
```typescript
const timestamp = Date.now();
const email = `testuser${timestamp}@example.com`;
```

### Page Object Pattern
All UI interactions through page objects:
```typescript
// Good
await loginPage.login(email, password);

// Avoid
await page.fill('[name="email"]', email);
await page.fill('[name="password"]', password);
await page.click('button[type="submit"]');
```

## Extending Tests

### Add New Page Object
```typescript
// pages/NewPage.ts
import { BasePage } from './BasePage';
import { Page, Locator } from '@playwright/test';

export class NewPage extends BasePage {
  readonly element: Locator;

  constructor(page: Page) {
    super(page);
    this.element = page.locator('[data-testid="element"]');
  }

  async goto() {
    await super.goto('/new-page');
    await this.waitForLoad();
  }
}
```

### Add New Test File
```typescript
// category/new-feature.spec.ts
import { test, expect } from '@playwright/test';
import { NewPage } from '../pages/NewPage';

test.describe('New Feature', () => {
  let newPage: NewPage;

  test.beforeEach(async ({ page }) => {
    newPage = new NewPage(page);
    await newPage.goto();
  });

  test('feature works', async ({ page }) => {
    // Test implementation
  });
});
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices Guide](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Test Generator](https://playwright.dev/docs/codegen)

## Support

For issues or questions:
1. Check test output in terminal
2. Review HTML report: `npx playwright show-report`
3. Run with trace: `npx playwright test --trace on`
4. Debug with UI mode: `npx playwright test --ui`
