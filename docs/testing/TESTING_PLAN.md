# Testing Implementation Plan for VTT Project

## Executive Summary

This plan targets **98% test coverage** for the VTT (Virtual Table Top) monorepo, encompassing unit tests with Vitest and E2E tests with Playwright across all packages and applications.

**Estimated Total Tests: 580-735**

---

## 1. Testing Architecture Overview

### 1.1 Test Types

| Type | Framework | Purpose | Location |
|------|-----------|---------|----------|
| Unit Tests | Vitest | Test individual functions, modules in isolation | Co-located with source (`.test.ts`) |
| Integration Tests | Vitest | Test API routes with database interactions | `apps/server/src/**/*.test.ts` |
| Component Tests | Vitest + @testing-library/svelte | Test Svelte components | `apps/web/src/**/*.test.ts` |
| E2E Tests | Playwright | Test complete user flows | `tests/e2e/` (root level) |

### 1.2 Test Organization Strategy

```
VTT/
├── apps/
│   ├── server/
│   │   └── src/
│   │       ├── routes/api/v1/*.test.ts     # Route integration tests
│   │       ├── middleware/*.test.ts         # Middleware unit tests
│   │       ├── websocket/*.test.ts          # WebSocket handler tests
│   │       └── plugins/*.test.ts            # Plugin tests
│   └── web/
│       └── src/
│           ├── lib/stores/*.test.ts         # Store unit tests
│           └── lib/components/*.test.ts     # Component tests
├── packages/
│   ├── shared/
│   │   └── src/
│   │       ├── dice/*.test.ts               # Dice parser tests (existing)
│   │       ├── types/*.test.ts              # Type validation tests
│   │       └── utils/*.test.ts              # Utility function tests
│   └── database/
│       └── src/
│           └── schema/*.test.ts             # Schema validation tests
└── tests/
    └── e2e/                                 # Playwright E2E tests
        ├── auth/                            # Authentication flows
        ├── games/                           # Game management flows
        └── gameplay/                        # Real-time gameplay flows
```

### 1.3 Coverage Goals Per Package

| Package | Target Coverage | Current Coverage | Priority |
|---------|----------------|------------------|----------|
| `@vtt/shared` | 98% | ~70% (dice tests exist) | High |
| `@vtt/database` | 95% | 0% | Medium |
| `@vtt/server` | 98% | ~30% (auth tests exist) | High |
| `@vtt/web` | 95% | 0% | High |
| E2E Coverage | 90% critical paths | 0% | High |

---

## 2. Unit Testing Strategy

### 2.1 Server Package (`apps/server`)

#### Test Files Needed

| File | Tests Needed | Estimated Count |
|------|--------------|-----------------|
| `src/routes/api/v1/games.test.ts` | CRUD operations, authorization, validation | 20-25 |
| `src/routes/api/v1/scenes.test.ts` | Scene CRUD, game association | 18-22 |
| `src/routes/api/v1/tokens.test.ts` | Token fetching, scene validation | 10-12 |
| `src/routes/api/v1/users.test.ts` | User management | 8-10 |
| `src/routes/health.test.ts` | Health check endpoint | 3-5 |
| `src/websocket/rooms.test.ts` | Room management, broadcast | 15-18 |
| `src/websocket/auth.test.ts` | WebSocket authentication | 8-10 |
| `src/websocket/handlers/game.test.ts` | All WebSocket message handlers | 35-45 |
| `src/plugins/database.test.ts` | Database plugin initialization | 5-8 |
| `src/plugins/cors.test.ts` | CORS configuration | 3-5 |
| `src/plugins/websocket.test.ts` | WebSocket plugin setup | 5-8 |
| `src/plugins/redis.test.ts` | Redis plugin setup | 5-8 |
| `src/config/env.test.ts` | Environment configuration validation | 8-10 |
| `src/app.test.ts` | App building and configuration | 10-12 |

**Total estimated server tests: 153-188**

#### Mocking Strategies for Server

```typescript
// Database mocking approach
vi.mock('@vtt/database', () => ({
  createDb: vi.fn(() => mockDb),
  users: mockUsersTable,
  sessions: mockSessionsTable,
  games: mockGamesTable,
}));

// WebSocket mocking
const mockSocket = {
  readyState: 1,
  send: vi.fn(),
  on: vi.fn(),
  close: vi.fn(),
};

// Redis mocking
vi.mock('ioredis', () => ({
  default: vi.fn(() => mockRedisClient),
}));
```

### 2.2 Shared Package (`packages/shared`)

#### Test Files Needed

| File | Tests Needed | Estimated Count |
|------|--------------|-----------------|
| `src/dice/parser.test.ts` | Already exists | 40+ (existing) |
| `src/dice/random.test.ts` | Already exists | 15+ (existing) |
| `src/utils/id.test.ts` | ID generation | 8-10 |
| `src/types/*.test.ts` | Type validation/guards (10 files) | 50-80 |

**Total estimated shared tests: 118-152**

### 2.3 Database Package (`packages/database`)

#### Test Files Needed

| File | Tests Needed | Estimated Count |
|------|--------------|-----------------|
| `src/schema/*.test.ts` | Schema structure, constraints (10 files) | 60-80 |
| `src/index.test.ts` | Database connection, exports | 5-8 |
| `src/migrate.test.ts` | Migration utilities | 5-8 |

**Total estimated database tests: 78-102**

### 2.4 Web Package (`apps/web`)

#### Store Tests

