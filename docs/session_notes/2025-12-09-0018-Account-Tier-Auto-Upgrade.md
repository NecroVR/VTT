# Session Notes: Account Tier System and Auto-Upgrade

**Date**: 2025-12-09
**Session ID**: 0018
**Topic**: Account Tier System with Auto-Upgrade on Campaign Creation

---

## Session Summary

Implemented a user account tier system with automatic upgrade from basic to GM tier when users create their first campaign. This includes database schema changes, backend logic, comprehensive tests, and Docker deployment.

---

## Problems Addressed

### User Story
Users need to be automatically upgraded to GM tier when they create their first campaign to ensure they have adequate storage quota for managing game assets.

### Requirements
1. Add account tier tracking to user records
2. Define storage quotas for each tier
3. Auto-upgrade users from basic to GM tier on first campaign creation
4. Ensure all existing tests continue to pass
5. Deploy to Docker environment

---

## Solutions Implemented

### 1. Database Schema Changes

**File**: `packages/database/src/schema/users.ts`

Added three new fields to the users table:
- `accountTier`: Text field with default value 'basic', tracks user's subscription level
- `storageQuotaBytes`: Bigint field storing the user's storage limit in bytes
- `storageUsedBytes`: Bigint field tracking actual storage consumption

Created `STORAGE_QUOTAS` constant:
```typescript
export const STORAGE_QUOTAS = {
  basic: 100 * 1024 * 1024,      // 100MB
  gm: 2 * 1024 * 1024 * 1024,    // 2GB
} as const;
```

### 2. Database Migration

**File**: `packages/database/migrations/add_user_account_tiers.sql`

Created migration script that:
- Adds the three new columns with appropriate defaults
- Creates an index on `account_tier` for efficient queries
- Uses `IF NOT EXISTS` for idempotency

Applied migration to:
- Local development database (`vtt`)
- Test database (`vtt_test`)
- Docker database (via `docker exec`)

### 3. Backend Implementation

**File**: `apps/server/src/routes/api/v1/campaigns.ts`

Added auto-upgrade logic in the POST /campaigns endpoint:
```typescript
// After successfully creating a campaign
if (request.user.accountTier === 'basic') {
  await fastify.db
    .update(users)
    .set({
      accountTier: 'gm',
      storageQuotaBytes: STORAGE_QUOTAS.gm,
      updatedAt: new Date(),
    })
    .where(eq(users.id, request.user.id));

  fastify.log.info(`User ${request.user.id} auto-upgraded to GM tier after creating first campaign`);
}
```

**Files Modified**:
- `apps/server/src/middleware/auth.ts`: Updated to include tier fields in user object
- `apps/server/src/routes/api/v1/auth.ts`: Already returning tier fields in registration/login responses
- `packages/shared/src/types/user.ts`: Updated User interface to include new fields

### 4. Comprehensive Testing

**File**: `apps/server/src/routes/api/v1/campaigns.test.ts`

Added two new tests:
1. **Auto-upgrade test**: Verifies users are upgraded from basic to GM tier when creating first campaign
2. **No downgrade test**: Ensures users already on GM tier are not affected

Also updated test files to include new required fields:
- `packages/shared/src/types/user.test.ts`
- `packages/shared/src/index.test.ts`

**Test Results**: All 36 tests passing

---

## Files Created/Modified

### Created Files
1. `packages/database/migrations/add_user_account_tiers.sql` - Database migration script

### Modified Files
1. `packages/database/src/schema/users.ts` - Added tier fields and STORAGE_QUOTAS constant
2. `apps/server/src/routes/api/v1/campaigns.ts` - Implemented auto-upgrade logic
3. `apps/server/src/routes/api/v1/campaigns.test.ts` - Added auto-upgrade tests
4. `apps/server/src/middleware/auth.ts` - Include tier fields in authenticated user object
5. `packages/shared/src/types/user.ts` - Updated User interface
6. `packages/shared/src/types/user.test.ts` - Updated tests for User type
7. `packages/shared/src/index.test.ts` - Updated tests for exported types

---

## Testing Results

### Unit Tests
All 36 campaign route tests passing, including:
- Existing tests for campaign CRUD operations
- New auto-upgrade test
- New no-downgrade test

### Integration Testing
Verified in Docker environment:
- Server container starts without errors
- Web container starts without errors
- Database migration applied successfully
- All services healthy and communicating

### Manual Verification
```sql
-- Verified new columns in Docker database
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('account_tier', 'storage_quota_bytes', 'storage_used_bytes');
```

---

## Current Status

### Completed
- Database schema updated with tier fields
- STORAGE_QUOTAS constant defined
- Auto-upgrade logic implemented
- Comprehensive tests added and passing
- Database migration created and applied to all databases
- Code committed to git
- Deployed to Docker and verified

### What's Working
- Users start with 'basic' tier (100MB quota)
- First campaign creation automatically upgrades to 'gm' tier (2GB quota)
- Subsequent campaign creations do not modify tier
- All existing functionality preserved
- Tests validate correct behavior

---

## Technical Details

### Storage Quota Design
- **Basic Tier**: 100MB - Sufficient for trying out the platform
- **GM Tier**: 2GB - Adequate for managing a campaign with multiple scenes and assets

### Database Column Types
- `account_tier`: TEXT with default 'basic' - Simple and extensible for future tiers
- `storage_quota_bytes`: BIGINT with mode: 'number' - Handles large file sizes efficiently
- `storage_used_bytes`: BIGINT with mode: 'number' - Tracks actual usage for quota enforcement

### Type Safety
All changes maintain full TypeScript type safety:
- User interface updated with new fields
- Database schema changes reflected in Drizzle types
- Authentication middleware properly typed
- All tests updated to use complete User objects

---

## Next Steps

Potential future enhancements:
1. Implement storage quota enforcement in file upload endpoints
2. Add UI to display current tier and quota usage
3. Create admin endpoints for manual tier adjustments
4. Add analytics to track tier distribution
5. Implement tier-specific feature flags

---

## Key Learnings

1. **Test Database Sync**: Remember that test database (`vtt_test`) and Docker database require separate migration runs
2. **Bigint Handling**: PostgreSQL bigint columns return strings by default; Drizzle's `{ mode: 'number' }` option handles conversion
3. **Idempotent Migrations**: Using `IF NOT EXISTS` allows safe re-running of migrations
4. **Comprehensive Updates**: Type changes require updates across schema, middleware, routes, and all test files

---

## Commit Information

**Commit**: `6acc155`
**Message**: feat(users): Add account tier system with auto-upgrade on campaign creation

- Add account_tier, storage_quota_bytes, and storage_used_bytes fields to users table
- Create STORAGE_QUOTAS constant defining limits for each tier (basic: 100MB, gm: 2GB)
- Implement auto-upgrade from basic to GM tier when user creates their first campaign
- Update authentication middleware to include tier fields in user object
- Add comprehensive tests for auto-upgrade functionality
- Create database migration for new fields with proper indexes

All tests passing (36/36)
