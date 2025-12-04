# API Specification

## Overview

The platform exposes a RESTful API for client applications and a WebSocket API for real-time features. All endpoints use JSON for request and response bodies.

---

## Table of Contents

1. [General Information](#general-information)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [REST API Endpoints](#rest-api-endpoints)
6. [WebSocket API](#websocket-api)
7. [Webhooks](#webhooks)

---

## General Information

### Base URL

```
Production: https://api.yourvtt.com/v1
Staging:    https://api.staging.yourvtt.com/v1
```

### Request Format

- Content-Type: `application/json`
- Accept: `application/json`
- Character encoding: UTF-8

### Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2024-12-15T10:30:00Z"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2024-12-15T10:30:00Z"
  }
}
```

### Pagination

List endpoints support cursor-based pagination:

```
GET /api/v1/campaigns?limit=20&cursor=eyJpZCI6IjEyMyJ9
```

Response includes:

```json
{
  "data": [...],
  "pagination": {
    "hasMore": true,
    "nextCursor": "eyJpZCI6IjE0MyJ9",
    "total": 156
  }
}
```

---

## Authentication

### Session Token

Most endpoints require authentication via Bearer token:

```
Authorization: Bearer <session_token>
```

### Token Lifecycle

1. Obtain token via `/auth/login` or `/auth/oauth/:provider/callback`
2. Include in all authenticated requests
3. Token expires after 30 days of inactivity
4. Refresh via `/auth/refresh` before expiration

### MFA-Required Endpoints

Some endpoints require MFA verification:
- Payment operations
- Account deletion
- Password changes

If MFA is enabled but session not MFA-verified, returns:

```json
{
  "success": false,
  "error": {
    "code": "MFA_REQUIRED",
    "message": "MFA verification required",
    "mfaMethods": ["totp", "sms"]
  }
}
```

---

## Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `MFA_REQUIRED` | 403 | MFA verification needed |
| `PAYMENT_REQUIRED` | 402 | Payment issue |
| `SERVER_ERROR` | 500 | Internal error |

### Validation Errors

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Required field" },
      { "field": "password", "message": "Minimum 12 characters" }
    ]
  }
}
```

---

## Rate Limiting

### Limits

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Authentication | 10 requests | 1 minute |
| General API | 100 requests | 1 minute |
| Search | 30 requests | 1 minute |
| File uploads | 10 requests | 1 minute |

### Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702636800
```

### Rate Limited Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "retryAfter": 45
  }
}
```

---

## REST API Endpoints

### Authentication

#### Register

```
POST /auth/register

Request:
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "displayName": "Player One"
}

Response:
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "displayName": "..." },
    "message": "Verification email sent"
  }
}
```

#### Login

```
POST /auth/login

Request:
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response (no MFA):
{
  "success": true,
  "data": {
    "user": { ... },
    "session": {
      "token": "sess_...",
      "expiresAt": "2025-01-14T10:30:00Z"
    }
  }
}

Response (MFA required):
{
  "success": true,
  "data": {
    "mfaRequired": true,
    "mfaMethods": ["totp", "sms"],
    "mfaToken": "mfa_temp_..."
  }
}
```

#### MFA Verify

```
POST /auth/mfa/verify

Request:
{
  "mfaToken": "mfa_temp_...",
  "method": "totp",
  "code": "123456"
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "session": { ... }
  }
}
```

#### Logout

```
POST /auth/logout
Authorization: Bearer <token>

Response:
{
  "success": true
}
```

#### OAuth Initiate

```
GET /auth/oauth/:provider
(provider: google, discord, apple)

Redirects to provider's OAuth page
```

#### OAuth Callback

```
GET /auth/oauth/:provider/callback?code=...&state=...

Redirects to app with session cookie set
```

---

### Users

#### Get Current User

```
GET /users/me
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "Player One",
      "avatarUrl": "https://...",
      "emailVerified": true,
      "mfaEnabled": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### Update Profile

```
PATCH /users/me
Authorization: Bearer <token>

Request:
{
  "displayName": "New Name",
  "bio": "About me...",
  "timezone": "America/New_York"
}

Response:
{
  "success": true,
  "data": { "user": { ... } }
}
```

---

### Groups

#### Create Group

```
POST /groups
Authorization: Bearer <token>

Request:
{
  "name": "Friday Night D&D",
  "description": "Weekly D&D game",
  "isPublic": false
}

Response:
{
  "success": true,
  "data": {
    "group": {
      "id": "uuid",
      "name": "Friday Night D&D",
      "slug": "friday-night-dd",
      "inviteCode": "ABC123XY",
      ...
    }
  }
}
```

#### List User's Groups

```
GET /groups
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "groups": [
      { "id": "...", "name": "...", "role": "gm", ... }
    ]
  }
}
```

#### Get Group

```
GET /groups/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "group": { ... },
    "members": [ ... ],
    "campaigns": [ ... ]
  }
}
```

#### Join via Invite Code

```
POST /groups/join

