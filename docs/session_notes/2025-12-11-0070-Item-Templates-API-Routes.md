# Session Notes: Item Templates API Routes

**Date**: 2025-12-11
**Session ID**: 0070
**Topic**: Item Templates API Routes Implementation

## Session Summary

Created complete REST API routes for managing custom item templates in campaigns. The API provides CRUD operations for campaign-specific item templates while also integrating with game system templates loaded from files. This enables GMs to create custom item types that extend or supplement the standard item templates provided by the game system.

## Problems Addressed

### 1. Need for Item Template Management
- GMs need to create custom item types specific to their campaigns
- Custom templates should be stored in the database alongside game system templates
- Templates need proper access control (only GMs can create/modify)

### 2. Integration with Game System Templates
- Game system templates come from files loaded by gameSystemLoader
- Custom templates are stored in the database
- API needs to combine both sources seamlessly

## Solutions Implemented

### 1. Item Templates API Routes
Created `apps/server/src/routes/api/v1/itemTemplates.ts` with full CRUD operations:

#### GET `/api/v1/campaigns/:campaignId/item-templates`
- Lists all item templates (both game system and custom)
- Returns separate arrays for `gameSystem` and `custom` templates
- Validates user has access to the campaign (owner, GM, or member)
- Filters game system templates by `entityType: 'item'`

#### GET `/api/v1/campaigns/:campaignId/item-templates/:templateId`
- Retrieves a specific template by ID
- Checks custom templates first, then falls back to game system templates
- Returns template with `source` field indicating origin ('custom' or 'gameSystem')

#### POST `/api/v1/campaigns/:campaignId/item-templates`
- Creates a new custom item template
- Requires GM access to the campaign
- Auto-generates template ID from name (lowercase, hyphens)
- Validates system ID matches campaign's game system
- Prevents duplicate template IDs within a campaign

#### PATCH `/api/v1/campaigns/:campaignId/item-templates/:templateId`
- Updates an existing custom template
- Requires GM access
- Supports partial updates of all template fields
- Automatically updates `updatedAt` timestamp

#### DELETE `/api/v1/campaigns/:campaignId/item-templates/:templateId`
- Deletes a custom template
- Requires GM access
- Only works on custom templates (not game system templates)

### 2. Access Control

Implemented two helper functions for permission checking:

```typescript
checkCampaignAccess(campaignId, userId): boolean
  // Returns true if user is owner, GM, or member

checkGMAccess(campaignId, userId): boolean
  // Returns true if user is owner or GM
```

### 3. TypeScript Type Handling

Fixed type compatibility issues:
- Game system `itemTemplates` are stored as `EntityTemplate[]`
- Cast to `ItemTemplate[]` after filtering by `entityType: 'item'`
- Proper handling of nullable `gameSystemId` field

### 4. Route Registration

Updated `apps/server/src/routes/api/v1/index.ts`:
- Imported `itemTemplatesRoute`
- Registered route with Fastify
- Added endpoint to API documentation list

## Files Created/Modified

### Created
- `apps/server/src/routes/api/v1/itemTemplates.ts` - Main API routes file (606 lines)

### Modified
- `apps/server/src/routes/api/v1/index.ts` - Registered new routes

## API Endpoint Examples

### List Templates
```http
GET /api/v1/campaigns/{campaignId}/item-templates
Authorization: Bearer {sessionToken}

Response:
{
  "templates": {
    "gameSystem": [
      {
        "id": "longsword",
        "systemId": "dnd5e-ogl",
        "entityType": "item",
        "name": "Longsword",
        "category": "weapon",
        ...
      }
    ],
    "custom": [
      {
        "dbId": "uuid-...",
        "campaignId": "uuid-...",
        "id": "magic-sword",
        "name": "Magic Sword",
        "category": "weapon",
        "createdBy": "uuid-...",
        "shared": false,
        ...
      }
    ]
  }
}
```

### Create Custom Template
```http
POST /api/v1/campaigns/{campaignId}/item-templates
Authorization: Bearer {sessionToken}
Content-Type: application/json

{
  "systemId": "dnd5e-ogl",
  "name": "Custom Potion",
  "category": "consumable",
  "fields": [...],
  "sections": [...],
  "effects": [...],
  "shared": false
}

Response: 201 Created
{
  "template": {
    "dbId": "uuid-...",
    "id": "custom-potion",  // auto-generated
    "name": "Custom Potion",
    ...
  }
}
```

## Testing Results

### Build Status
- TypeScript compilation: **PASS**
- No type errors after fixing EntityTemplate/ItemTemplate casting

### Docker Deployment
- Containers built successfully
- Server started without errors
- Logs show proper initialization:
  - Fastify app built successfully
  - HTTP routes registered
  - WebSocket support enabled
  - Server listening on port 3000

### Container Status
```
NAME         STATUS
vtt_db       Up 39 hours (healthy)
vtt_redis    Up 39 hours (healthy)
vtt_server   Up (recreated with new code)
vtt_web      Up (recreated with new code)
vtt_nginx    Up 37 hours
```

## Current Status

### Completed
- Created complete item templates API with CRUD operations
- Implemented proper access control (GM-only for create/update/delete)
- Integrated with game system loader for file-based templates
- Fixed TypeScript type compatibility issues
- Registered routes in main API index
- Built and deployed to Docker successfully
- Committed changes to git

### Testing Notes
- API routes are implemented but not yet tested with actual HTTP requests
- Need to test with a campaign that has a game system with item templates
- Need to verify custom template creation/update/deletion
- Need to test access control (non-GM users should be denied)

## Next Steps

1. **Frontend Integration** (future task)
   - Create UI for browsing/creating item templates
   - Template editor for custom templates
   - Template selector when creating items

2. **Testing** (recommended)
   - Add integration tests for API routes
   - Test with actual game system templates
   - Verify access control works correctly

3. **Documentation** (optional)
   - Add API documentation to docs/api/
   - Document template creation workflow

## Key Learnings

1. **Type Casting Pattern**
   - Game system templates use base `EntityTemplate` type
   - Need to filter by `entityType` and cast to specific types
   - Pattern: `filter(t => t.entityType === 'item') as ItemTemplate[]`

2. **Access Control Layers**
   - Read access: Owner, GM, or member
   - Write access: Owner or GM only
   - Different permission levels for different operations

3. **Template ID Generation**
   - Auto-generate from name for consistency
   - Lowercase, replace spaces with hyphens
   - Remove special characters
   - Check for uniqueness within campaign

4. **Combining Data Sources**
   - File-based templates (game system)
   - Database-stored templates (custom)
   - Return both separately to allow UI to distinguish

## Commit Information

**Commit**: `32e0510`
**Message**: feat(items): Add item templates API routes for campaign-specific templates

**Changes**:
- Added 606 lines of new API route code
- Full CRUD operations for item templates
- Proper authentication and authorization
- Integration with game system loader
- Type-safe handling of template data
