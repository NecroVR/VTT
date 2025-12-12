# Module REST API Endpoints Implementation

**Date**: 2025-12-12
**Session ID**: 0073
**Status**: Completed

## Overview

Created comprehensive REST API endpoints for the EAV module system, providing full CRUD operations for modules, entities, campaign-module relationships, property definitions, and validation error management.

## Implemented Endpoints

### 1. Module Management

#### GET /api/v1/modules
- **Purpose**: List all modules with optional filtering
- **Query Parameters**:
  - `gameSystemId` - Filter by game system
  - `validationStatus` - Filter by validation status (valid, invalid, pending)
  - `isActive` - Filter by active status
  - `page` - Page number (default: 1)
  - `pageSize` - Items per page (default: 50)
- **Response**: Paginated list of modules with total count
- **Authentication**: Required

#### GET /api/v1/modules/:moduleId
- **Purpose**: Get detailed information about a specific module
- **Response**: Full module details including metadata and validation status
- **Authentication**: Required

#### POST /api/v1/modules/load
- **Purpose**: Load a module from file system into database
- **Body**:
  - `modulePath` (required) - File system path to module directory
  - `validate` (optional) - Whether to validate module on load (default: true)
  - `skipInvalid` (optional) - Whether to skip invalid entities (default: false)
- **Response**: Loaded module details
- **Authentication**: Required
- **Notes**: Uses ModuleLoaderService to parse and store module data

#### POST /api/v1/modules/:moduleId/reload
- **Purpose**: Reload a module from its source file
- **Response**: Updated module details
- **Authentication**: Required
- **Notes**: Checks source hash for changes before reloading

#### DELETE /api/v1/modules/:moduleId
- **Purpose**: Unload a module and remove all its data
- **Response**: 204 No Content on success
- **Authentication**: Required
- **Validation**:
  - Cannot delete locked modules
  - Cannot delete modules currently in use by campaigns

#### POST /api/v1/modules/:moduleId/validate
- **Purpose**: Run validation on a module and return results
- **Response**: Validation summary with error counts and status
- **Authentication**: Required

### 2. Module-Entity Management

#### GET /api/v1/modules/:moduleId/entities
- **Purpose**: List entities within a module
- **Query Parameters**:
  - `entityType` - Filter by entity type
  - `page` - Page number (default: 1)
  - `pageSize` - Items per page (default: 50)
- **Response**: Paginated list of entities
- **Authentication**: Required

#### GET /api/v1/modules/:moduleId/entities/:entityId
- **Purpose**: Get full entity data with all properties
- **Response**: Entity with reconstructed properties object
- **Authentication**: Required
- **Notes**: Uses ModuleLoaderService to reconstruct EAV properties into nested object

#### GET /api/v1/modules/:moduleId/entities/search
- **Purpose**: Full-text search across module entities
- **Query Parameters**:
  - `query` - Search text (uses PostgreSQL full-text search)
  - `entityType` - Filter by entity type (string or array)
  - `tags` - Filter by tags (array)
  - `validationStatus` - Filter by validation status
  - `page` - Page number (default: 1)
  - `pageSize` - Items per page (default: 50)
  - `sortBy` - Sort field: name, entityType, createdAt, updatedAt
  - `sortOrder` - Sort direction: asc, desc
- **Response**: Paginated search results with relevance ranking
- **Authentication**: Required
- **Notes**: Results sorted by relevance when query is provided

### 3. Campaign-Module Management

#### GET /api/v1/campaigns/:campaignId/modules
- **Purpose**: Get all modules loaded for a campaign
- **Response**: List of campaign-module relationships with module details
- **Authentication**: Required
- **Notes**: Includes load order and override settings

#### POST /api/v1/campaigns/:campaignId/modules
- **Purpose**: Add a module to a campaign
- **Body**:
  - `moduleId` (required) - Module UUID to add
  - `loadOrder` (optional) - Load priority (default: 0)
  - `isActive` (optional) - Whether module is active (default: true)
  - `overrides` (optional) - Campaign-specific override settings
- **Response**: Created campaign-module relationship
- **Authentication**: Required
- **Validation**:
  - Module game system must match campaign game system
  - Module cannot already be added to campaign

#### DELETE /api/v1/campaigns/:campaignId/modules/:moduleId
- **Purpose**: Remove a module from a campaign
- **Response**: 204 No Content on success
- **Authentication**: Required

#### PATCH /api/v1/campaigns/:campaignId/modules/:moduleId
- **Purpose**: Update campaign-module settings
- **Body**:
  - `loadOrder` (optional) - Update load priority
  - `isActive` (optional) - Update active status
  - `overrides` (optional) - Update override settings
- **Response**: Updated campaign-module relationship
- **Authentication**: Required

### 4. Property Definitions

#### GET /api/v1/game-systems/:systemId/property-definitions
- **Purpose**: Get all property definitions for a game system
- **Query Parameters**:
  - `entityType` - Filter by entity type
- **Response**: List of property definitions
- **Authentication**: Required
- **Notes**: Used for validation and UI form generation

#### GET /api/v1/game-systems/:systemId/property-definitions/:entityType
- **Purpose**: Get property definitions for a specific entity type
- **Response**: List of property definitions for the entity type
- **Authentication**: Required
- **Notes**: Sorted by section and sort order

### 5. Validation Errors

#### GET /api/v1/modules/:moduleId/validation-errors
- **Purpose**: Get validation errors for a module
- **Query Parameters**:
  - `entityId` - Filter by specific entity
  - `severity` - Filter by severity (error, warning, info)
  - `includeResolved` - Include resolved errors (default: false)
  - `page` - Page number (default: 1)
  - `pageSize` - Items per page (default: 50)
