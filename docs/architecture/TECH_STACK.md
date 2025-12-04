# Technology Stack

## Document Status
**Status**: Confirmed
**Last Updated**: 2025-12-04
**Version**: 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Frontend Stack](#frontend-stack)
4. [Backend Stack](#backend-stack)
5. [Data Layer](#data-layer)
6. [Real-Time Communication](#real-time-communication)
7. [Development Environment](#development-environment)
8. [Key Dependencies](#key-dependencies)
9. [Decision Rationale](#decision-rationale)
10. [Deployment Architecture](#deployment-architecture)

---

## Overview

The VTT platform is built with a modern, performance-focused stack optimized for real-time collaboration and rich graphical rendering. The architecture prioritizes low latency for token movement, efficient WebSocket communication, and scalable data storage.

### Core Technology Decisions

| Layer | Technology | Primary Reason |
|-------|-----------|----------------|
| Frontend Framework | Svelte + SvelteKit | Minimal overhead, no virtual DOM, built-in reactivity |
| Graphics Engine | PixiJS v8 | WebGL/WebGPU rendering, proven in VTT space (Foundry) |
| Backend Framework | Fastify (Node.js) | High performance, native WebSocket support, TypeScript-first |
| Database | PostgreSQL | JSONB for flexible game data, strong relational integrity |
| Cache/PubSub | Redis | Session management, real-time pub/sub for scaling |
| Language | TypeScript | Type safety across full stack, better DX |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          VTT SYSTEM ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────┐         │
│  │                    CLIENT (Browser)                            │         │
│  ├────────────────────────────────────────────────────────────────┤         │
│  │                                                                 │         │
│  │  ┌──────────────────────────────────────────────────────────┐ │         │
│  │  │           Svelte Components (SvelteKit)                  │ │         │
│  │  │  - UI Components (buttons, modals, forms)                │ │         │
│  │  │  - Game UI (initiative tracker, chat, toolbars)          │ │         │
│  │  │  - Svelte Stores (state management)                      │ │         │
│  │  └────────────────┬───────────────────────────┬─────────────┘ │         │
│  │                   │                           │                │         │
│  │                   ▼                           ▼                │         │
│  │  ┌─────────────────────────┐   ┌──────────────────────────┐  │         │
│  │  │   PixiJS Canvas Layer   │   │  WebSocket Client        │  │         │
│  │  │  - Scene Renderer       │   │  - Real-time events      │  │         │
│  │  │  - Token Sprites        │   │  - State sync            │  │         │
│  │  │  - Lighting/FOW         │   │  - Chat messages         │  │         │
│  │  │  - Grid/Map rendering   │   │  - Token movements       │  │         │
│  │  └─────────────────────────┘   └────────────┬─────────────┘  │         │
│  │                                              │                 │         │
│  └──────────────────────────────────────────────┼─────────────────┘         │
│                                                  │                           │
│                                    WSS/HTTPS    │                           │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                  │                           │
│  ┌───────────────────────────────────────────────┼──────────────────────┐  │
│  │                    SERVER (Node.js)           ▼                      │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                       │  │
│  │  ┌───────────────────────────────────────────────────────────────┐  │  │
│  │  │              Fastify HTTP Server                              │  │  │
│  │  │  - REST API Routes                                            │  │  │
│  │  │  - @fastify/websocket (WebSocket server)                      │  │  │
│  │  │  - Authentication middleware                                  │  │  │
│  │  │  - Request validation (Zod)                                   │  │  │
│  │  └───────────┬──────────────────────────────┬────────────────────┘  │  │
│  │              │                               │                       │  │
│  │              ▼                               ▼                       │  │
│  │  ┌─────────────────────┐       ┌───────────────────────────┐       │  │
│  │  │  Business Logic     │       │   WebSocket Handler       │       │  │
│  │  │  - Campaign mgmt    │       │   - Room management       │       │  │
│  │  │  - Token operations │       │   - Event broadcasting    │       │  │
│  │  │  - Dice rolling     │       │   - Presence tracking     │       │  │
│  │  │  - Permissions      │       │   - State synchronization │       │  │
│  │  └──────────┬──────────┘       └────────────┬──────────────┘       │  │
│  │             │                                │                       │  │
│  │             └────────────────┬───────────────┘                       │  │
│  │                              │                                       │  │
│  └──────────────────────────────┼───────────────────────────────────────┘  │
│                                 │                                           │
│  ═══════════════════════════════════════════════════════════════════════  │
│                                 │                                           │
│  ┌──────────────────────────────┼───────────────────────────────────────┐  │
│  │              DATA LAYER      ▼                                       │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                       │  │
│  │  ┌──────────────────────┐           ┌──────────────────────┐        │  │
│  │  │   PostgreSQL 16+     │           │      Redis 7+        │        │  │
│  │  ├──────────────────────┤           ├──────────────────────┤        │  │
│  │  │ - Users & Auth       │           │ - Sessions           │        │  │
│  │  │ - Campaigns          │           │ - WebSocket rooms    │        │  │
│  │  │ - Characters         │           │ - Rate limiting      │        │  │
│  │  │ - Maps & Tokens      │           │ - Pub/Sub channels   │        │  │
│  │  │ - Chat history       │           │ - Real-time state    │        │  │
│  │  │ - JSONB game data    │           │ - Cache layer        │        │  │
│  │  └──────────────────────┘           └──────────────────────┘        │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Frontend Stack

### Core Framework: Svelte + SvelteKit

**Version**: Svelte 4.x / SvelteKit 2.x

**Key Features**:
- **No Virtual DOM**: Direct DOM manipulation = minimal latency for real-time token movement
- **Reactive Stores**: Built-in state management integrates seamlessly with WebSocket state
- **Tiny Bundle**: ~1.6KB runtime vs React's 40KB - faster initial load
- **Compiler-Based**: Work done at build time, not runtime
- **TypeScript Support**: First-class TypeScript integration

**Why Svelte over React/Vue**:
1. **Performance**: Lowest overhead for frequent DOM updates (token dragging, cursor tracking)
2. **Reactivity**: Automatic reactivity without hooks complexity
3. **Size**: Critical for loading on slower connections
4. **Direct API**: Easier integration with PixiJS imperative code

### Graphics Engine: PixiJS v8

**Version**: 8.x (WebGPU support)

**Key Features**:
- **WebGL Rendering**: Hardware-accelerated, 60 FPS with 100+ tokens
- **Sprite Batching**: Efficient rendering of multiple tokens
- **Texture Management**: Optimized asset loading and caching
- **Filter System**: Dynamic lighting, fog of war effects
- **WebGPU Ready**: Future-proof with v8 update

**Why PixiJS**:
1. **Proven in VTT Space**: Foundry VTT built on PixiJS
2. **Performance**: Handles complex scenes with many sprites
3. **Mature Ecosystem**: Extensive plugins and community
4. **Lighting/FOW**: Built-in support for advanced visual effects

**Integration Pattern**:
```typescript
// Svelte component manages PixiJS application
<script lang="ts">
  import { onMount } from 'svelte';
  import { Application } from 'pixi.js';

  let canvasContainer: HTMLDivElement;
  let app: Application;

  onMount(() => {
    app = new Application({
      width: 1920,
      height: 1080,
      antialias: true,
      resolution: window.devicePixelRatio
    });

    canvasContainer.appendChild(app.view);

    return () => app.destroy();
  });
</script>

<div bind:this={canvasContainer} class="pixi-canvas"></div>
```

### UI Component Library

**Base**: Custom components in Svelte
- No heavy component library overhead
- Tailwind CSS for utility-first styling
- Headless UI patterns for accessibility

**Key Libraries**:
- `svelte-dnd-action`: Drag and drop for tokens
- `svelte-gestures`: Touch/gesture support
- `@sveltejs/kit`: Routing, SSR, API routes

---

## Backend Stack

### Web Framework: Fastify

**Version**: 4.x

**Key Features**:
- **Performance**: 2-3x faster than Express
- **Schema Validation**: Built-in JSON schema validation
- **Plugin Architecture**: Clean separation of concerns
- **TypeScript First**: Excellent type definitions
- **WebSocket Support**: Native via `@fastify/websocket`

**Why Fastify over Express/NestJS**:
1. **Speed**: Critical for real-time game server
2. **WebSocket Integration**: `@fastify/websocket` is mature and performant
3. **Validation**: Built-in schema validation reduces boilerplate
4. **Modern**: Built for async/await from ground up

**Example Server Structure**:
```typescript
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { gameRoutes } from './routes/game';
import { authRoutes } from './routes/auth';

const server = Fastify({
  logger: true
});

// Register plugins
await server.register(websocket);
await server.register(authRoutes, { prefix: '/api/auth' });
await server.register(gameRoutes, { prefix: '/api/game' });

// WebSocket handler
server.register(async (fastify) => {
  fastify.get('/ws', { websocket: true }, (socket, request) => {
    socket.on('message', (data) => {
      // Handle real-time game events
    });
  });
});

await server.listen({ port: 3000, host: '0.0.0.0' });
```

### Runtime: Node.js

**Version**: 20.x LTS (or latest LTS)

**Why Node.js**:
1. **JavaScript/TypeScript**: Same language as frontend
2. **WebSocket Performance**: Excellent for real-time apps
3. **Ecosystem**: Massive npm ecosystem
4. **Async I/O**: Perfect for handling many concurrent connections

---

## Data Layer

### Primary Database: PostgreSQL

**Version**: 16.x

**Key Features**:
- **JSONB Support**: Flexible game system data while maintaining relational integrity
- **Performance**: Excellent query performance with proper indexing
- **ACID Compliance**: Data integrity for critical operations
- **Extensions**: PostGIS for spatial queries (future fog of war optimizations)
- **Full-Text Search**: For searching campaigns, notes, characters

**Data Model Strategy**:
```sql
-- Structured core data + flexible game data
CREATE TABLE characters (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    campaign_id UUID REFERENCES campaigns,

    -- Relational data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- System-specific data (HP, stats, abilities vary by game system)
    game_data JSONB DEFAULT '{}'
);

-- Index JSONB for performance
CREATE INDEX idx_character_game_data ON characters USING GIN (game_data);
```

**Why PostgreSQL over MongoDB/MySQL**:
1. **Hybrid Approach**: Relational + JSONB = best of both worlds
2. **Data Integrity**: Foreign keys ensure consistency
3. **Performance**: Better than MongoDB for complex joins
4. **JSONB vs MySQL JSON**: More efficient storage and indexing

### ORM: Drizzle ORM

**Version**: Latest

**Why Drizzle**:
- **TypeScript Native**: Type-safe queries with minimal overhead
- **Performance**: Thin abstraction, nearly raw SQL speed
- **Migrations**: Built-in migration system
- **No Code Generation**: Unlike Prisma, no generation step

**Alternative**: Prisma (more features, heavier)

**Example Schema**:
```typescript
import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const characters = pgTable('characters', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  campaignId: uuid('campaign_id').references(() => campaigns.id),
  gameData: jsonb('game_data').$type<GameData>().default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

### Cache/Session Store: Redis

**Version**: 7.x

**Key Features**:
- **In-Memory Performance**: Sub-millisecond latency
- **Pub/Sub**: Real-time message broadcasting across server instances
- **Session Storage**: Fast session lookup
- **Rate Limiting**: Token bucket for API rate limiting
- **Presence Tracking**: Track online users per campaign

**Use Cases**:
1. **Session Management**: Store JWT session data
2. **WebSocket Room State**: Track connected clients per campaign
3. **Pub/Sub**: Broadcast game events across multiple server instances
4. **Rate Limiting**: Prevent abuse
5. **Caching**: Cache frequently accessed data (user profiles, campaign metadata)

**Example Usage**:
```typescript
import { createClient } from 'redis';

const redis = createClient({ url: 'redis://localhost:6379' });
await redis.connect();

// Session storage
await redis.set(`session:${sessionId}`, JSON.stringify(sessionData), {
  EX: 86400 // 24 hour expiry
});

// Pub/Sub for broadcasting
const publisher = redis.duplicate();
await publisher.connect();

// Broadcast token movement to all servers
await publisher.publish(`campaign:${campaignId}:events`, JSON.stringify({
  type: 'token_moved',
  tokenId,
  x,
  y
}));
```

---

## Real-Time Communication

### WebSocket Implementation

**Library**: `@fastify/websocket` (built on `ws`)

**Architecture**:
```typescript
// WebSocket connection handler
fastify.register(async (fastify) => {
  fastify.get('/ws/campaign/:campaignId', { websocket: true }, async (socket, request) => {
    const { campaignId } = request.params;
    const userId = request.user.id;

    // Join campaign room in Redis
    await redis.sAdd(`campaign:${campaignId}:members`, userId);

    // Subscribe to campaign events
    const subscriber = redis.duplicate();
    await subscriber.connect();
    await subscriber.subscribe(`campaign:${campaignId}:events`, (message) => {
      socket.send(message);
    });

    // Handle incoming messages
    socket.on('message', async (data) => {
      const event = JSON.parse(data.toString());

      // Validate and process event
      await handleGameEvent(event, campaignId, userId);

      // Broadcast to all campaign members
      await redis.publish(`campaign:${campaignId}:events`, data.toString());
    });

    // Cleanup on disconnect
    socket.on('close', async () => {
      await redis.sRem(`campaign:${campaignId}:members`, userId);
      await subscriber.quit();
    });
  });
});
```

### Event Types

**Client → Server**:
- `token_move`: Move token to new position
- `chat_message`: Send chat message
- `dice_roll`: Roll dice
- `map_pan`: GM updates camera position
- `fog_update`: GM reveals/hides areas

**Server → Client**:
- `token_moved`: Token position updated
- `token_added`: New token on map
- `chat_message`: New chat message
- `dice_result`: Dice roll result
- `state_sync`: Full state synchronization

### State Management Strategy

**Frontend Store**:
```typescript
// stores/campaign.ts
import { writable } from 'svelte/store';
import type { Campaign, Token } from '$lib/types';

export const campaign = writable<Campaign | null>(null);
export const tokens = writable<Map<string, Token>>(new Map());

// WebSocket integration
export function connectToCampaign(campaignId: string) {
  const ws = new WebSocket(`wss://api.vtt.example/ws/campaign/${campaignId}`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case 'token_moved':
        tokens.update(map => {
          const token = map.get(data.tokenId);
          if (token) {
            token.x = data.x;
            token.y = data.y;
            map.set(data.tokenId, token);
          }
          return map;
        });
        break;
      // ... other event handlers
    }
  };

  return ws;
}
```

---

## Development Environment

### Core Tools

| Tool | Purpose | Version |
|------|---------|---------|
| **TypeScript** | Type safety across stack | 5.x |
| **Vite** | Frontend bundling, HMR | 5.x |
| **Vitest** | Unit testing | Latest |
| **Playwright** | E2E testing | Latest |
| **ESLint** | Linting | 8.x |
| **Prettier** | Code formatting | 3.x |
| **Docker** | Containerization | 24.x |
| **Docker Compose** | Local dev orchestration | 2.x |

### Project Structure

```
D:\Projects\VTT\
├── apps/
│   ├── web/                    # SvelteKit frontend
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── components/  # Svelte components
│   │   │   │   ├── stores/      # State management
│   │   │   │   ├── pixi/        # PixiJS managers
│   │   │   │   └── types/       # TypeScript types
│   │   │   ├── routes/          # SvelteKit routes
│   │   │   └── app.html
│   │   ├── static/              # Static assets
│   │   ├── tests/               # Frontend tests
│   │   ├── svelte.config.js
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api/                    # Fastify backend
│       ├── src/
│       │   ├── routes/          # API routes
│       │   ├── websocket/       # WS handlers
│       │   ├── services/        # Business logic
│       │   ├── db/              # Database layer
│       │   │   ├── schema.ts    # Drizzle schema
│       │   │   └── migrations/  # DB migrations
│       │   ├── utils/
│       │   └── server.ts        # Main entry
│       ├── tests/
│       ├── tsconfig.json
│       └── package.json
│
├── packages/                   # Shared packages
│   ├── types/                  # Shared TypeScript types
│   ├── validation/             # Zod schemas
│   └── config/                 # Shared config
│
├── docs/                       # Documentation
├── scripts/                    # Utility scripts
├── docker/                     # Docker configs
│   ├── Dockerfile.web
│   ├── Dockerfile.api
│   └── docker-compose.yml
│
├── .github/                    # GitHub Actions
├── package.json                # Root package.json (monorepo)
├── pnpm-workspace.yaml         # pnpm workspaces
└── turbo.json                  # Turborepo config
```

### Monorepo Strategy

**Tool**: **Turborepo** + **pnpm**

**Why Monorepo**:
1. Shared types between frontend/backend
2. Atomic commits across stack
3. Simplified dependency management
4. Faster CI/CD with caching

**Example Configuration**:
```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".svelte-kit/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Docker Setup

**docker-compose.yml**:
```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: vtt
      POSTGRES_USER: vtt
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://vtt:dev_password@postgres:5432/vtt
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./apps/api:/app
      - /app/node_modules

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000
      VITE_WS_URL: ws://localhost:3000
    depends_on:
      - api
    volumes:
      - ./apps/web:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
```

---

## Key Dependencies

### Frontend Dependencies

```json
{
  "dependencies": {
    "@sveltejs/kit": "^2.5.0",
    "svelte": "^4.2.0",
    "pixi.js": "^8.0.0",
    "zod": "^3.22.0",
    "tailwindcss": "^3.4.0",
    "svelte-websocket-store": "^1.0.0"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^3.0.0",
    "@playwright/test": "^1.40.0",
    "vite": "^5.0.0",
    "vitest": "^1.2.0",
    "typescript": "^5.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

**Key Libraries Explained**:

| Library | Purpose | Why This One |
|---------|---------|--------------|
| `pixi.js` | Graphics rendering | WebGL performance, VTT proven |
| `zod` | Runtime validation | Type-safe API contracts |
| `svelte-websocket-store` | WebSocket Svelte integration | Seamless reactive WebSocket |
| `tailwindcss` | Utility CSS | Rapid UI development |
| `@playwright/test` | E2E testing | Reliable, fast E2E tests |

### Backend Dependencies

```json
{
  "dependencies": {
    "fastify": "^4.25.0",
    "@fastify/websocket": "^10.0.0",
    "@fastify/cors": "^9.0.0",
    "@fastify/jwt": "^8.0.0",
    "@fastify/rate-limit": "^9.0.0",
    "drizzle-orm": "^0.29.0",
    "postgres": "^3.4.0",
    "redis": "^4.6.0",
    "zod": "^3.22.0",
    "bcrypt": "^5.1.0",
    "pino": "^8.17.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.0",
    "@types/node": "^20.10.0",
    "@types/bcrypt": "^5.0.0",
    "vitest": "^1.2.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
```

**Key Libraries Explained**:

| Library | Purpose | Why This One |
|---------|---------|--------------|
| `@fastify/websocket` | WebSocket server | Native Fastify integration |
| `@fastify/jwt` | JWT authentication | Fast, secure token validation |
| `drizzle-orm` | Database ORM | Type-safe, minimal overhead |
| `redis` | Redis client | Official Node.js client |
| `pino` | Logging | Fastest Node.js logger |
| `bcrypt` | Password hashing | Industry standard |

### Shared Dependencies

```json
{
  "dependencies": {
    "zod": "^3.22.0",
    "typescript": "^5.3.0"
  }
}
```

---

## Decision Rationale

### Why This Stack?

#### Performance Requirements

**Target Metrics**:
- **Token Movement Latency**: < 50ms end-to-end
- **WebSocket Message Latency**: < 30ms server processing
- **Frame Rate**: Stable 60 FPS with 100+ tokens
- **Initial Load**: < 3 seconds on 3G

**How Stack Achieves This**:

1. **Svelte's No Virtual DOM**:
   - Direct DOM manipulation = no reconciliation overhead
   - Critical for smooth token dragging

2. **PixiJS WebGL**:
   - GPU-accelerated rendering
   - Sprite batching reduces draw calls

3. **Fastify Performance**:
   - 2-3x faster request handling than Express
   - Lower overhead = more concurrent connections

4. **Redis Pub/Sub**:
   - Sub-millisecond latency for event broadcasting
   - Enables horizontal scaling

#### Developer Experience

**Why TypeScript Throughout**:
- Catch errors at compile time
- Better IDE support
- Refactoring confidence
- Shared types between frontend/backend

**Why Monorepo**:
- Single source of truth for types
- Simplified dependency management
- Atomic cross-stack changes
- Better collaboration

**Why Drizzle over Prisma**:
- Lighter weight (no code generation)
- Better TypeScript inference
- Nearly raw SQL performance
- Simpler mental model

#### Scalability Considerations

**Horizontal Scaling Strategy**:

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    └────────┬────────┘
                             │
        ┏━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━┓
        ▼                                        ▼
┌───────────────┐                      ┌───────────────┐
│  API Server 1 │                      │  API Server 2 │
└───────┬───────┘                      └───────┬───────┘
        │                                      │
        └────────────┬────────────────────────┘
                     │
        ┌────────────┴─────────────┐
        ▼                          ▼
┌───────────────┐          ┌──────────────┐
│  PostgreSQL   │          │    Redis     │
│  (Primary)    │          │  (Pub/Sub)   │
└───────────────┘          └──────────────┘
```

**How It Scales**:
1. **Stateless API Servers**: Any server can handle any request
2. **Redis Pub/Sub**: Events broadcast to all servers
3. **PostgreSQL Read Replicas**: Read-heavy queries off-loaded
4. **Redis Cluster**: Distributed caching and session storage

#### Why Not Other Stacks?

| Alternative | Why Not Chosen |
|-------------|----------------|
| **React + Next.js** | Virtual DOM overhead, larger bundle, unnecessary complexity |
| **Vue + Nuxt** | Heavier than Svelte, less performant for real-time |
| **Express.js** | 2-3x slower than Fastify, less modern |
| **NestJS** | Too heavy/opinionated, unnecessary overhead |
| **MongoDB** | Weaker relational integrity, JSONB gives flexibility without sacrifice |
| **Socket.io** | Unnecessary abstraction over WebSockets, heavier |
| **Prisma** | Code generation adds complexity, heavier than Drizzle |

---

## Deployment Architecture

### Production Environment

**Hosting**: Docker containers on cloud platform (AWS/GCP/DigitalOcean)

**Components**:
1. **Web Server**: Nginx reverse proxy + static file serving
2. **API Servers**: 2+ Fastify instances behind load balancer
3. **PostgreSQL**: Managed service (AWS RDS / DigitalOcean Managed DB)
4. **Redis**: Managed service (AWS ElastiCache / Redis Cloud)
5. **CDN**: Cloudflare for static assets

**Example Production Docker Compose**:
```yaml
version: '3.9'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
      - web

  api:
    image: vtt-api:latest
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      JWT_SECRET: ${JWT_SECRET}
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure

  web:
    image: vtt-web:latest
    environment:
      NODE_ENV: production
```

### CI/CD Pipeline

**Tool**: GitHub Actions

**Pipeline**:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build and push Docker images
        # ... docker build and push
      - name: Deploy to production
        # ... deployment steps
```

---

## Version Recommendations

### Minimum Versions

| Dependency | Minimum Version | Reason |
|------------|----------------|--------|
| Node.js | 20.x LTS | Native WebSocket, performance improvements |
| PostgreSQL | 14.x | JSONB performance improvements |
| Redis | 7.x | Improved pub/sub, better memory efficiency |
| TypeScript | 5.x | Better type inference, performance |

### Recommended Versions (as of 2025-12-04)

| Dependency | Version | Notes |
|------------|---------|-------|
| Node.js | 20.11.0 LTS | Stable, excellent performance |
| Svelte | 4.2.x | Mature, stable before Svelte 5 migration |
| SvelteKit | 2.x | Latest stable |
| PixiJS | 8.0.x | WebGPU support |
| Fastify | 4.25.x | Latest stable |
| PostgreSQL | 16.x | Latest stable, best JSONB performance |
| Redis | 7.2.x | Latest stable |
| TypeScript | 5.3.x | Latest stable |

---

## Next Steps

### Immediate Setup Tasks

1. **Initialize Monorepo**:
   ```bash
   pnpm init
   mkdir -p apps/web apps/api packages/types
   ```

2. **Setup SvelteKit**:
   ```bash
   cd apps/web
   npm create svelte@latest .
   pnpm install pixi.js zod tailwindcss
   ```

3. **Setup Fastify**:
   ```bash
   cd apps/api
   pnpm init
   pnpm add fastify @fastify/websocket drizzle-orm postgres redis
   ```

4. **Setup Docker**:
   ```bash
   docker-compose up -d postgres redis
   ```

5. **Initialize Database**:
   ```bash
   cd apps/api
   pnpm drizzle-kit generate
   pnpm drizzle-kit push
   ```

### Learning Resources

| Technology | Resource |
|------------|----------|
| Svelte | [Official Tutorial](https://svelte.dev/tutorial) |
| SvelteKit | [Official Docs](https://kit.svelte.dev/docs) |
| PixiJS | [Official Guide](https://pixijs.com/guides) |
| Fastify | [Official Docs](https://fastify.dev/docs/latest/) |
| Drizzle | [Official Docs](https://orm.drizzle.team/docs/overview) |
| WebSockets | [MDN Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) |

---

## Appendix: Alternative Considerations

### Frontend Alternatives Evaluated

| Framework | Pros | Cons | Decision |
|-----------|------|------|----------|
| **React** | Large ecosystem, hiring | Bundle size, virtual DOM overhead | ❌ Too heavy |
| **Vue** | Good balance, composition API | Heavier than Svelte | ❌ Less performant |
| **Solid.js** | Reactive, fast | Smaller ecosystem, less mature | 🤔 Viable alternative |
| **Svelte** | Tiny, fast, simple | Smaller ecosystem | ✅ **Selected** |

### Backend Alternatives Evaluated

| Framework | Pros | Cons | Decision |
|-----------|------|------|----------|
| **Express** | Huge ecosystem, simple | Slower, callback-based | ❌ Performance |
| **NestJS** | Enterprise-ready, opinionated | Heavy, complex | ❌ Overkill |
| **Hono** | Edge-ready, fast | New, smaller ecosystem | 🤔 Future consideration |
| **Fastify** | Fast, modern, plugins | Smaller than Express | ✅ **Selected** |

### Database Alternatives Evaluated

| Database | Pros | Cons | Decision |
|----------|------|------|----------|
| **MongoDB** | Flexible schema, simple | Weak joins, no transactions | ❌ Need relations |
| **MySQL** | Popular, reliable | JSON support weaker than PG | ❌ JSONB performance |
| **PostgreSQL** | JSONB + relations, powerful | Setup complexity | ✅ **Selected** |
| **SQLite** | Simple, serverless | Not scalable | ❌ Need scale |

---

**Document End**

For questions or suggestions, refer to the [Architecture Documentation README](./README.md).