| File | Tests Needed | Estimated Count |
|------|--------------|-----------------|
| `src/lib/stores/auth.test.ts` | Auth store operations | 15-20 |
| `src/lib/stores/games.test.ts` | Games store operations | 12-15 |
| `src/lib/stores/scenes.test.ts` | Scenes store operations | 10-12 |
| `src/lib/stores/tokens.test.ts` | Tokens store operations | 10-12 |
| `src/lib/stores/walls.test.ts` | Walls store operations | 8-10 |
| `src/lib/stores/websocket.test.ts` | WebSocket store operations | 20-25 |

#### Component Tests

| File | Tests Needed | Estimated Count |
|------|--------------|-----------------|
| `src/lib/components/Header.test.ts` | Rendering, navigation | 8-10 |
| `src/lib/components/GameCanvas.test.ts` | Canvas interactions | 15-20 |
| `src/lib/components/SceneCanvas.test.ts` | Scene rendering | 25-30 |

**Total estimated web tests: 161-203**

---

## 3. Playwright E2E Strategy

### 3.1 Test Scenarios

#### Authentication Flows (`tests/e2e/auth/`)

| Test File | Scenarios | Tests |
|-----------|-----------|-------|
| `registration.spec.ts` | New user registration | 5-7 |
| `login.spec.ts` | Login, logout, session persistence | 6-8 |
| `session.spec.ts` | Session expiration, refresh | 4-5 |

#### Game Management Flows (`tests/e2e/games/`)

| Test File | Scenarios | Tests |
|-----------|-----------|-------|
| `create-game.spec.ts` | Create game, settings | 5-7 |
| `game-list.spec.ts` | List, filter, pagination | 4-5 |
| `game-settings.spec.ts` | Update, delete game | 5-6 |
| `scene-management.spec.ts` | Create, switch, delete scenes | 8-10 |

#### Gameplay Flows (`tests/e2e/gameplay/`)

| Test File | Scenarios | Tests |
|-----------|-----------|-------|
| `token-interaction.spec.ts` | Add, move, delete tokens | 8-10 |
| `multiplayer.spec.ts` | Multi-user sync | 10-12 |
| `dice-rolling.spec.ts` | Roll dice, broadcast results | 5-7 |
| `chat.spec.ts` | Send/receive messages | 4-5 |
| `wall-drawing.spec.ts` | Add, update, remove walls | 6-8 |

**Total estimated E2E tests: 70-90**

### 3.2 Page Object Model Structure

```
tests/e2e/
├── pages/
│   ├── BasePage.ts           # Common page interactions
│   ├── LoginPage.ts          # Login form interactions
│   ├── RegisterPage.ts       # Registration form
│   ├── GamesListPage.ts      # Games list page
│   ├── GameSessionPage.ts    # Active game session
│   └── SceneCanvasPage.ts    # Canvas interactions
├── fixtures/
│   ├── auth.fixture.ts       # Authentication setup
│   ├── game.fixture.ts       # Game creation setup
│   └── users.fixture.ts      # Test user data
├── utils/
│   ├── db-helpers.ts         # Database seeding/cleanup
│   ├── ws-helpers.ts         # WebSocket test utilities
│   └── api-helpers.ts        # API request helpers
└── playwright.config.ts      # Playwright configuration
```

---

## 4. Implementation Phases

### Phase 1: Infrastructure Setup
- Create root-level `vitest.workspace.ts` for monorepo
- Configure coverage reporting with `@vitest/coverage-v8`
- Set up test utilities and shared mocks
- Install Playwright and configure
- Create shared test fixtures
- Set up CI pipeline for tests

### Phase 2: Server Unit Tests
- Route tests (games, scenes, tokens)
- WebSocket handler tests
- Room manager tests
- Plugin tests
- Config and app tests
- **Target: 150+ tests, 98% coverage**

### Phase 3: Shared Package Tests
- Complete coverage of dice module
- Utility function tests (id generation)
- Type validation/guard tests
- **Target: 115+ tests, 98% coverage**

### Phase 4: Database Package Tests
- Schema structure validation tests
- Relationship tests
- Migration utility tests
- **Target: 80+ tests, 95% coverage**

### Phase 5: Web/Frontend Tests
- Store unit tests
- Component tests
- Route/page tests
- **Target: 160+ tests, 95% coverage**

### Phase 6: Playwright E2E Tests
- Authentication flows
- Game management flows
- Gameplay/real-time flows
- **Target: 70+ tests, 90% critical path coverage**

### Phase 7: Coverage Optimization
- Identify coverage gaps
- Add missing edge case tests
- Add error handling tests
- Performance optimization

---

## 5. Configuration Files

### 5.1 Root Level

**`vitest.workspace.ts`**
```typescript
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'apps/server/vitest.config.ts',
  'apps/web/vitest.config.ts',
  'packages/shared/vitest.config.ts',
  'packages/database/vitest.config.ts',
]);
```

**`playwright.config.ts`**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: [
    {
      command: 'pnpm --filter @vtt/server dev',
      url: 'http://localhost:3000/health',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter @vtt/web dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

---

## 6. Dependencies to Install

```bash
# Root level (Playwright)
pnpm add -D @playwright/test -w

# Web package (testing-library for Svelte)
pnpm add -D @testing-library/svelte @testing-library/jest-dom jsdom -F @vtt/web

# All packages (coverage reporter)
pnpm add -D @vitest/coverage-v8 -w
```

---

## 7. Test File Inventory Summary

| Package | New Files | Update Files | Total Tests |
|---------|-----------|--------------|-------------|
| `@vtt/server` | 12 | 2 (existing) | 153-188 |
| `@vtt/shared` | 12 | 2 (existing) | 118-152 |
| `@vtt/database` | 12 | 0 | 78-102 |
| `@vtt/web` | 14 | 0 | 161-203 |
| E2E (Playwright) | 11 | 0 | 70-90 |
| **Total** | **61** | **4** | **580-735** |

---

**Last Updated**: 2025-12-04