- **Response**: Paginated list of validation errors
- **Authentication**: Required
- **Notes**: Ordered by severity (errors first) then creation date

#### PATCH /api/v1/validation-errors/:errorId/resolve
- **Purpose**: Mark a validation error as resolved
- **Body**:
  - `note` (optional) - Resolution note explaining how error was fixed
- **Response**: Updated validation error record
- **Authentication**: Required
- **Notes**: Records resolver user ID and timestamp

## Implementation Details

### File Structure

```
apps/server/src/routes/api/v1/
├── modules.ts                    # New module API routes
└── index.ts                      # Updated to register module routes

apps/server/src/services/
├── moduleValidator.ts            # Fixed naming conflict
└── moduleLoader.ts               # Used by API routes
```

### Key Features

1. **Authentication**: All endpoints require authentication via `authenticate` middleware
2. **Pagination**: List and search endpoints support pagination with customizable page sizes
3. **Type Safety**: Full TypeScript typing using shared types from `@vtt/shared`
4. **Error Handling**: Comprehensive error handling with appropriate HTTP status codes
5. **Game System Compatibility**: Enforces game system matching between modules and campaigns
6. **EAV Property Reconstruction**: Transparently reconstructs nested objects from EAV storage
7. **Full-Text Search**: Uses PostgreSQL's ts_vector for efficient text search with relevance ranking
8. **Validation Integration**: Works with ModuleValidatorService for comprehensive validation

### Database Integration

The endpoints use Drizzle ORM to query the following tables:
- `modules` - Module metadata
- `module_entities` - Entity records
- `entity_properties` - EAV property storage
- `property_definitions` - Property schemas for validation
- `validation_errors` - Validation error tracking
- `campaign_modules` - Campaign-module relationships

### Error Handling

Standard HTTP status codes:
- `200` - Success
- `201` - Resource created
- `204` - Success with no content
- `400` - Bad request (validation failed)
- `401` - Not authenticated
- `403` - Forbidden (locked resource)
- `404` - Resource not found
- `409` - Conflict (duplicate resource)
- `500` - Internal server error

## Bug Fixes

### ModuleValidator Type Conflict

**Issue**: TypeScript compilation error in `moduleValidator.ts`:
```
Import declaration conflicts with local declaration of 'ValidationErrorType'
```

**Cause**: The file imported `ValidationError` type from `@vtt/shared` and aliased it as `ValidationErrorType`, but also defined a local enum with the same name `ValidationErrorType`.

**Fix**: Removed the import alias, keeping only the local enum:
```typescript
// Before (caused conflict)
import {
  ValidationError as ValidationErrorType,
} from '@vtt/shared';

export enum ValidationErrorType {
  // ...
}

// After (fixed)
// Removed the import, kept only the enum
export enum ValidationErrorType {
  // ...
}
```

## Testing

### Build Verification
- ✅ TypeScript compilation successful
- ✅ No type errors
- ✅ All dependencies resolved

### Docker Deployment
- ✅ Docker build successful
- ✅ Containers started without errors
- ✅ Server listening on port 3000
- ✅ No runtime errors in logs

## Usage Examples

### Loading a Module

```bash
curl -X POST http://localhost/api/v1/modules/load \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "modulePath": "/app/game-systems/community/my-module",
    "validate": true
  }'
```

### Searching Entities

```bash
curl -X GET "http://localhost/api/v1/modules/{moduleId}/entities/search?query=fireball&entityType=spell" \
  -H "Authorization: Bearer <token>"
```

### Adding Module to Campaign

```bash
curl -X POST http://localhost/api/v1/campaigns/{campaignId}/modules \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "moduleId": "{moduleId}",
    "loadOrder": 100,
    "isActive": true
  }'
```

## Integration Points

### With Module Loader Service
- `loadModule()` - Loads module from file system
- `reloadModule()` - Reloads existing module
- `unloadModule()` - Removes module from database
- `getModuleStatus()` - Gets validation status
- `reconstructFromProperties()` - Reconstructs objects from EAV

### With Module Validator Service
- `revalidateModuleFromDb()` - Validates loaded module
- `checkCampaignCompatibility()` - Checks module compatibility
- `getValidationSummary()` - Gets detailed validation status
- `resolveError()` - Marks errors as resolved

### With Database Schema
- Uses all EAV module tables (modules, module_entities, entity_properties, etc.)
- Enforces referential integrity through foreign keys
- Supports cascading deletes for cleanup

## Next Steps

1. **Add Permission Checks**: Implement campaign ownership and permission checks
2. **Add Request Validation**: Add Zod schemas for request body validation
3. **Add Rate Limiting**: Protect endpoints from abuse
4. **Add Caching**: Cache frequently accessed module data
5. **Add WebSocket Updates**: Notify clients when modules change
6. **Create Frontend Components**: Build UI for module management
7. **Add Bulk Operations**: Support loading multiple modules at once
8. **Add Module Dependencies**: Automatically load required dependencies

## Files Modified

- `apps/server/src/routes/api/v1/modules.ts` - Created (1069 lines)
- `apps/server/src/routes/api/v1/index.ts` - Updated (registered new routes)
- `apps/server/src/services/moduleValidator.ts` - Fixed (removed import conflict)

## Commit Information

**Commit**: 5de9dc2
**Message**: feat(modules): Add REST API endpoints for EAV module system
**Status**: Pushed to origin/master
**Pre-commit Hooks**: Passed
**Docker Deployment**: Successful

---

**Session completed successfully. All tasks completed and deployed to Docker.**