Request:
{
  "inviteCode": "ABC123XY"
}

Response:
{
  "success": true,
  "data": {
    "group": { ... },
    "membership": { "role": "player", ... }
  }
}
```

#### Invite Member

```
POST /groups/:id/invite
Authorization: Bearer <token>

Request:
{
  "email": "newplayer@example.com",
  "role": "player"
}

Response:
{
  "success": true,
  "data": {
    "invitation": { ... }
  }
}
```

---

### Campaigns

#### Create Campaign

```
POST /campaigns
Authorization: Bearer <token>

Request:
{
  "groupId": "uuid",
  "name": "Curse of Strahd",
  "gameSystem": "D&D 5e",
  "description": "A gothic horror adventure..."
}

Response:
{
  "success": true,
  "data": {
    "campaign": { ... }
  }
}
```

#### Get Campaign

```
GET /campaigns/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "campaign": { ... },
    "journals": [ ... ],
    "recentActivity": [ ... ]
  }
}
```

---

### Marketplace

#### List GMs

```
GET /marketplace/gms?system=D%26D+5e&rating=4&page=1

Response:
{
  "success": true,
  "data": {
    "gms": [
      {
        "id": "uuid",
        "displayName": "DragonMaster",
        "headline": "Immersive storytelling for 10+ years",
        "averageRating": 4.8,
        "totalSessions": 156,
        "systemsPlayed": ["D&D 5e", "Pathfinder 2e"],
        ...
      }
    ]
  },
  "pagination": { ... }
}
```

#### Get GM Profile

```
GET /marketplace/gms/:id

Response:
{
  "success": true,
  "data": {
    "gm": { ... },
    "listings": [ ... ],
    "reviews": [ ... ]
  }
}
```

#### Create Listing (GM)

```
POST /marketplace/listings
Authorization: Bearer <token>

Request:
{
  "title": "Curse of Strahd - Full Campaign",
  "description": "Experience the classic...",
  "gameSystem": "D&D 5e",
  "listingType": "campaign",
  "pricePerSeatCents": 2000,
  "sessionLengthMinutes": 180,
  "minPlayers": 3,
  "maxPlayers": 5,
  "scheduledStart": "2024-12-20T19:00:00Z",
  "recurringSchedule": {
    "frequency": "weekly",
    "dayOfWeek": "friday"
  }
}

Response:
{
  "success": true,
  "data": {
    "listing": { ... }
  }
}
```

#### Book Seat

```
POST /marketplace/bookings
Authorization: Bearer <token>

Request:
{
  "listingId": "uuid",
  "sessionDate": "2024-12-20T19:00:00Z"
}

Response:
{
  "success": true,
  "data": {
    "booking": { ... },
    "checkoutUrl": "https://checkout.stripe.com/..."
  }
}
```

---

### Chat

#### Get Campaign Channels

```
GET /campaigns/:id/channels
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "channels": [
      { "id": "...", "name": "In-Character", "type": "ic" },
      { "id": "...", "name": "Out of Character", "type": "ooc" },
      { "id": "...", "name": "GM Notes", "type": "gm_only" }
    ]
  }
}
```

#### Get Channel Messages

```
GET /channels/:id/messages?limit=50&before=<cursor>
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "messages": [ ... ]
  },
  "pagination": { ... }
}
```

---

### Dice

#### Roll Dice

```
POST /dice/roll
Authorization: Bearer <token>

