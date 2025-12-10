# Session Notes: Path System Entity Redesign

**Date**: 2025-12-10
**Session ID**: 0038
**Focus**: Redesign path system to use individual PathPoint entities

---

## Session Summary

Redesigned the path system from a monolithic approach (paths with embedded node arrays) to an entity-based approach where each path point is an individual database entity. This provides better flexibility for path manipulation, editing, and real-time synchronization.

---

## Problems Addressed

### Previous Design Limitations

The original path system stored all path points as a JSONB array within a single `paths` table row:
- Difficult to update individual points without rewriting entire path
- No direct relationships between points and other entities
- Harder to query and manipulate individual points
- Less efficient for WebSocket synchronization

### New Design Goals

- Each path point is a separate entity with its own ID
- Points are grouped by `pathName` (case-sensitive string)
- Points are ordered by `pathIndex` (positive integer)
- Path-level settings (speed, loop, visibility, etc.) stored separately
- Runtime assembly of paths from individual points

---

## Solutions Implemented

### 1. Database Schema Redesign

**File**: `packages/database/src/schema/paths.ts`

Replaced single `paths` table with two tables:

#### `pathPoints` Table
- `id`: UUID primary key
- `sceneId`: Foreign key to scenes (cascade delete)
- `pathName`: Text (case-sensitive) - groups points into paths
- `pathIndex`: Integer - ordering within path (positive whole number)
- `x`, `y`: Real - position coordinates
- `data`: JSONB - extensible metadata
- Timestamps: `createdAt`, `updatedAt`
- Indexes:
  - `path_points_scene_id_idx` on `sceneId`
  - `path_points_path_name_idx` on `(sceneId, pathName)`

#### `pathSettings` Table
- `id`: UUID primary key
- `sceneId`: Foreign key to scenes (cascade delete)
- `pathName`: Text - matches pathPoints.pathName
- `speed`: Real (default 50) - units per second
- `loop`: Boolean (default true)
- `assignedObjectId`: UUID (nullable) - linked token/light
- `assignedObjectType`: Text - 'token' | 'light'
- `visible`: Boolean (default true)
- `color`: Text (default '#ffff00')
- `data`: JSONB - extensible metadata
- Timestamps: `createdAt`, `updatedAt`
- Unique index: `path_settings_scene_path_name_idx` on `(sceneId, pathName)`

### 2. TypeScript Type Definitions

**File**: `packages/shared/src/types/path.ts`

Complete rewrite with new types:

#### Core Entities
- `PathPoint` - Individual path point entity
- `PathPointCreateInput` - Creation payload
- `PathPointUpdateInput` - Update payload
- `PathSettings` - Path-level configuration
- `PathSettingsCreateInput` - Creation payload
- `PathSettingsUpdateInput` - Update payload

#### Runtime Types
- `AssembledPath` - Computed from points at runtime
  - Contains `pathName`, `sceneId`, ordered `points` array, and `settings`

#### Response Types
- `PathPointResponse` - Single point response
- `PathPointsListResponse` - Multiple points response
- `PathSettingsResponse` - Settings response
- `AssembledPathsResponse` - Assembled paths response

### 3. WebSocket Protocol Updates

**File**: `packages/shared/src/types/websocket.ts`

Updated WebSocket payloads to support new entity model:

#### Granular Point Operations
- `PathPointAddPayload` / `PathPointAddedPayload`
- `PathPointUpdatePayload` / `PathPointUpdatedPayload`
- `PathPointRemovePayload` / `PathPointRemovedPayload`

#### Settings Operations
- `PathSettingsAddPayload` / `PathSettingsAddedPayload`
- `PathSettingsUpdatePayload` / `PathSettingsUpdatedPayload`
- `PathSettingsRemovePayload` / `PathSettingsRemovedPayload`

#### Bulk Operations (Convenience/Compatibility)
- `PathAddPayload` / `PathAddedPayload` - Add entire path at once
- `PathUpdatePayload` / `PathUpdatedPayload` - Update entire path
- `PathRemovePayload` / `PathRemovedPayload` - Remove path by name

