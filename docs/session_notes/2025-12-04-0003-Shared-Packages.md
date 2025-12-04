# Session Notes: Shared Packages Creation

**Date**: 2025-12-04
**Session ID**: 0003
**Focus**: Creating shared TypeScript packages for types, utilities, and database schema

---

## Session Summary

Created two foundational packages for the VTT monorepo:
1. `@vtt/shared` - Shared TypeScript types and utilities
2. `@vtt/database` - Drizzle ORM schema and database configuration

Both packages are fully typed, compiled successfully, and ready to be imported by other workspace packages (apps/server, apps/web).

## What Was Accomplished

### 1. packages/shared - Shared Types and Utilities

Created a complete TypeScript package containing all shared type definitions and utility functions used across the VTT application.

**Structure:**
```
packages/shared/
├── src/
│   ├── index.ts              # Main exports
│   ├── types/
│   │   ├── index.ts          # Type exports
│   │   ├── game.ts           # Game-related types
│   │   ├── user.ts           # User types
│   │   └── websocket.ts      # WebSocket message types
│   └── utils/
│       ├── index.ts          # Utility exports
│       └── id.ts             # ID generation utilities
├── dist/                     # Compiled output
├── tsconfig.json             # TypeScript configuration
└── package.json              # Already existed
```

**Files Created (8 files):**

#### Type Definitions

**types/user.ts:**
- `User` interface - User account data structure
- `Session` interface - User session data with expiration

**types/game.ts:**
- `Game` interface - Game session data
- `GameSettings` interface - Grid configuration (square/hex/none)
- `Token` interface - Game token/piece on the map
- `MapLayer` interface - Layer system for backgrounds, tokens, GM content, effects

**types/websocket.ts:**
- `WSMessageType` - Union type of all WebSocket message types
- `WSMessage<T>` - Generic WebSocket message wrapper
- `TokenMovePayload` - Token movement data
- `DiceRollPayload` - Dice roll request
- `DiceResultPayload` - Dice roll result with rolls array and total

**types/index.ts:**
- Re-exports all type definitions

#### Utilities

**utils/id.ts:**
- `generateId(length)` - Simple ID generator using alphanumeric characters
- `generateGameId()` - Specialized 8-character game ID generator

**utils/index.ts:**
- Re-exports all utility functions

#### Main Export

**src/index.ts:**
- Re-exports all types and utilities from one entry point

#### Configuration

**tsconfig.json:**
- Target: ES2022
- Module: ESNext
- Strict mode enabled
- Declaration files generated
- Output to `./dist`

### 2. packages/database - Drizzle ORM Schema

Created a complete database package with Drizzle ORM schema definitions for PostgreSQL.

**Structure:**
```
packages/database/
├── src/
│   ├── index.ts              # Database client export
│   ├── schema/
│   │   ├── index.ts          # Schema exports
│   │   ├── users.ts          # Users and sessions tables
│   │   └── games.ts          # Games and tokens tables
│   └── migrate.ts            # Migration runner script
├── dist/                     # Compiled output
├── drizzle.config.ts         # Drizzle Kit configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Already existed
```

**Files Created (7 files):**

#### Database Schema

**schema/users.ts:**
- `users` table:
  - `id` (UUID, primary key)
  - `email` (unique, not null)
  - `username` (not null)
  - `passwordHash` (nullable for OAuth)
  - `createdAt`, `updatedAt` (timestamps)

- `sessions` table:
  - `id` (UUID, primary key)
  - `userId` (foreign key to users, cascade delete)
  - `expiresAt` (not null)
  - `createdAt` (timestamp)

**schema/games.ts:**
- `games` table:
  - `id` (UUID, primary key)
  - `name` (not null)
  - `ownerId` (foreign key to users)
  - `settings` (JSONB, default {})
  - `createdAt`, `updatedAt` (timestamps)

- `tokens` table:
  - `id` (UUID, primary key)
  - `gameId` (foreign key to games, cascade delete)
  - `name` (not null)
  - `imageUrl` (nullable)
  - `x`, `y` (real/float, default 0)
  - `width`, `height` (real/float, default 1)
  - `ownerId` (foreign key to users, nullable)
  - `visible` (boolean, default true)
  - `data` (JSONB, default {})
  - `createdAt` (timestamp)

**schema/index.ts:**
- Re-exports all schema tables

#### Database Client

**src/index.ts:**
- `createDb(connectionString)` - Factory function to create database client
- Exports all schema definitions
- `Database` type - TypeScript type for the database client

**src/migrate.ts:**
- Migration runner script
- Reads `DATABASE_URL` from environment
- Runs migrations from `./drizzle` folder
- Includes error handling and process exit codes

#### Configuration

**drizzle.config.ts:**
- Schema path: `./src/schema/index.ts`
- Output folder: `./drizzle` (for migrations)
- Dialect: `postgresql`
- Uses `DATABASE_URL` environment variable

**tsconfig.json:**
- Same configuration as `@vtt/shared`
- Excludes `drizzle` folder from compilation

## Build Verification

Both packages were successfully built and compiled:

```bash
# @vtt/shared
cd packages/shared && npm run build
# ✓ Compiled successfully

# @vtt/database
cd packages/database && npm run build
# ✓ Compiled successfully
```

**Build Output:**
- `packages/shared/dist/` - Contains compiled JS, type declarations (.d.ts), and source maps
- `packages/database/dist/` - Contains compiled JS, type declarations (.d.ts), and source maps

Both packages have:
- Clean TypeScript compilation with no errors
- Generated declaration files for IDE autocomplete
- Source maps for debugging
- Proper module exports

## Package Dependencies

### @vtt/shared
- No runtime dependencies (types and utilities only)
- Dev dependencies: TypeScript, Vitest

### @vtt/database
- Runtime: `drizzle-orm`, `postgres`
- Dev: `drizzle-kit`, TypeScript, Vitest, @types/node

## Integration Points

These packages are designed to be imported by:

1. **apps/server** - Fastify backend
   - Import types from `@vtt/shared`
   - Import database client and schema from `@vtt/database`

2. **apps/web** - SvelteKit frontend
   - Import types from `@vtt/shared`
   - Use shared WebSocket message types for client-server communication

## Next Steps

1. **apps/server integration:**
   - Import `@vtt/database` and set up database connection
   - Import `@vtt/shared` types for API routes and WebSocket handlers
   - Update WebSocket handlers to use shared message types

2. **Database setup:**
   - Run `npm run db:generate` in `packages/database` to generate migrations
   - Set up PostgreSQL database
   - Run migrations with `npm run db:migrate`

3. **apps/web integration:**
   - Import `@vtt/shared` types for WebSocket communication
   - Use shared types in Svelte stores and components

## Key Design Decisions

1. **Monorepo structure** - Shared code in packages, apps consume them
2. **TypeScript-first** - All packages fully typed with declaration files
3. **Drizzle ORM** - Type-safe database queries with schema-first design
4. **UUID primary keys** - For distributed systems and better security
5. **JSONB fields** - Flexible data storage for game settings and token data
6. **Cascade deletes** - Automatic cleanup of related records

## Files Modified

None - all files are new creations.

## Current Status

✅ **Complete** - Both packages created, compiled, and ready for integration.

## Testing Notes

- No tests written yet (packages are type definitions and schema)
- Future: Add validation tests for utility functions
- Future: Add integration tests for database schema

---

**Session Complete** - Shared packages are ready for use by server and web applications.