Request:
{
  "formula": "2d20kh1+5",
  "label": "Attack Roll",
  "channelId": "uuid"  // Optional: broadcast to channel
}

Response:
{
  "success": true,
  "data": {
    "roll": {
      "formula": "2d20kh1+5",
      "label": "Attack Roll",
      "dice": [
        { "sides": 20, "result": 17, "kept": true },
        { "sides": 20, "result": 8, "kept": false }
      ],
      "modifier": 5,
      "total": 22,
      "formatted": "2d20kh1+5 → [**17**, ~~8~~] + 5 = **22**"
    }
  }
}
```

---

### Streaming

#### Connect Platform

```
GET /streaming/connect/:platform
Authorization: Bearer <token>

Redirects to platform OAuth
```

#### Get Connections

```
GET /streaming/connections
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "connections": [
      {
        "platform": "twitch",
        "username": "streamername",
        "channelUrl": "https://twitch.tv/streamername",
        "connected": true
      }
    ]
  }
}
```

#### Create Overlay

```
POST /streaming/overlays
Authorization: Bearer <token>

Request:
{
  "campaignId": "uuid",
  "overlayType": "dice",
  "name": "Dice Rolls Overlay",
  "config": {
    "maxRolls": 5,
    "displayDuration": 10,
    "theme": "dark"
  }
}

Response:
{
  "success": true,
  "data": {
    "overlay": { ... },
    "url": "https://app.yourvtt.com/stream/overlay/dice/abc123token"
  }
}
```

---

## WebSocket API

### Connection

```
wss://api.yourvtt.com/ws
```

### Authentication

Send auth message after connecting:

```json
{
  "type": "auth",
  "token": "sess_..."
}
```

Response:

```json
{
  "type": "auth_success",
  "userId": "uuid"
}
```

### Subscribing to Channels

```json
{
  "type": "subscribe",
  "channel": "campaign:uuid"
}
```

### Message Types

#### Chat Message

```json
{
  "type": "chat_message",
  "channel": "campaign:uuid",
  "payload": {
    "id": "uuid",
    "authorId": "uuid",
    "authorName": "Player One",
    "content": "I attack the goblin!",
    "contentType": "text",
    "timestamp": "2024-12-15T10:30:00Z"
  }
}
```

#### Dice Roll

```json
{
  "type": "dice_roll",
  "channel": "campaign:uuid",
  "payload": {
    "id": "uuid",
    "playerId": "uuid",
    "playerName": "Player One",
    "characterName": "Grimjaw",
    "formula": "1d20+5",
    "result": {
      "dice": [{ "sides": 20, "value": 18 }],
      "modifier": 5,
      "total": 23
    },
    "label": "Attack Roll",
    "isCritical": false,
    "timestamp": "2024-12-15T10:30:05Z"
  }
}
```

#### Presence Updates

```json
{
  "type": "presence",
  "channel": "campaign:uuid",
  "payload": {
    "online": ["user1", "user2", "user3"],
    "typing": ["user2"]
  }
}
```

#### Typing Indicator

Send:
```json
{
  "type": "typing_start",
  "channel": "campaign:uuid"
}
```

#### Campaign State Updates

```json
{
  "type": "state_update",
  "channel": "campaign:uuid",
  "payload": {
    "updateType": "initiative_change",
    "data": {
      "round": 3,
      "currentTurn": "character_uuid"
    }
  }
}
```

### Overlay WebSocket

For OBS overlays (no auth required, uses overlay token):

```
wss://api.yourvtt.com/ws/overlay/:token
```

Only receives relevant events (dice rolls, HP changes, etc.)

---

## Webhooks

### Stripe Webhooks

Endpoint: `POST /webhooks/stripe`

Handled events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `transfer.created`
- `transfer.failed`
- `account.updated` (Connect)

### Platform Webhooks (Future)

For third-party integrations:

```
POST /webhooks/custom/:webhookId

Headers:
X-Webhook-Signature: sha256=...

Body:
{
  "event": "booking.completed",
  "data": { ... },
  "timestamp": "2024-12-15T10:30:00Z"
}
```

---

*For SDK documentation and code examples, see the /sdk directory.*
