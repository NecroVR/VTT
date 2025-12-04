# Virtual Table Top (VTT)

A modern, web-based Virtual Table Top system for playing tabletop role-playing games online.

## Overview

Virtual Table Top (VTT) is an online platform designed to facilitate remote tabletop RPG sessions. It provides digital tools for game masters and players to collaborate in real-time, replacing physical components like maps, miniatures, and dice with intuitive digital equivalents.

## Features

- **Interactive Maps & Grids**: Upload custom maps with configurable grid overlays for tactical gameplay
- **Token Management**: Place, move, and customize character and NPC tokens on maps
- **Dice Rolling System**: Built-in dice roller with support for common RPG dice notation (d20, 3d6+2, etc.)
- **Character Sheets**: Digital character sheet support for tracking stats, inventory, and abilities
- **Real-Time Collaboration**: Synchronize game state across all connected players instantly
- **Chat & Messaging**: In-game chat with dice roll integration and private messaging
- **Campaign Management**: Organize multiple campaigns with persistent game state
- **Asset Library**: Upload and manage custom images, maps, and tokens
- **User Authentication**: Secure user accounts and session management
- **Fog of War**: Dynamic vision and lighting system for enhanced immersion

## Tech Stack

### Core Technologies
- **Turborepo** - High-performance build system for monorepos
- **pnpm** - Fast, disk space efficient package manager
- **SvelteKit** - Frontend framework
- **Fastify** - Fast and low overhead web framework
- **Drizzle ORM** - TypeScript ORM for SQL databases
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **TypeScript** - Type-safe development
- **Vitest** - Unit testing framework

### Monorepo Structure

```
D:\Projects\VTT\
├── apps/
│   ├── web/          # SvelteKit frontend
│   └── server/       # Fastify backend
├── packages/
│   ├── shared/       # Shared types and utilities
│   └── database/     # Drizzle schema and migrations
├── package.json      # Root package.json
├── pnpm-workspace.yaml
├── turbo.json
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- PostgreSQL
- Redis

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your actual database and Redis credentials

### Running the Application

```bash
# Start all workspaces in development mode
pnpm dev

# Build all workspaces
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

### Available Workspaces

- **@vtt/web** - SvelteKit frontend application
- **@vtt/server** - Fastify backend server
- **@vtt/shared** - Shared types, utilities, and constants
- **@vtt/database** - Drizzle ORM schema and database migrations

## Documentation

Detailed documentation can be found in the `docs/` directory:

- [Project Outline](PROJECT_OUTLINE.md) - Project vision, features, and development roadmap
- [Architecture Documentation](docs/architecture/) - System design and technical architecture
- [Session Notes](docs/session_notes/) - Development progress and decision logs

## Development

### Project Structure

```
D:\Projects\VTT\
├── apps/
│   ├── web/              # SvelteKit frontend application
│   └── server/           # Fastify backend server
├── packages/
│   ├── shared/           # Shared types and utilities
│   └── database/         # Drizzle ORM schema and migrations
├── docs/                 # Project documentation
├── scripts/              # Utility scripts
├── config/               # Configuration files
├── logs/                 # Application logs
├── package.json          # Root package.json with Turborepo scripts
├── pnpm-workspace.yaml   # pnpm workspace configuration
├── turbo.json            # Turborepo pipeline configuration
└── .env.example          # Environment variables template
```

### Contributing

> Guidelines to be established

## License

> License to be determined

---

**Status**: Project in initial planning phase

**Last Updated**: 2025-12-04
