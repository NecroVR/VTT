# VTT Server

Fastify-based backend server for the Virtual Tabletop (VTT) application.

## Features

- Fast and lightweight HTTP server built with Fastify
- WebSocket support for real-time game sessions
- CORS configuration for frontend integration
- Environment-based configuration
- TypeScript with full type safety
- Structured logging with Pino
- Health check endpoint

## Project Structure

```
apps/server/
├── src/
│   ├── index.ts            # Entry point with graceful shutdown
│   ├── app.ts              # Fastify app factory
│   ├── config/
│   │   └── env.ts          # Environment configuration
│   ├── plugins/
│   │   ├── cors.ts         # CORS plugin
│   │   ├── websocket.ts    # WebSocket plugin
│   │   └── redis.ts        # Redis plugin (placeholder)
│   ├── routes/
│   │   ├── index.ts        # Route registration
│   │   ├── health.ts       # Health check route
│   │   └── api/
│   │       └── v1/
│   │           └── index.ts  # API v1 routes
│   ├── websocket/
│   │   ├── index.ts        # WebSocket handler registration
│   │   └── handlers/
│   │       └── game.ts     # Game session WebSocket handlers
│   └── types/
│       └── index.ts        # Custom type declarations
├── dist/                   # Compiled JavaScript output
├── .env.example            # Example environment variables
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm (workspace manager)
- PostgreSQL (for database connection)

### Installation

Install dependencies from the workspace root:

```bash
pnpm install
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update environment variables in `.env`:
```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/vtt
CORS_ORIGIN=http://localhost:5173
```

### Development

Start the development server with hot reloading:

```bash
pnpm dev
```

The server will start at `http://localhost:3000` (or the port specified in `.env`).

### Building

Build the TypeScript code to JavaScript:

```bash
pnpm build
```

The compiled output will be in the `dist/` directory.

### Production

Run the compiled JavaScript in production:

```bash
pnpm start
```

## API Endpoints

### HTTP Routes

- `GET /health` - Health check endpoint
  - Returns server status, timestamp, uptime, and environment

- `GET /api/v1` - API version info
  - Returns version and available endpoints

### WebSocket

- `WS /ws` - WebSocket connection for real-time game sessions

#### WebSocket Message Types

**Ping/Pong:**
```json
// Client sends:
{ "type": "ping", "timestamp": 1234567890 }

// Server responds:
{ "type": "pong", "timestamp": 1234567891 }
```

**Game Session:**
```json
// Join game:
{
  "type": "game:join",
  "payload": { "sessionId": "abc123", "userId": "user456" },
  "timestamp": 1234567890
}

// Leave game:
{
  "type": "game:leave",
  "payload": { "sessionId": "abc123" },
  "timestamp": 1234567890
}

// Game action:
{
  "type": "game:action",
  "payload": { "sessionId": "abc123", "data": {...} },
  "timestamp": 1234567890
}
```

## Development Features

- **Hot Reloading**: Automatic server restart on file changes using `tsx watch`
- **Pretty Logging**: Colored console logs in development with `pino-pretty`
- **Type Safety**: Full TypeScript support with strict mode enabled
- **Request Tracking**: Automatic request ID generation and logging

## Testing

Run tests:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

## Linting

Run ESLint:

```bash
pnpm lint
```

## Plugin Architecture

The server uses Fastify's plugin system for modularity:

- **CORS Plugin**: Configurable cross-origin resource sharing
- **WebSocket Plugin**: Real-time bidirectional communication
- **Redis Plugin**: Prepared for future caching/pub-sub (not yet implemented)

## Future Enhancements

- [ ] Redis integration for session management and caching
- [ ] Authentication and authorization middleware
- [ ] Rate limiting
- [ ] API versioning strategy
- [ ] Comprehensive test coverage
- [ ] OpenAPI/Swagger documentation
- [ ] Database connection pooling
- [ ] Monitoring and metrics

## License

Private project - All rights reserved
