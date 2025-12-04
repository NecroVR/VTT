# Virtual Tabletop Platform

## Project Documentation

**Version:** 0.1.0 (Pre-Development)  
**Last Updated:** December 2024  
**Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Vision](#project-vision)
3. [Market Analysis](#market-analysis)
4. [Architecture Overview](#architecture-overview)
5. [Technology Stack](#technology-stack)
6. [Development Phases](#development-phases)
7. [Document Index](#document-index)

---

## Executive Summary

This project aims to build a comprehensive, modern Virtual Tabletop (VTT) platform combining the best features of existing solutions (D&D Beyond, Roll20, FoundryVTT) with innovative additions including an integrated paid GM marketplace and native streaming support.

### Key Differentiators

| Feature | Our Platform | Roll20 | FoundryVTT | D&D Beyond |
|---------|--------------|--------|------------|------------|
| Game System Agnostic | ✓ | ✓ | ✓ | ✗ |
| Integrated GM Marketplace | ✓ | ✗ | ✗ | ✗ |
| Native Streaming Support | ✓ | ✗ | Via Modules | ✗ |
| Proprietary World-Building | ✓ | ✗ | ✗ | ✗ |
| SaaS Model | ✓ | ✓ | ✗ (Self-hosted) | ✓ |
| Paid Modules/Extensions | ✓ | ✓ | ✓ | ✓ |

### Business Model

- **Free Tier:** Basic campaign management, chat, dice rolling
- **Premium Subscription:** Advanced features, storage, module access
- **Marketplace Revenue:** 12% platform fee on paid GM sessions
- **Module Sales:** Revenue share on third-party and first-party modules

---

## Project Vision

### Mission Statement

To create the most accessible, feature-rich virtual tabletop platform that empowers Game Masters to run professional-quality games while building sustainable income through their craft.

### Core Principles

1. **Game System Agnostic** — Support any tabletop RPG system through flexible data models
2. **Creator-First** — Enable GMs to monetize their skills with industry-low fees
3. **Streaming Native** — Built-in tools for content creators at no additional cost
4. **Incrementally Adoptable** — Users can start simple and grow into advanced features
5. **Data Ownership** — Users own their content; export always available

### Target Users

| User Type | Primary Needs | Key Features |
|-----------|---------------|--------------|
| Casual Players | Easy onboarding, join games quickly | Simple UI, invite links, mobile support |
| Hobbyist GMs | Run games for friends, organize campaigns | Campaign management, maps, handouts |
| Professional GMs | Monetize skills, build reputation | Marketplace, reviews, scheduling, payouts |
| Streamers | Broadcast games, grow audience | OBS integration, overlays, discovery |
| Gaming Stores/Clubs | Organize events, manage multiple tables | Organizations, bulk management |

---

## Market Analysis

### Competitive Landscape

#### Roll20
- **Strengths:** Market leader, browser-based, large user base
- **Weaknesses:** Aging technology, no native marketplace, performance issues
- **Opportunity:** Users seeking modern alternative with better performance

#### FoundryVTT
- **Strengths:** Powerful, self-hosted, excellent module ecosystem
- **Weaknesses:** Technical barrier to entry, requires hosting knowledge
- **Opportunity:** Users wanting Foundry features without self-hosting complexity

#### D&D Beyond
- **Strengths:** Official D&D content, polished UX, strong brand
- **Weaknesses:** D&D-only, no VTT features (maps, tokens), expensive content
- **Opportunity:** Users playing non-D&D systems or wanting integrated VTT

#### StartPlaying.games (Marketplace Competitor)
- **Model:** Matchmaking service connecting players with paid GMs
- **Fee Structure:** 15% of GM bookings
- **Weakness:** No integrated VTT — GMs must use Roll20/Foundry separately
- **Opportunity:** Integrated platform with lower fees (12%)

### Market Research: Paid GM Economy

Based on research of StartPlaying.games:

- Platform takes 15% of GM bookings
- No upfront cost for GMs to join
- Average game price: $15-20 per session
- Players pay through the platform; disputes handled by platform
- Tax documents provided (single yearly document for GMs)
- GMs have earned over $3 million since 2020 launch

**Our Competitive Advantage:**
- Lower fees (12% vs 15%)
- Integrated VTT (no need for separate Roll20/Foundry subscription)
- Native streaming tools
- Unified experience for players and GMs

---

## Architecture Overview

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                    │
├──────────────────┬──────────────────┬──────────────────────────────┤
│   Web App        │   Mobile App     │   OBS Browser Sources        │
│   (React/Svelte) │   (React Native) │   (Overlay Endpoints)        │
└────────┬─────────┴────────┬─────────┴──────────────┬───────────────┘
         │                  │                         │
         ▼                  ▼                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                                   │
│                    (Authentication, Rate Limiting)                   │
└────────┬─────────────────────────────────────────────┬──────────────┘
         │                                             │
         ▼                                             ▼
┌─────────────────────────┐               ┌───────────────────────────┐
│      REST API           │               │     WebSocket Server      │
│   (Fastify/Hono)        │               │   (Real-time events)      │
└────────┬────────────────┘               └─────────────┬─────────────┘
         │                                              │
         ▼                                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVICES LAYER                               │
├───────────┬───────────┬───────────┬───────────┬────────────────────┤
│   Auth    │  Campaign │ Marketplace│ Streaming │    Dice Engine     │
│  Service  │  Service  │  Service   │  Service  │                    │
└─────┬─────┴─────┬─────┴─────┬─────┴─────┬─────┴──────────┬─────────┘
      │           │           │           │                │
      ▼           ▼           ▼           ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                   │
├─────────────────────┬─────────────────────┬────────────────────────┤
│    PostgreSQL       │       Redis         │    S3-Compatible       │
│  (Primary Database) │  (Cache, Pub/Sub)   │  (Asset Storage)       │
└─────────────────────┴─────────────────────┴────────────────────────┘
```

### Data Model Philosophy

The platform uses a layered, template-based approach to support any game system:

```
┌─────────────────────────────────────────┐
│  Game System Templates (Modules)        │  ← "D&D 5e", "Pathfinder 2e", etc.
│  - Defines attributes, rules, sheets    │
├─────────────────────────────────────────┤
│  Campaign/World Instance                │  ← User's actual game
│  - Inherits from template               │
│  - Custom modifications                 │
├─────────────────────────────────────────┤
│  Entities (Characters, Items, Scenes)   │  ← Inherit + customize
│  - Template-defined + custom fields     │
└─────────────────────────────────────────┘
```

This enables:
- Selling game system modules
- User-created custom systems
- Mixing elements from multiple systems
- Forward compatibility with new game releases

---

## Technology Stack

### Recommended Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend App** | React or Svelte | Component ecosystem, state management, developer availability |
| **Tabletop Canvas** | PixiJS or Konva | WebGL performance for maps, lighting, token manipulation |
| **Real-time** | WebSockets + Redis Pub/Sub | Low latency, scalable room-based sessions |
| **API Server** | Node.js (Fastify or Hono) | Excellent WebSocket support, async performance, TypeScript |
| **Database** | PostgreSQL with JSONB | Structured core data + flexible schema for game systems |
| **Cache** | Redis | Session storage, real-time pub/sub, rate limiting |
| **Asset Storage** | S3-compatible (R2, MinIO) | Cost-effective, CDN-friendly, standard API |
| **Macro Runtime** | Sandboxed JS (quickjs-emscripten) | Familiar to users, safely contained execution |
| **Payment Processing** | Stripe Connect | Marketplace payouts, 1099 handling, global support |
| **Authentication** | Custom + OAuth providers | Full control, multiple 2FA options |

### Infrastructure Considerations

- **Hosting:** Cloud provider with global edge presence (Cloudflare, AWS, GCP)
- **CDN:** Required for asset delivery (maps can be 10MB+)
- **Database:** Managed PostgreSQL with read replicas for scale
- **WebSocket Scaling:** Horizontal scaling with Redis pub/sub for room coordination

---

## Development Phases

### Phase Overview

| Phase | Focus | Duration | Key Deliverables |
|-------|-------|----------|------------------|
| **Phase 1** | Foundation | 14 weeks | Auth, Groups, Marketplace, Chat, Dice, Streaming |
| **Phase 2** | The Table | 10 weeks | Map canvas, Tokens, Fog of War, Initiative |
| **Phase 3** | Characters & Systems | 8 weeks | Entity schema, Character sheets, Linked rolls |
| **Phase 4** | Modules & Marketplace | 8 weeks | Module format, Installation, First-party content |
| **Phase 5** | Advanced Features | 12 weeks | Dynamic lighting, Macros, Audio, Video chat |

### Phase 1 Breakdown (Current Focus)

| Week | Deliverable |
|------|-------------|
| 1-2 | Auth system with email/password + Google OAuth |
| 3 | 2FA implementation (TOTP + SMS) |
| 4 | User profiles, groups, basic permissions |
| 5-6 | GM onboarding flow with Stripe Connect |
| 7-8 | Game listings, search, booking flow |
| 9 | Payment processing, refunds |
| 10 | Real-time chat infrastructure |
| 11 | Dice parser and roller |
| 12 | Streaming: OAuth connections (Twitch/YouTube) |
| 13 | Streaming: Stream view mode + basic overlays |
| 14 | Integration testing, soft launch |

---

## Document Index

This project documentation is split across multiple focused documents:

| Document | Description |
|----------|-------------|
| [PROJECT.md](./PROJECT.md) | This file — Executive summary and overview |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Detailed system architecture and design decisions |
| [DATABASE.md](./DATABASE.md) | Complete database schema with all tables |
| [API.md](./API.md) | REST and WebSocket API specifications |
| [AUTH.md](./AUTH.md) | Authentication, authorization, and 2FA systems |
| [MARKETPLACE.md](./MARKETPLACE.md) | Paid GM marketplace and payment processing |
| [STREAMING.md](./STREAMING.md) | Streaming integration and overlay system |
| [DICE.md](./DICE.md) | Dice parser specification and examples |
| [CHAT.md](./CHAT.md) | Real-time chat system design |
| [MILESTONES.md](./MILESTONES.md) | Detailed development timeline and deliverables |

---

## Appendix: Key Decisions Log

| Decision | Choice | Rationale | Date |
|----------|--------|-----------|------|
| Hosting Model | SaaS Only | Simplifies operations, consistent UX, enables marketplace | Dec 2024 |
| Data Ownership | User-owned, server-hosted | Users can export; we maintain backups | Dec 2024 |
| Extensibility | Paid modules + user macros | Revenue stream + power user features | Dec 2024 |
| Marketplace Fee | 12% | Competitive vs StartPlaying (15%), sustainable | Dec 2024 |
| Streaming Cost | Free | Marketing value, competitive advantage | Dec 2024 |
| 2FA Options | TOTP, SMS, Email, WebAuthn | Cover all user preferences and security levels | Dec 2024 |

---

*This document is the authoritative source for project scope and vision. For implementation details, see the linked specification documents.*
