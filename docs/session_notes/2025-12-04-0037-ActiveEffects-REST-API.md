# Session Notes: Active Effects REST API Implementation

**Date**: 2025-12-04
**Session ID**: 0037
**Focus**: Active Effects System - REST API Endpoints Implementation

---

## Session Summary

Implemented comprehensive REST API endpoints for the Active Effects system, providing full CRUD operations for managing status effects, buffs, debuffs, and temporary stat modifications on actors and tokens. The API follows established patterns from actors, items, and lights endpoints.

---

## Work Completed

### 1. REST Routes Implementation

**File**: `D:\Projects\VTT\apps\server\src\routes\api\v1\effects.ts`

Implemented all required REST API endpoints for Active Effects:

#### GET Endpoints (Read Operations):
- **GET `/api/v1/actors/:actorId/effects`** - List all effects on a specific actor
  - Validates actor exists
  - Returns array of effects attached to the actor
  - Response format: `{ effects: ActiveEffect[] }`

- **GET `/api/v1/tokens/:tokenId/effects`** - List all effects on a specific token
  - Validates token exists
  - Returns array of effects attached to the token
  - Response format: `{ effects: ActiveEffect[] }`

- **GET `/api/v1/games/:gameId/effects`** - List all effects in a game
  - Validates game exists
  - Returns all effects in the game (across all actors/tokens)
  - Response format: `{ effects: ActiveEffect[] }`

- **GET `/api/v1/effects/:effectId`** - Get a single effect
  - Returns specific effect by ID
  - Response format: `{ effect: ActiveEffect }`

#### POST Endpoints (Create Operations):
- **POST `/api/v1/actors/:actorId/effects`** - Create effect on an actor
  - Validates actor exists
  - Validates game exists
  - Requires `name` and `gameId` in request body
  - Sets default values for optional fields
  - Returns created effect
  - Response format: `{ effect: ActiveEffect }`
  - Status code: 201 (Created)

- **POST `/api/v1/tokens/:tokenId/effects`** - Create effect on a token
  - Validates token exists
  - Validates game exists
  - Requires `name` and `gameId` in request body
  - Sets default values for optional fields
  - Returns created effect
  - Response format: `{ effect: ActiveEffect }`
  - Status code: 201 (Created)

#### PATCH Endpoints (Update Operations):
- **PATCH `/api/v1/effects/:effectId`** - Update an effect
  - Validates effect exists
  - Supports partial updates (only provided fields are updated)
  - Validates name is not empty if provided
  - Updates `updatedAt` timestamp automatically
  - Returns updated effect
  - Response format: `{ effect: ActiveEffect }`

- **PATCH `/api/v1/effects/:effectId/toggle`** - Toggle effect enabled state
  - Validates effect exists
  - Toggles the `enabled` boolean field
  - Useful for quickly enabling/disabling effects without full update
  - Returns updated effect with new enabled state
  - Response format: `{ effect: ActiveEffect }`

#### DELETE Endpoints (Delete Operations):
- **DELETE `/api/v1/effects/:effectId`** - Delete an effect
  - Validates effect exists
  - Permanently removes effect from database
  - Status code: 204 (No Content)

### 2. Route Registration

**File**: `D:\Projects\VTT\apps\server\src\routes\api\v1\index.ts`

Updated the API v1 router to include effects routes:
- Imported `effectsRoute` from `./effects.js`
- Registered route with `await fastify.register(effectsRoute)`
- Added effects endpoint to API index response: `effects: '/api/v1/effects'`

---

## Files Created/Modified

### Created:
1. `D:\Projects\VTT\apps\server\src\routes\api\v1\effects.ts` (730 lines)
   - Complete REST API implementation for Active Effects
   - 9 endpoint handlers with authentication
   - Follows established patterns from actors, items, and lights

### Modified:
1. `D:\Projects\VTT\apps\server\src\routes\api\v1\index.ts`
   - Added import for effectsRoute
   - Registered effects router
   - Updated API index documentation

---

## Build Verification

Successfully ran `pnpm build` from project root:
- All packages compiled without TypeScript errors
- Server package rebuilt successfully (cache miss due to new file)
- Database, shared, and web packages used cached builds
- No compilation errors or warnings

**Build Output Summary**:
```
• Packages in scope: @vtt/database, @vtt/server, @vtt/shared, @vtt/web
• Running build in 4 packages
@vtt/database:build: cache hit
@vtt/shared:build: cache hit
@vtt/server:build: cache miss, executing (new files added)
@vtt/web:build: cache hit
```

---

## Implementation Details

### Authentication
All endpoints use the `authenticate` middleware from `apps/server/src/middleware/auth.ts`:
- Validates Bearer token in Authorization header
- Loads user session and attaches to request
- Returns 401 if not authenticated
- Pattern: `{ preHandler: authenticate }`

