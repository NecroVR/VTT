# Database Integration Guide

This guide explains how the @vtt/database package is integrated into the apps/server Fastify application.

## Overview

The VTT application uses Drizzle ORM with PostgreSQL for database operations. The database package is integrated as a Fastify plugin that decorates the Fastify instance with a `db` property.

## Architecture

```
packages/database/           # Database package
├── src/
│   ├── schema/             # Drizzle schema definitions
│   │   ├── users.ts       # Users and sessions tables
│   │   ├── games.ts       # Games and tokens tables
│   │   └── index.ts       # Schema exports
│   ├── index.ts           # Package exports (createDb, Database type)
│   └── migrate.ts         # Migration runner

apps/server/                # Fastify backend
├── src/
│   ├── plugins/
│   │   └── database.ts    # Database plugin
│   ├── types/
│   │   └── index.ts       # TypeScript augmentation
│   └── routes/
│       └── api/v1/
│           └── users.ts   # Example route using database
```

## Integration Steps

### 1. Add Database Dependency

The database package is added to `apps/server/package.json`:

```json
{
  "dependencies": {
    "@vtt/database": "workspace:*",
    "drizzle-orm": "^0.37.0"
  }
}
```

**Note**: `drizzle-orm` must be a direct dependency to access Drizzle utilities (sql, eq, etc.) in route handlers.

### 2. Database Plugin

Created `apps/server/src/plugins/database.ts`:

```typescript
import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { createDb, type Database } from '@vtt/database';

const databasePlugin: FastifyPluginAsync = async (fastify) => {
  const connectionString = fastify.config.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required for database connection');
  }

  // Create database connection
  const db = createDb(connectionString);

  // Decorate Fastify instance with database
  fastify.decorate('db', db);

  fastify.log.info('Database connection initialized');
};

export default fp(databasePlugin, {
  name: 'database-plugin',
});
```

### 3. TypeScript Type Augmentation

Updated `apps/server/src/types/index.ts` to add the `db` property to FastifyInstance:

```typescript
declare module 'fastify' {
  interface FastifyInstance {
    config: EnvConfig;
    db: import('@vtt/database').Database;
  }
}
```

This provides full TypeScript IntelliSense for `fastify.db` in all route handlers.

### 4. Register Plugin in App

Updated `apps/server/src/app.ts` to register the database plugin:

```typescript
import databasePlugin from './plugins/database.js';

export async function buildApp(config: EnvConfig): Promise<FastifyInstance> {
  const app = Fastify({ /* ... */ });

  app.decorate('config', config);

  // Register plugins
  await app.register(corsPlugin);
  await app.register(databasePlugin);  // ← Database plugin
  await app.register(websocketPlugin);
  await app.register(redisPlugin);

  // ... rest of app setup
}
```

**Important**: The database plugin is registered before routes so that `fastify.db` is available in all route handlers.

## Using the Database in Routes

### Example: Users Route

Created `apps/server/src/routes/api/v1/users.ts` to demonstrate database usage:

```typescript
import type { FastifyPluginAsync } from 'fastify';
import { users } from '@vtt/database';
import { eq } from 'drizzle-orm';

const usersRoute: FastifyPluginAsync = async (fastify) => {
  // List all users
  fastify.get('/users', async () => {
    const allUsers = await fastify.db.select().from(users);
    return { users: allUsers };
  });

  // Get user by ID
  fastify.get<{ Params: { id: string } }>('/users/:id', async (request, reply) => {
    const { id } = request.params;

    const [user] = await fastify.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return { user };
  });

  // Create a new user
  fastify.post<{ Body: { email: string; username: string } }>(
    '/users',
    async (request, reply) => {
      const { email, username } = request.body;

      if (!email || !username) {
        return reply.status(400).send({ error: 'Email and username are required' });
      }

      try {
        const [newUser] = await fastify.db
          .insert(users)
          .values({ email, username })
          .returning();

        return reply.status(201).send({ user: newUser });
      } catch (error) {
        fastify.log.error(error, 'Failed to create user');
        return reply.status(500).send({ error: 'Failed to create user' });
      }
    }
  );
};

export default usersRoute;
```

### Common Patterns

#### 1. Select Queries

```typescript
// Select all records
const allUsers = await fastify.db.select().from(users);

// Select with conditions
const activeUsers = await fastify.db
  .select()
  .from(users)
  .where(eq(users.active, true));

// Select specific fields
const userEmails = await fastify.db
  .select({ email: users.email })
  .from(users);
```

#### 2. Insert Operations

