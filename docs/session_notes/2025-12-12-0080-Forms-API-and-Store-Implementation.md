# Forms API Client and Svelte Store Implementation

**Date**: 2025-12-12
**Session ID**: 0080
**Status**: Completed

## Summary

Created a comprehensive API client and Svelte store for managing form definitions in the VTT web application. This provides the frontend infrastructure for the dynamic form designer system, enabling CRUD operations on forms and campaign form assignments.

## What Was Implemented

### 1. API Client (`/apps/web/src/lib/api/forms.ts`)

Created a complete API client module with the following features:

**Form CRUD Operations:**
- `listForms(systemId, entityType?)` - List forms for a game system, optionally filtered by entity type
- `getForm(formId)` - Get a single form by ID
- `createForm(systemId, request)` - Create a new form
- `updateForm(formId, updates)` - Update an existing form
- `deleteForm(formId)` - Delete a form
- `duplicateForm(formId, request)` - Duplicate a form with a new name

**Campaign Form Operations:**
- `listCampaignForms(campaignId)` - List forms assigned to a campaign
- `assignFormToCampaign(campaignId, request)` - Assign a form to a campaign
- `updateCampaignForm(campaignId, assignmentId, updates)` - Update campaign form assignment
- `removeCampaignForm(campaignId, assignmentId)` - Remove a form from a campaign
- `getActiveForm(campaignId, entityType)` - Get the active form for an entity type in a campaign

**Key Implementation Details:**
- Uses `vtt_session_id` from localStorage for authentication (consistent with existing stores)
- Includes proper error handling with user-friendly messages
- Returns null (not error) for 404 responses on getActiveForm
- All functions use TypeScript types from `@vtt/shared`

### 2. Svelte Store (`/apps/web/src/lib/stores/forms.ts`)

Created a comprehensive Svelte store with the following features:

**State Management:**
- Caches form definitions by ID to minimize API calls
- Tracks forms by game system for efficient listing
- Caches active forms per campaign/entity type
- Separate loading states for different operations
- Centralized error state

**Store Methods:**
- `loadFormsForSystem(systemId, entityType?)` - Load and cache forms for a system
- `getForm(formId)` - Get form by ID (uses cache, fetches if needed)
- `createForm(systemId, request)` - Create new form and update cache
- `updateForm(formId, updates)` - Update form and refresh cache
- `deleteForm(formId)` - Delete form and remove from cache
- `duplicateForm(formId, request)` - Duplicate form and add to cache
- `getActiveForm(campaignId, entityType)` - Get active form with caching
- `invalidateActiveFormCache(campaignId?, entityType?)` - Clear cache entries
- `clearError()` - Clear error state
- `reset()` - Reset store to initial state

**Derived Stores:**
- `getFormsForSystem(systemId)` - Returns forms for a specific system
- `isLoading` - True if any operation is loading
- `formsError` - Current error message (if any)

**Design Patterns:**
- Smart caching to reduce API calls
- Cache-first strategy with fallback to API
- Immutable state updates using Maps
- Proper TypeScript typing throughout
- Follows existing store patterns (campaigns, auth, etc.)

### 3. Index Files

**`/apps/web/src/lib/api/index.ts`:**
- Exports all API functions from forms module
- Provides single import point for API clients

**`/apps/web/src/lib/stores/index.ts`:**
- Exports forms store and derived stores
- Single import point for store consumers

## Files Created

1. `D:\Projects\VTT\apps\web\src\lib\api\forms.ts` - API client functions
2. `D:\Projects\VTT\apps\web\src\lib\api\index.ts` - API exports
3. `D:\Projects\VTT\apps\web\src\lib\stores\forms.ts` - Svelte store
4. `D:\Projects\VTT\apps\web\src\lib\stores\index.ts` - Store exports

## Technical Details

### Authentication Pattern

Uses the same authentication pattern as existing stores:
```typescript
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('vtt_session_id');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}
```

### Caching Strategy

The store implements a multi-level cache:
1. **Form cache**: All fetched forms stored by ID
2. **System cache**: Form IDs grouped by game system
3. **Active form cache**: Active forms keyed by `campaignId:entityType`

This minimizes API calls while ensuring data freshness where needed.

### Error Handling

- API errors are caught and converted to user-friendly messages
- Store methods throw errors after updating state, allowing components to handle them
- 404 responses for active forms return null (expected behavior)

## Integration Points

### Dependencies
- `@vtt/shared` - TypeScript types for forms and API requests/responses
- `$lib/config/api` - API_BASE_URL configuration
- `svelte/store` - Svelte store primitives

### Usage Example
```typescript
import { formsStore, isLoading, formsError } from '$lib/stores';

// Load forms for a game system
const forms = await formsStore.loadFormsForSystem('dnd5e', 'spell');

// Get active form for a campaign
const activeForm = await formsStore.getActiveForm(campaignId, 'character');

// Create a new form
const newForm = await formsStore.createForm('dnd5e', {
  name: 'Custom Character Sheet',
  entityType: 'character',
  gameSystemId: 'dnd5e'
});

// Subscribe to loading state
isLoading.subscribe(loading => {
  console.log('Loading:', loading);
});
```

## Next Steps

The following components/features can now be built on top of this infrastructure:

1. **Form Designer UI** - Visual form builder interface
2. **Form Preview Component** - Preview forms with sample data
3. **Campaign Form Settings** - UI for assigning forms to campaigns
4. **Form Marketplace** - Browse and install forms from marketplace
5. **Entity Sheet Renderer** - Render entity sheets using form definitions

## Testing Considerations

When implementing tests, consider:
- Mock the API client functions for store tests
- Test cache behavior (cache hits, cache invalidation)
- Test error handling and recovery
- Test concurrent operations
- Test loading state transitions

## Notes

- The store follows the same patterns as existing stores (campaigns, auth, etc.)
- All cache operations are immutable (new Maps created on updates)
- Loading states are granular (forms, campaignForms, activeForm)
- The active form cache can be invalidated selectively or globally
- API client uses async/await consistently for cleaner error handling
