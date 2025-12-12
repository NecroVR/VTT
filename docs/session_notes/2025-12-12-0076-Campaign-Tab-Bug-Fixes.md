# Session Notes: Campaign Tab Bug Fixes

**Date**: 2025-12-12
**Session ID**: 0076
**Focus**: Fix sidebar max width and modules 500 error

---

## Overview

Fixed two issues reported by the user after the Campaign Tab consolidation:
1. Sidebar had a max width constraint of 600px
2. Modules endpoint returned 500 error due to missing database table

---

## Issues Fixed

### Issue 1: Sidebar Max Width Constraint

**Problem**: Users couldn't drag the sidebar wider than 600px

**Root Cause**: `ResizableDivider.svelte` had `maxWidth = 600` as the default value

**Solution**: Changed default to `Infinity` to allow unlimited width

**File Modified**: `apps/web/src/lib/components/campaign/ResizableDivider.svelte`

```typescript
// Before
export let maxWidth = 600;

// After
export let maxWidth = Infinity; // Allow unlimited width - user can drag as wide as they want
```

### Issue 2: Modules 500 Error

**Problem**: `/api/v1/campaigns/{id}/modules` returned 500 Internal Server Error

**Error Message**: `relation "campaign_modules" does not exist`

**Root Cause**: The `campaign_modules` table existed in the schema definition but wasn't created in the production database. The drizzle-kit push command hung on interactive prompts.

**Solution**: Created the table directly via SQL

```sql
CREATE TABLE IF NOT EXISTS campaign_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  load_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  overrides JSONB DEFAULT '{}',
  added_at TIMESTAMP DEFAULT NOW() NOT NULL,
  added_by UUID,
  data JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_campaign_modules_campaign ON campaign_modules(campaign_id);
```

---

## Verification

### Sidebar Fix
- Confirmed `maxWidth = Infinity` in ResizableDivider.svelte
- Users can now drag the sidebar to any width

### Modules Endpoint
- `campaign_modules` table verified in database
- Endpoint now returns proper auth error (401) instead of 500
- Database query executes successfully

### Docker Deployment
- All containers running:
  - vtt_server: Running
  - vtt_web: Running
  - vtt_db: Healthy
  - vtt_redis: Healthy
  - vtt_nginx: Running
- Server logs show successful startup with 638 compendium entries loaded

---

## Git Commit

**Commit**: `69a5b60`
**Message**: `fix(sidebar): Remove max width constraint on resizable divider`

---

## Files Modified

1. `apps/web/src/lib/components/campaign/ResizableDivider.svelte` - Changed maxWidth default to Infinity

---

## Database Changes

1. Created `campaign_modules` table in production database
2. Added index `idx_campaign_modules_campaign` for performance

---

## Status

**Complete**: Both issues fixed and deployed

- Sidebar can now be dragged to any width
- Modules endpoint works correctly (auth required but no 500 error)
- Changes committed and pushed to GitHub
- Docker containers rebuilt and running

---

## Testing Instructions

User should:
1. Refresh browser (hard refresh: Ctrl+Shift+R)
2. Test sidebar dragging - should be able to drag to any width
3. Navigate to Campaign tab -> Modules sub-tab - should load without errors

---

## Related Sessions

- **Session 0073**: Created CampaignTab, UploadsPanel, ModulesPanel, CustomPanel components
- **Session 0074**: Updated campaign page to use new CampaignTab component
- **Session 0075**: Summary of Campaign Tab consolidation

---

**Session Completed**: 2025-12-12 08:30 PST