```typescript
// Insert single record
const [newUser] = await fastify.db
  .insert(users)
  .values({ email: 'test@example.com', username: 'testuser' })
  .returning();

// Insert multiple records
const newUsers = await fastify.db
  .insert(users)
  .values([
    { email: 'user1@example.com', username: 'user1' },
    { email: 'user2@example.com', username: 'user2' },
  ])
  .returning();
```

#### 3. Update Operations

```typescript
const [updatedUser] = await fastify.db
  .update(users)
  .set({ username: 'newusername' })
  .where(eq(users.id, userId))
  .returning();
```

#### 4. Delete Operations

```typescript
await fastify.db
  .delete(users)
  .where(eq(users.id, userId));
```

#### 5. Joins

```typescript
import { sessions } from '@vtt/database';

const usersWithSessions = await fastify.db
  .select({
    user: users,
    session: sessions,
  })
  .from(users)
  .leftJoin(sessions, eq(users.id, sessions.userId));
```

## Health Check

The health check route (`/health`) has been updated to test the database connection:

```typescript
import { sql } from 'drizzle-orm';

fastify.get('/health', async () => {
  let dbStatus = 'ok';
  try {
    await fastify.db.execute(sql`SELECT 1`);
  } catch (error) {
    dbStatus = 'error';
    fastify.log.error(error, 'Database health check failed');
  }

  return {
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: fastify.config.NODE_ENV,
    database: dbStatus,
  };
});
```

## Database Schema

The database schema is defined in `packages/database/src/schema/`:

### Users Schema

```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  username: text('username').notNull(),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

## Environment Configuration

The database connection string is configured via environment variable:

```env
DATABASE_URL=postgresql://claude:Claude^YV18@localhost:5432/vtt
```

This is loaded in `apps/server/src/config/env.ts`:

```typescript
export function loadEnvConfig(): EnvConfig {
  const config: EnvConfig = {
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/vtt',
    // ... other config
  };

  if (!config.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return config;
}
```

## Running Migrations

To apply database migrations, use the database package scripts:

```bash
# From project root
cd packages/database

# Generate migrations from schema changes
pnpm run db:generate

# Apply migrations
pnpm run db:migrate

# Or push schema directly (dev only)
pnpm run db:push
```

## Connection Management

The postgres-js client (used by Drizzle) handles connection pooling automatically:

- Default pool size: 10 connections
- Automatic connection retry
- Graceful cleanup on process exit

No explicit connection cleanup is needed in the plugin, though you can add a close hook if needed:

```typescript
fastify.addHook('onClose', async () => {
  // Optional: explicit cleanup if needed
  fastify.log.info('Closing database connection');
});
```

## TypeScript Benefits

With the type augmentation, you get full IntelliSense in all route handlers:

- `fastify.db` is fully typed as `Database`
- All table schemas are typed (users, sessions, games, tokens)
- Query results are type-safe
- No need to import or pass database instance manually

## Testing

When writing tests, you can mock the database:

```typescript
import { test } from 'vitest';
import { buildApp } from '../src/app';

test('should query users', async () => {
  const config = loadTestConfig();
  const app = await buildApp(config);

  const response = await app.inject({
    method: 'GET',
    url: '/api/v1/users',
  });

  expect(response.statusCode).toBe(200);
  expect(response.json()).toHaveProperty('users');
});
```

## Troubleshooting

### Connection Errors

If you see connection errors:

1. Verify PostgreSQL is running:
   ```bash
   docker ps | grep trading_platform_db
   ```

2. Check the DATABASE_URL in `.env`:
   ```env
   DATABASE_URL=postgresql://claude:Claude^YV18@localhost:5432/vtt
   ```

3. Test connection manually:
   ```bash
   psql postgresql://claude:Claude^YV18@localhost:5432/vtt -c "SELECT 1"
   ```

### Schema Not Found Errors

If you see "relation does not exist" errors:

1. Run migrations:
   ```bash
   cd packages/database && pnpm run db:push
   ```

2. Verify tables exist:
   ```bash
   psql postgresql://claude:Claude^YV18@localhost:5432/vtt -c "\dt"
   ```

### Type Errors

If TypeScript doesn't recognize `fastify.db`:

1. Rebuild the project:
   ```bash
   pnpm run build
   ```

2. Restart TypeScript server in your editor

3. Verify type augmentation in `apps/server/src/types/index.ts`

## Next Steps

- Add more route handlers using the database
- Implement authentication with sessions table
- Add data validation with Zod
- Implement soft deletes and timestamps
- Add database query logging for debugging

## References

- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Fastify Plugins](https://fastify.dev/docs/latest/Reference/Plugins/)
- [postgres-js](https://github.com/porsager/postgres)
