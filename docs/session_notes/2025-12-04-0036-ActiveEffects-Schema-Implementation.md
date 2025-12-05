# Session Notes: Active Effects Database Schema and Types

**Date**: 2025-12-04
**Session ID**: 0036
**Focus**: Active Effects System - Database Schema and Shared Types Implementation

---

## Session Summary

Implemented the database schema and shared TypeScript types for the Active Effects system. Active Effects represent status effects, buffs, debuffs, and temporary stat modifications that can be applied to actors and tokens in the VTT.

---

## Work Completed

### 1. Database Schema Implementation

**File**: `D:\Projects\VTT\packages\database\src\schema\activeEffects.ts`

Created the `active_effects` table with the following structure:
- **Identity & Relationships**:
  - `id` - UUID primary key
  - `gameId` - Foreign key to games (cascade delete)
  - `actorId` - Optional foreign key to actors (cascade delete)
  - `tokenId` - Optional foreign key to tokens (cascade delete)

- **Basic Properties**:
  - `name` - Effect name (required)
  - `icon` - Optional icon URL
  - `description` - Optional text description

- **Effect Configuration**:
  - `effectType` - Type of effect ('buff', 'debuff', 'condition', 'aura', 'custom'), default 'buff'
  - `durationType` - Duration type ('rounds', 'turns', 'seconds', 'permanent', 'special'), default 'permanent'
  - `duration` - Optional number of rounds/turns
  - `startRound` - Round when effect was applied
  - `startTurn` - Turn when effect was applied
  - `remaining` - Remaining duration (decrements during combat)

- **Source Tracking**:
  - `sourceActorId` - Optional reference to actor that created the effect
  - `sourceItemId` - Optional reference to item that created the effect

- **Status & Visibility**:
  - `enabled` - Whether effect is active (default true)
  - `hidden` - Whether hidden from players (default false)

- **Effect Data**:
  - `changes` - JSONB array of stat modifications (default [])
  - `priority` - Application priority (default 0)
  - `transfer` - Whether to transfer to linked token (default false)

- **Metadata**:
  - `data` - JSONB for additional custom data (default {})
  - `sort` - Sorting order (default 0)
  - `createdAt`, `updatedAt` - Timestamps

### 2. Shared TypeScript Types

**File**: `D:\Projects\VTT\packages\shared\src\types\activeEffect.ts`

Created comprehensive type definitions:
- **Type Aliases**:
  - `EffectType` - Union type for effect categories
  - `DurationType` - Union type for duration modes
  - `ChangeMode` - Union type for stat modification modes ('add', 'multiply', 'override', 'upgrade', 'downgrade')

- **Interfaces**:
  - `EffectChange` - Individual stat modification with key, mode, value, and priority
  - `ActiveEffect` - Complete effect object matching database schema
  - `CreateActiveEffectRequest` - Request payload for creating effects
  - `UpdateActiveEffectRequest` - Request payload for updating effects
  - `ActiveEffectResponse` - API response for single effect
  - `ActiveEffectsListResponse` - API response for effect list

### 3. WebSocket Types

**File**: `D:\Projects\VTT\packages\shared\src\types\websocket.ts`

Added WebSocket message types for real-time effect synchronization:
- **Message Types Added**:
  - `effect:add`, `effect:added` - Add new effect
  - `effect:update`, `effect:updated` - Modify existing effect
  - `effect:remove`, `effect:removed` - Delete effect
  - `effect:toggle`, `effect:toggled` - Enable/disable effect
  - `effects:expired` - Notify when effects expire

- **Payload Interfaces**:
  - `EffectAddPayload` - Data for creating effect
  - `EffectAddedPayload` - Confirmation with created effect
  - `EffectUpdatePayload` - Effect ID and partial updates
  - `EffectUpdatedPayload` - Confirmation with updated effect
  - `EffectRemovePayload` - Effect ID to remove
  - `EffectRemovedPayload` - Confirmation of removal
  - `EffectTogglePayload` - Effect ID and enabled state
  - `EffectToggledPayload` - Confirmation with toggled effect
  - `EffectsExpiredPayload` - List of expired effect IDs

