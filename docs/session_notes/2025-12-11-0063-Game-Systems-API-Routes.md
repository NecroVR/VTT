# Game Systems API Routes Implementation

**Date**: 2025-12-11
**Session**: 0063
**Status**: Complete

## Summary

Successfully implemented comprehensive API routes for game system management in the VTT project. This includes public endpoints for browsing available game systems and campaign integration for gameSystemId support with immutability enforcement.

## Implementation Details

### 1. Game Systems API Routes

Created `apps/server/src/routes/api/v1/gameSystems.ts` with three public endpoints:

#### GET /api/v1/game-systems
- Lists all active game systems
- Filters by `isActive = true`
- Returns: `{ gameSystems: Array }`
- Fields: id, systemId, name, version, publisher, description, type
- No authentication required (public endpoint)

#### GET /api/v1/game-systems/:systemId
- Retrieves full details of a specific game system by systemId
- Filters by `isActive = true`
- Returns 404 if not found or inactive
- Returns: `{ gameSystem: Object }`
- No authentication required (public endpoint)

#### GET /api/v1/game-systems/:systemId/manifest
- Retrieves manifest data for a game system
- Currently constructs basic manifest from database fields
- Future: Will load from manifestPath when populated
- Returns: `{ manifest: Object }`
- No authentication required (public endpoint)

### 2. Campaign GameSystemId Integration

Updated `apps/server/src/routes/api/v1/campaigns.ts`:

#### POST /api/v1/campaigns
- **Breaking Change**: gameSystemId is now required
- Returns 400 error if gameSystemId is missing
- Error message: "Game system ID is required"

#### PATCH /api/v1/campaigns/:id
- **Immutability**: gameSystemId cannot be changed once set
- Allows setting gameSystemId if not already set
- Prevents changing existing gameSystemId
- Error message: "Cannot change game system once set. The game system is immutable after campaign creation."

#### GET Endpoints
- All GET responses now include gameSystemId field
- Updated select statements and formatted response objects

### 3. Database Schema

Created migration `packages/database/migrations/add_game_systems_table.sql`:

```sql
CREATE TABLE game_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id text NOT NULL UNIQUE,
  name text NOT NULL,
  version text NOT NULL,
  publisher text,
  description text,
  type text NOT NULL,
  manifest_path text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX game_systems_system_id_idx ON game_systems (system_id);
CREATE INDEX game_systems_is_active_idx ON game_systems (is_active);

-- Add to campaigns table
ALTER TABLE campaigns ADD COLUMN game_system_id text;
CREATE INDEX campaigns_game_system_id_idx ON campaigns (game_system_id);
```

Created schema definition `packages/database/src/schema/gameSystems.ts` using Drizzle ORM.

### 4. Type Updates

Updated `packages/shared/src/types/campaign.ts`:

```typescript
export interface Campaign {
  // ... existing fields
  gameSystemId?: string | null;
}

export interface CreateCampaignRequest {
  name: string;
  gameSystemId: string;  // Now required
  settings?: Partial<CampaignSettings>;
}

export interface UpdateCampaignRequest {
  name?: string;
  gameSystemId?: string;  // Allowed only if not set
  settings?: Partial<CampaignSettings>;
}
```

### 5. Route Registration

Updated `apps/server/src/routes/api/v1/index.ts`:
- Imported gameSystemsRoute
- Registered route with Fastify
- Added to endpoints list in GET / response

## Testing

### Game Systems Routes Tests
Created `apps/server/src/routes/api/v1/gameSystems.test.ts` with 13 tests:

**GET /api/v1/game-systems**
- ✓ Lists all active game systems
- ✓ Does not include inactive systems
- ✓ Returns empty array if no active systems exist
- ✓ Is publicly accessible without authentication

**GET /api/v1/game-systems/:systemId**
- ✓ Gets a game system by systemId
- ✓ Returns 404 for invalid systemId
- ✓ Returns 404 for inactive system
- ✓ Is publicly accessible without authentication

**GET /api/v1/game-systems/:systemId/manifest**
- ✓ Gets manifest for a game system
- ✓ Returns 404 for invalid systemId
- ✓ Returns 404 for inactive system
- ✓ Handles system with null description
- ✓ Is publicly accessible without authentication

### Campaigns Routes Tests
Updated `apps/server/src/routes/api/v1/campaigns.test.ts`:

- Added gameSystemId to all campaign creation tests
- Added test for missing gameSystemId validation
- Added test for gameSystemId immutability
- All 38 tests passing

**Total Test Coverage**: 51 tests passing (13 new + 38 updated)

## Files Modified

