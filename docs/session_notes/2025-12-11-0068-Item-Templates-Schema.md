# Session Notes: Item Templates Database Schema

**Date**: 2025-12-11
**Session ID**: 0068
**Focus**: Create database table for custom item templates

## Overview

Implemented a new `item_templates` table that allows Game Masters to create custom item templates for their campaigns. This table supports the game systems architecture and enables flexible, system-specific item definitions.

## Changes Made

### 1. Database Schema

**File Created**: `packages/database/src/schema/itemTemplates.ts`

Created a new Drizzle schema for the `item_templates` table with the following structure:

- **Core Identity**:
  - `id`: UUID primary key
  - `campaignId`: Reference to campaigns (cascade on delete)
  - `createdBy`: Reference to users
  - `systemId`: Game system identifier
  - `templateId`: Unique template identifier within campaign
  - `name`: Template name
  - `category`: Item category (weapon, armor, spell, etc.)
  - `extends`: Optional parent template ID for inheritance

- **Template Definition** (JSONB fields):
  - `fields`: Field definitions for the template
  - `computedFields`: Auto-calculated field definitions
  - `sections`: UI section definitions
  - `rolls`: Dice roll configurations
  - `actions`: Available actions for items
  - `physical`: Physical properties (weight, dimensions, etc.)
  - `equippable`: Equipment slot and requirements
  - `activation`: Activation conditions and costs
  - `consumes`: Resource consumption rules
  - `effects`: Active effects applied by the item
  - `container`: Container capacity and rules

- **Metadata**:
  - `shared`: Boolean flag for shared templates
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last update timestamp

- **Constraints**:
  - Unique constraint on `(campaignId, templateId)` to prevent duplicates

### 2. Schema Index Export

**File Modified**: `packages/database/src/schema/index.ts`

Added export for the new `itemTemplates` schema:
```typescript
export * from './itemTemplates.js';
```

### 3. Database Migration

**File Created**: `packages/database/migrations/add_item_templates_table.sql`

Created SQL migration with:
- Table creation with all columns and defaults
- Foreign key constraints for `campaign_id` and `created_by`
- Unique constraint `unique_template_per_campaign`
- Indexes on:
  - `campaign_id` (for filtering by campaign)
  - `system_id` (for system-specific queries)
  - `category` (for category filtering)
  - `shared` (for public template queries)

**Migration Applied**: Successfully ran migration on local database.

### 4. Server Code Fixes

**File Modified**: `apps/server/src/routes/api/v1/items.ts`

Fixed the items API to properly handle new fields added to the items table:
- Added proper type imports: `AttunementState`, `ItemRarity`
- Updated POST endpoint to accept new fields in insert values
- Updated PATCH endpoint to handle new fields in updates
- Added type casts for `attunement` and `rarity` fields to match TypeScript enums
- All formatted responses now include: `templateId`, `identified`, `attunement`, `rarity`, `containerId`

### 5. Docker Build Order Fix

**File Modified**: `apps/server/Dockerfile`

Fixed the build order to ensure dependencies are built before dependents:
```dockerfile
# Before (incorrect):
RUN pnpm --filter @vtt/server build
RUN pnpm --filter @vtt/database build
RUN pnpm --filter @vtt/shared build

# After (correct):
RUN pnpm --filter @vtt/shared build
RUN pnpm --filter @vtt/database build
RUN pnpm --filter @vtt/server build
```

This ensures the `@vtt/shared` package (which contains TypeScript types) is built before the server tries to import from it.

## Testing & Verification

### Database Verification

Confirmed the `item_templates` table exists with all columns and constraints:
```sql
\d item_templates
```

All indexes created successfully:
- `item_templates_campaign_id_idx`
- `item_templates_system_id_idx`
- `item_templates_category_idx`
- `item_templates_shared_idx`

### Docker Deployment

1. **Build Status**: ✅ Success
   - Shared package built successfully
   - Database package built successfully
   - Server package built successfully
   - Web package built successfully

2. **Container Status**: ✅ All Running
   - `vtt_db`: Up 37 hours (healthy)
   - `vtt_redis`: Up 37 hours (healthy)
   - `vtt_server`: Up and running (no errors in logs)
   - `vtt_web`: Up and listening on 5173
   - `vtt_nginx`: Up and serving on ports 80/443

3. **Server Logs**: Clean startup with all plugins registered
   - Database connection initialized
   - WebSocket support enabled
   - All HTTP routes registered
   - Server listening on 0.0.0.0:3000

## Files Created

- `D:/Projects/VTT/packages/database/src/schema/itemTemplates.ts`
- `D:/Projects/VTT/packages/database/migrations/add_item_templates_table.sql`
- `D:/Projects/VTT/docs/session_notes/2025-12-11-0068-Item-Templates-Schema.md`

## Files Modified

- `D:/Projects/VTT/packages/database/src/schema/index.ts`
- `D:/Projects/VTT/apps/server/src/routes/api/v1/items.ts`
- `D:/Projects/VTT/apps/server/Dockerfile`

## Technical Notes

### Type System Integration

The `item_templates` table integrates with the existing TypeScript type system:
- Uses `AttunementState` enum: 'none' | 'required' | 'attuned'
- Uses `ItemRarity` enum: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'artifact'
- Proper type casting ensures database string values match TypeScript literal types

### Template Inheritance

The `extends` field enables template inheritance:
- Child templates can reference a parent `templateId`
- Allows for template hierarchies (e.g., "longsword" extends "martial_weapon" extends "weapon")
- Frontend can merge parent and child definitions

### JSONB Flexibility

Using JSONB columns for template definitions provides:
- Schema flexibility for different game systems
- Ability to store complex nested structures
- PostgreSQL JSON querying capabilities
- No need for rigid column structure

## Next Steps

Future enhancements could include:

1. **API Routes**: Create REST endpoints for item template CRUD operations
2. **Template Validation**: Implement JSON schema validation for template definitions
3. **Template Library**: Build UI for browsing and managing templates
4. **Import/Export**: Allow templates to be exported and shared between campaigns
5. **Version Control**: Track template versions and changes over time

## Status

✅ **Complete** - Database schema created, migration applied, server code fixed, Docker deployment verified