### 4. Schema and Type Exports

Updated index files to export new modules:
- `packages/database/src/schema/index.ts` - Added export for activeEffects schema
- `packages/shared/src/types/index.ts` - Added export for activeEffect types

---

## Files Created/Modified

### Created:
1. `D:\Projects\VTT\packages\database\src\schema\activeEffects.ts` - Database schema
2. `D:\Projects\VTT\packages\shared\src\types\activeEffect.ts` - TypeScript types

### Modified:
1. `D:\Projects\VTT\packages\database\src\schema\index.ts` - Added activeEffects export
2. `D:\Projects\VTT\packages\shared\src\types\websocket.ts` - Added effect message types and payloads
3. `D:\Projects\VTT\packages\shared\src\types\index.ts` - Added activeEffect export

---

## Build Verification

Successfully ran `pnpm build` from project root:
- All packages compiled without TypeScript errors
- Database package built successfully
- Shared package built successfully
- Server package built successfully
- Web package built successfully (with expected Svelte warnings only)

---

## Design Decisions

### 1. Flexible Effect Attachment
Effects can be attached to either actors or tokens (or both nullable), allowing:
- Persistent effects on actors that transfer to tokens
- Temporary effects on specific token instances
- Maximum flexibility for different effect types

### 2. Duration Management
Multiple duration-related fields support various timing scenarios:
- `durationType` - Defines how duration is measured
- `duration` - Initial duration value
- `remaining` - Current remaining duration (for decrementation)
- `startRound`/`startTurn` - Track when effect was applied

### 3. Source Tracking
References to `sourceActorId` and `sourceItemId` enable:
- Identifying what created an effect
- Potential effect removal when source is removed
- Effect interaction logic based on source

### 4. Change System
The `changes` JSONB field stores an array of modifications:
- Flexible structure for different game systems
- Priority-based application ordering
- Multiple change modes (add, multiply, override, etc.)

### 5. WebSocket Event Model
Follows established patterns from tokens, walls, and lights:
- Request/response pairs (add/added, update/updated, etc.)
- Separate toggle operation for enable/disable
- Batch expiration notification for efficiency

---

## Next Steps

### Immediate (Phase 3 - Active Effects):
1. **Database Migration** - Create Drizzle migration for active_effects table
2. **Repository Layer** - Implement ActiveEffectsRepository with CRUD operations
3. **Service Layer** - Create ActiveEffectsService with business logic
4. **REST API Endpoints** - Implement HTTP endpoints for effect management
5. **WebSocket Handlers** - Implement real-time effect synchronization
6. **Effect Application Logic** - System to apply changes to actor/token stats
7. **Duration Management** - Combat system integration for effect expiration

### Future Enhancements:
1. **Effect Templates** - Common effect presets (poisoned, blessed, etc.)
2. **Effect Stacking Rules** - Define how duplicate effects interact
3. **Conditional Effects** - Effects that apply based on conditions
4. **Effect Animations** - Visual feedback for active effects
5. **Effect History** - Track effect application/removal over time

---

## Technical Notes

### Database Considerations:
- All foreign keys use cascade delete to prevent orphaned effects
- JSONB fields allow flexibility without schema changes
- Indexes may be needed on `actorId`, `tokenId`, and `gameId` for performance

### Type Safety:
- Strong typing ensures consistent effect data structure
- Union types constrain valid values for effectType and durationType
- Request/Response interfaces separate API contract from internal representation

### Real-time Synchronization:
- WebSocket events ensure all players see effect changes immediately
- Effect expiration events can batch multiple effects for efficiency
- Toggle events enable quick enable/disable without full update

---

## Status

**Implementation**: ✅ Complete
**Testing**: ⏳ Pending (awaiting REST/WS implementation)
**Documentation**: ✅ Complete
**Deployment**: ⏳ Pending (awaiting migration)

---

## References

- Database Schema Pattern: `packages/database/src/schema/items.ts`
- Type Pattern: `packages/shared/src/types/actor.ts`
- WebSocket Pattern: `packages/shared/src/types/websocket.ts` (combat, actors)
- Project Roadmap: `docs/ROADMAP.md`