**New Files:**
- `apps/server/src/routes/api/v1/gameSystems.ts` - Game systems routes
- `apps/server/src/routes/api/v1/gameSystems.test.ts` - Game systems tests
- `packages/database/migrations/add_game_systems_table.sql` - Database migration
- `packages/database/src/schema/gameSystems.ts` - Drizzle schema

**Modified Files:**
- `apps/server/src/routes/api/v1/campaigns.ts` - Added gameSystemId support
- `apps/server/src/routes/api/v1/campaigns.test.ts` - Updated tests
- `apps/server/src/routes/api/v1/index.ts` - Registered game systems route
- `packages/database/src/schema/index.ts` - Exported gameSystems schema
- `packages/shared/src/types/campaign.ts` - Updated Campaign types
- `packages/shared/src/types/campaign.test.ts` - Updated type tests
- `packages/shared/src/types/index.ts` - Exported updated types

## Deployment

### Local Database
- Ran migration on local PostgreSQL database
- Ran migration on test database (vtt_test)

### Docker Deployment
- Successfully built and deployed to Docker
- Ran migration on Docker PostgreSQL database
- Verified all containers running correctly:
  - vtt_server: Up and healthy
  - vtt_web: Up and healthy
  - vtt_db: Up and healthy
  - vtt_redis: Up and healthy
  - vtt_nginx: Up and healthy

### API Verification
Tested game systems endpoint:
```bash
curl -k https://localhost/api/v1/game-systems
# Response: {"gameSystems":[]}
```

Endpoint returns empty array (expected, as no systems are seeded yet).

## Git Commits

### Commit 1: Main Implementation
```
feat(api): Add game systems API routes and campaign gameSystemId support

- Created game systems API routes (GET /api/v1/game-systems)
  - List all active game systems
  - Get specific system by systemId
  - Get system manifest
  - All endpoints are public (no auth required)

- Updated campaigns API to support gameSystemId
  - gameSystemId is now required when creating campaigns
  - gameSystemId is immutable once set (enforced at API level)
  - Added validation to prevent changing gameSystemId after creation
  - Updated Campaign type to include gameSystemId field

- Added database schema and migration
  - Created game_systems table with system metadata
  - Added gameSystemId column to campaigns table
  - Created necessary indexes for performance

- Comprehensive test coverage
  - 13 new tests for game systems routes
  - Updated campaigns tests for gameSystemId validation
  - Added test for gameSystemId immutability

All tests passing (51/51).
```

### Commit 2: Test Fix
```
fix(types): Update campaign tests to include required gameSystemId field
```

## Key Design Decisions

### 1. Public Endpoints
Game systems endpoints are public because:
- Users need to browse available systems before creating campaigns
- No sensitive data in game system metadata
- Enables pre-registration system exploration

### 2. GameSystemId Immutability
Enforced at API level (not database constraint) because:
- Allows initial campaigns without game systems (legacy support)
- Prevents accidental changes that would break campaign consistency
- Clear error messaging for better UX
- Can be set on first PATCH if not set during creation

### 3. Manifest Construction
Currently constructs manifest from database fields:
- manifestPath column exists but not yet populated
- Provides working API while file-based manifests are developed
- Easy to extend when manifest files are added

## Next Steps

1. **Seed Game Systems Data**
   - Add D&D 5e OGL system to database
   - Create seeding script for initial game systems

2. **Frontend Integration**
   - Update campaign creation UI to select game system
   - Add game system browsing/selection component
   - Update campaign details to display game system

3. **System Loading**
   - Implement manifest file loading from manifestPath
   - Parse and validate JSON manifests
   - Cache loaded systems for performance

4. **System Management UI**
   - Admin interface for managing game systems
   - System upload/installation workflow
   - System activation/deactivation

## Issues Encountered

### TypeScript Build Errors in Docker
**Issue**: Docker build failed due to TypeScript errors in campaign.test.ts
**Cause**: CreateCampaignRequest now requires gameSystemId, tests weren't updated
**Fix**: Updated test file to include gameSystemId in all CreateCampaignRequest objects

### Missing Database Migration
**Issue**: Docker container returned "relation does not exist" error
**Cause**: Migration wasn't automatically run on Docker database
**Fix**: Manually ran migration using docker exec

## Status

**Complete and Deployed**
- All API routes implemented and tested
- Database migration applied to all environments
- Docker deployment verified and running
- Tests passing (51/51)
- Changes committed and pushed to GitHub

The game systems API infrastructure is now ready for:
- Game system data seeding
- Frontend integration
- Advanced game system features (character sheets, rules, etc.)