### Database Operations
Uses Drizzle ORM for type-safe database queries:
- Import schemas: `activeEffects`, `actors`, `tokens`, `games`
- Import operators: `eq` for equality comparisons
- Select operations: `.select().from(table).where(condition)`
- Insert operations: `.insert(table).values(data).returning()`
- Update operations: `.update(table).set(data).where(condition).returning()`
- Delete operations: `.delete(table).where(condition)`

### Validation
Implemented validation for:
- **Required Fields**:
  - `name` cannot be empty
  - `gameId` must be provided for creation
- **Entity Existence**:
  - Actor must exist before creating effect on actor
  - Token must exist before creating effect on token
  - Game must exist for the gameId
  - Effect must exist for update/delete operations
- **Field Updates**:
  - Name cannot be updated to empty string

### Default Values
When creating effects, defaults are applied for optional fields:
- `effectType`: 'buff'
- `durationType`: 'permanent'
- `enabled`: true
- `hidden`: false
- `changes`: []
- `priority`: 0
- `transfer`: false
- `data`: {}
- `sort`: 0

### Type Conversions
Database results are converted to TypeScript interfaces:
- JSONB fields cast to appropriate types (`EffectChange[]`, `Record<string, unknown>`)
- Text enum fields cast to union types (`EffectType`, `DurationType`)
- Nullable fields properly typed

### Error Handling
Comprehensive error handling with appropriate HTTP status codes:
- **400 Bad Request**: Validation failures (missing/invalid fields)
- **401 Unauthorized**: Missing or invalid authentication
- **404 Not Found**: Entity not found (effect, actor, token, game)
- **500 Internal Server Error**: Database or unexpected errors

All errors logged via Fastify logger for debugging.

---

## Design Decisions

### 1. Dual Creation Endpoints
Created separate POST endpoints for actors and tokens:
- `/actors/:actorId/effects` - Effect attached to actor
- `/tokens/:tokenId/effects` - Effect attached to token
- Mirrors established pattern from items API
- Makes the attachment point explicit in the URL

### 2. Toggle Endpoint
Added dedicated `/effects/:effectId/toggle` endpoint:
- Simpler than requiring full PATCH request
- Common operation for enabling/disabling effects
- Reduces payload size for frequent operations
- Similar pattern used in other VTT systems

### 3. Game-Wide Effect Listing
Included `/games/:gameId/effects` endpoint:
- Useful for GM dashboard views
- Allows filtering effects across all entities in game
- Supports bulk operations in future
- Consistent with other game-scoped list endpoints

### 4. Minimal Authorization
Placeholder TODO comments for authorization checks:
- Currently any authenticated user can access any effect
- Future enhancement: Check user is game participant
- Future enhancement: Check user has permission for specific operations
- Follows pattern from other endpoints in codebase

### 5. Consistent Response Format
All responses follow established patterns:
- Single entity: `{ effect: ActiveEffect }`
- Multiple entities: `{ effects: ActiveEffect[] }`
- Matches pattern from actors, items, tokens, etc.

---