---

## Files Modified

### Database Package
- `packages/database/src/schema/paths.ts` - Complete schema redesign

### Shared Package
- `packages/shared/src/types/path.ts` - Complete type definitions rewrite
- `packages/shared/src/types/websocket.ts` - Updated WebSocket payloads

---

## Testing Results

### Build Verification
- Database package: Build successful
- Shared package: Build successful
- No TypeScript errors

### Schema Validation
- Proper use of `uniqueIndex` for unique constraint on `(sceneId, pathName)`
- Correct import of `integer` type from drizzle-orm
- Proper foreign key cascades configured

---

## Migration Strategy

### Breaking Changes
This is a **breaking change** to the database schema and API. Migration will require:

1. **Database Migration**
   - Create new `path_points` and `path_settings` tables
   - Migrate existing `paths` data:
     - For each path in old table:
       - Create `path_settings` row with path-level properties
       - Create `path_points` rows for each node with index
   - Drop old `paths` table

2. **API Layer Updates**
   - Update path repository/service layer
   - Implement point-by-point CRUD operations
   - Implement path assembly logic
   - Update WebSocket handlers

3. **Frontend Updates**
   - Update path stores to work with points
   - Update path rendering to assemble from points
   - Update path editing UI for point manipulation
   - Update WebSocket message handlers

---

## Key Design Decisions

### Case-Sensitive Path Names
- `pathName` is case-sensitive to allow flexibility
- Example: "Path1" and "path1" are different paths
- Frontend can enforce naming conventions if desired

### Positive Integer Indices
- `pathIndex` uses positive integers (1, 2, 3...)
- Allows easy reordering and insertion
- Frontend responsible for maintaining sequential order
- Gaps are allowed (e.g., 1, 2, 5, 10) for future insertions

### Separate Settings Table
- Path-level settings stored separately from points
- Allows efficient queries for settings without loading points
- One settings row per unique `(sceneId, pathName)` combination
- Settings can exist without points (template/placeholder)

### Runtime Assembly
- Paths assembled on-demand from points
- Query: `SELECT * FROM path_points WHERE sceneId = ? AND pathName = ? ORDER BY pathIndex`
- Flexible for different use cases (full path, point range, etc.)

---

## Next Steps

### Immediate (Required for Functionality)
1. **Create Database Migration**
   - Generate Drizzle migration from schema changes
   - Write data migration script for existing paths
   - Test migration on development database

2. **Update API Layer**
   - Create path points repository
   - Create path settings repository
   - Implement path assembly logic
   - Update path routes/controllers
   - Update WebSocket handlers

3. **Update Frontend**
   - Update path store to use new entities
   - Update path rendering logic
   - Update path editing tools
   - Update WebSocket integration

### Future Enhancements
1. **Path Point Relationships**
   - Consider linking points to walls/regions
   - Path-based triggers and events
   - Waypoint metadata (pause duration, etc.)

2. **Path Validation**
   - Minimum 2 points validation
   - Index uniqueness within path
   - Path name validation rules

3. **Path Operations**
   - Path reversal
   - Path merging/splitting
   - Path interpolation for smooth curves

---

## Current Status

**Complete**: Schema and type definitions redesigned and building successfully

**Pending**:
- Database migration creation
- API layer implementation
- Frontend updates
- Testing and validation

---

## Notes for Next Session

1. **Breaking Change Alert**: This redesign breaks backward compatibility
2. **Migration Priority**: Database migration must be created and tested before deploying
3. **API Implementation**: Focus on point assembly logic and efficient queries
4. **Frontend Sync**: Path stores and rendering need complete rewrite
5. **WebSocket Strategy**: Decide between granular point updates vs bulk path updates

---

## Key Learnings

1. **Entity Design**: Separating points from settings provides better flexibility
2. **Drizzle ORM**: Use `uniqueIndex()` function, not `.unique()` method on indexes
3. **Type Safety**: Breaking changes caught early through TypeScript compilation
4. **Migration Strategy**: Backward compatibility requires careful planning for breaking changes