## API Endpoint Summary

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/api/v1/actors/:actorId/effects` | List effects on actor | 200 |
| GET | `/api/v1/tokens/:tokenId/effects` | List effects on token | 200 |
| GET | `/api/v1/games/:gameId/effects` | List all effects in game | 200 |
| GET | `/api/v1/effects/:effectId` | Get single effect | 200 |
| POST | `/api/v1/actors/:actorId/effects` | Create effect on actor | 201 |
| POST | `/api/v1/tokens/:tokenId/effects` | Create effect on token | 201 |
| PATCH | `/api/v1/effects/:effectId` | Update effect | 200 |
| PATCH | `/api/v1/effects/:effectId/toggle` | Toggle enabled state | 200 |
| DELETE | `/api/v1/effects/:effectId` | Delete effect | 204 |

---

## Database Migration (Added 2025-12-04)

### Migration Execution
Successfully created and ran the database migration for the `active_effects` table.

**File**: `D:\Projects\VTT\packages\database\migration.sql`

### Table Structure Created
The migration created the `active_effects` table with the following structure:

#### Columns (24 total):
- **id**: UUID primary key (auto-generated)
- **game_id**: UUID NOT NULL (FK to games)
- **actor_id**: UUID nullable (FK to actors)
- **token_id**: UUID nullable (FK to tokens)
- **name**: text NOT NULL
- **icon**: text nullable
- **description**: text nullable
- **effect_type**: text NOT NULL (default: 'buff')
- **duration_type**: text NOT NULL (default: 'permanent')
- **duration**: integer nullable
- **start_round**: integer nullable
- **start_turn**: integer nullable
- **remaining**: integer nullable
- **source_actor_id**: UUID nullable (FK to actors)
- **source_item_id**: UUID nullable (FK to items)
- **enabled**: boolean NOT NULL (default: true)
- **hidden**: boolean NOT NULL (default: false)
- **changes**: jsonb NOT NULL (default: '[]')
- **priority**: integer NOT NULL (default: 0)
- **transfer**: boolean NOT NULL (default: false)
- **data**: jsonb NOT NULL (default: '{}')
- **sort**: integer NOT NULL (default: 0)
- **created_at**: timestamp NOT NULL (default: now())
- **updated_at**: timestamp NOT NULL (default: now())

#### Foreign Key Constraints (5 total):
1. `active_effects_game_id_games_id_fk` → games(id) ON DELETE CASCADE
2. `active_effects_actor_id_actors_id_fk` → actors(id) ON DELETE CASCADE
3. `active_effects_token_id_tokens_id_fk` → tokens(id) ON DELETE CASCADE
4. `active_effects_source_actor_id_actors_id_fk` → actors(id)
5. `active_effects_source_item_id_items_id_fk` → items(id)

#### Indexes (5 total):
1. `active_effects_pkey` - PRIMARY KEY on id
2. `active_effects_game_id_idx` - btree on game_id
3. `active_effects_actor_id_idx` - btree on actor_id
4. `active_effects_token_id_idx` - btree on token_id
5. `active_effects_enabled_idx` - btree on enabled

### Migration Results
```
✅ Table created successfully
✅ All 5 foreign key constraints applied
✅ All 5 indexes created
✅ All default values configured
✅ Cascade delete rules configured correctly
```

### Verification Queries
Verified table creation with PostgreSQL commands:
```sql
\d active_effects                                    -- Table structure
SELECT tablename, indexname FROM pg_indexes...       -- Index verification
SELECT conname, confdeltype FROM pg_constraint...   -- FK constraint verification
```

### Connection Details
- Database: `vtt`
- Host: `localhost:5432`
- User: `claude`
- Schema: `public`

---

## Next Steps

### Immediate (Phase 3 - Active Effects):
1. ~~**Database Migration**~~ - ✅ **COMPLETED** - Created and ran migration for active_effects table
2. **WebSocket Handlers** - Implement real-time effect synchronization handlers:
   - `effect:add` - Create effect via WebSocket
   - `effect:update` - Update effect via WebSocket
   - `effect:remove` - Delete effect via WebSocket
   - `effect:toggle` - Toggle effect via WebSocket
   - `effects:expired` - Notify clients of expired effects
3. **Unit Tests** - Write tests for REST endpoints:
   - Test all CRUD operations
   - Test validation logic
   - Test error cases
   - Test authentication requirements
4. **Integration Tests** - Test end-to-end flows:
   - Create effect on actor
   - Create effect on token
   - Update and toggle effects
   - List effects by various filters

### Future Enhancements:
1. **Authorization Layer** - Implement permission checks:
   - Verify user is game participant
   - Check user role (GM vs player)
   - Restrict operations based on permissions
2. **Pagination** - Add pagination for list endpoints
3. **Filtering** - Add query parameters for filtering:
   - By effect type
   - By enabled/disabled status
   - By duration type
4. **Batch Operations** - Support bulk create/update/delete
5. **Effect Application** - Implement logic to apply changes to stats

---

## Technical Notes

### Import Paths
All imports use `.js` extension for ESM compatibility:
```typescript
import { authenticate } from '../../../middleware/auth.js';
```

### Type Safety
Full TypeScript type safety maintained throughout:
- Request params typed: `Params: { actorId: string }`
- Request body typed: `Body: CreateActiveEffectRequest`
- Response data typed: `ActiveEffect`, `ActiveEffect[]`
- Database results typed via Drizzle schema

### Fastify Integration
Uses Fastify route registration patterns:
- Plugin-based architecture: `FastifyPluginAsync`
- Typed route handlers with generics
- Pre-handler hooks for middleware
- Automatic JSON serialization

### Code Organization
Follows established patterns from existing routes:
- One file per resource type
- Clear route comments with HTTP method and path
- Consistent error handling
- Similar code structure across all endpoints

---

## Testing Strategy

### Manual Testing Checklist:
- [ ] POST create effect on actor
- [ ] POST create effect on token
- [ ] GET effect by ID
- [ ] GET effects by actor ID
- [ ] GET effects by token ID
- [ ] GET effects by game ID
- [ ] PATCH update effect
- [ ] PATCH toggle effect enabled
- [ ] DELETE effect
- [ ] Verify authentication required
- [ ] Verify validation errors

### Automated Testing (Future):
- Unit tests for route handlers
- Integration tests with test database
- E2E tests with Playwright
- Load testing for performance

---

## Status

**Implementation**: ✅ Complete
**Build Verification**: ✅ Passed
**Testing**: ⏳ Pending (manual/automated tests needed)
**Documentation**: ✅ Complete
**Database Migration**: ✅ Complete
**Deployment**: ⏳ Pending (Docker rebuild required)

---

## References

- Previous Session: `docs/session_notes/2025-12-04-0036-ActiveEffects-Schema-Implementation.md`
- Database Schema: `packages/database/src/schema/activeEffects.ts`
- Shared Types: `packages/shared/src/types/activeEffect.ts`
- Reference Implementation: `apps/server/src/routes/api/v1/items.ts`
- Authentication: `apps/server/src/middleware/auth.ts`
- Project Roadmap: `docs/ROADMAP.md`
