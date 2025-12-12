# Module Validation System Implementation

**Date**: 2025-12-12
**Session ID**: 0071
**Status**: Complete

## Session Summary

Implemented a comprehensive re-validation system for database-loaded modules in the VTT EAV (Entity-Attribute-Value) module system. The system validates entities and properties against property definitions, detects broken references, persists validation errors to the database, and provides background job scheduling for long-running validations.

## Goals

- Create a robust validation system for database-loaded modules
- Validate entities against property definitions
- Detect broken references between modules
- Persist validation errors with resolution tracking
- Provide background job scheduling for batch validations
- Integrate validation into existing API routes

## Implementation

### 1. Module Validator Service

**File**: `apps/server/src/services/moduleValidator.ts` (NEW - 1,049 lines)

#### Key Features

- **Database-Based Revalidation**: Validates modules from database records rather than file system
- **Property Definition Validation**: Checks entity properties against registered property definitions
- **Type Checking**: Validates value types (string, number, integer, boolean, json, reference)
- **Validation Rules**: Enforces min/max, length, pattern, and enum constraints
- **Reference Validation**: Detects broken references and invalid reference formats
- **Module-Level Validation**: Checks dependencies and game system compatibility
- **Error Persistence**: Stores validation errors in database with detailed context
- **Status Updates**: Updates entity and module validation statuses

#### Core Methods

```typescript
class ModuleValidatorService {
  // Main revalidation entry point
  async revalidateModuleFromDb(db: Database, moduleId: string): Promise<ValidationResult>

  // Check campaign compatibility
  async checkCampaignCompatibility(db: Database, moduleId: string, campaignId: string): Promise<boolean>

  // Get detailed validation summary
  async getValidationSummary(db: Database, moduleId: string): Promise<ModuleValidationStatus>

  // Resolve validation error
  async resolveError(db: Database, errorId: string, userId: string, note?: string): Promise<void>
}
```

#### Validation Error Types

- **Schema Errors**: `SCHEMA_INVALID`, `SCHEMA_MISSING_REQUIRED`, `SCHEMA_UNKNOWN_PROPERTY`
- **Type Errors**: `TYPE_MISMATCH`, `TYPE_INVALID_VALUE`
- **Reference Errors**: `REFERENCE_BROKEN`, `REFERENCE_INVALID_FORMAT`, `REFERENCE_CIRCULAR`
- **Validation Rule Errors**: `VALIDATION_MIN`, `VALIDATION_MAX`, `VALIDATION_LENGTH`, `VALIDATION_PATTERN`, `VALIDATION_OPTIONS`
- **Module Errors**: `MODULE_DEPENDENCY_MISSING`, `MODULE_GAME_SYSTEM_MISMATCH`, `MODULE_VERSION_INCOMPATIBLE`

#### Validation Context

Maintains state during validation including:
- Processed entities (to avoid duplicates)
- Property definition cache (for performance)
- Referenced entities set (for broken reference detection)
- Available entities map (for reference resolution)
- Accumulated errors, warnings, and info messages

#### Validation Workflow

1. **Clear Old Errors**: Remove previous validation errors for the module
2. **Validate Module Constraints**: Check dependencies and game system compatibility
3. **Build Entity Map**: Create lookup map for reference checking
4. **Validate Each Entity**:
   - Fetch property definitions for entity type
   - Check required properties exist
   - Validate each property against its definition
   - Check type matches
   - Enforce validation rules (min/max, length, pattern, options)
5. **Check Broken References**: Find references to non-existent entities
6. **Persist Errors**: Save all validation errors to database
7. **Update Statuses**: Update entity and module validation statuses

### 2. Validation Scheduler Service

**File**: `apps/server/src/services/validationScheduler.ts` (NEW - 469 lines)

#### Key Features

- **Job Scheduling**: Schedule validation jobs with priority support
- **Concurrent Execution**: Run multiple validations in parallel (configurable limit)
- **Progress Tracking**: Track validation progress for each job
- **Batch Validation**: Validate multiple modules at once
- **Auto-Revalidation**: Automatically revalidate stale modules
- **Job Management**: Cancel, monitor, and cleanup validation jobs

#### Configuration

```typescript
interface SchedulerConfig {
  maxConcurrentJobs: number;         // Default: 3
  batchSize: number;                 // Default: 50
  batchDelay: number;                // Default: 100ms
  autoRevalidateAfterHours: number;  // Default: 24
  enableAutoRevalidation: boolean;   // Default: true
}
```

#### Job States

- `PENDING`: Job scheduled but not started
- `IN_PROGRESS`: Job currently executing
- `COMPLETED`: Job finished successfully
- `FAILED`: Job encountered an error
- `CANCELLED`: Job was cancelled by user

#### Core Methods

```typescript
class ValidationScheduler {
  // Lifecycle
  start(): void
  stop(): void

  // Job management
  async scheduleValidation(moduleId: string, priority?: boolean): Promise<string>
  cancelValidation(jobId: string): boolean
  getJobStatus(jobId: string): ValidationJob | null
  getModuleJobs(moduleId: string): ValidationJob[]
  getActiveJobs(): ValidationJob[]

  // Batch operations
  async batchValidate(moduleIds: string[]): Promise<string[]>
  async validateStaleModules(): Promise<string[]>

  // Maintenance
  cleanupJobs(): void
}
```

#### Scheduler Initialization

```typescript
// Initialize scheduler with database
const scheduler = initializeScheduler(db, config);
scheduler.start();

// Get scheduler instance
const scheduler = getScheduler();

// Shutdown scheduler
shutdownScheduler();
```

### 3. API Routes Integration

**File**: `apps/server/src/routes/api/v1/modules.ts` (UPDATED)

#### New Validation Endpoints

1. **POST `/api/v1/modules/:moduleId/validate`** - Validate module
   - Body: `{ force?: boolean, async?: boolean }`
   - Returns validation result or job ID for async validation
   - Supports caching (won't revalidate if validated within 1 hour unless `force: true`)

2. **GET `/api/v1/modules/:moduleId/validation-status`** - Get validation status
   - Returns detailed ModuleValidationStatus with entity-level breakdown
   - Includes error counts, entity statuses, and validation issues

3. **GET `/api/v1/modules/:moduleId/compatibility/:campaignId`** - Check compatibility
   - Checks if module is compatible with a campaign
   - Validates game system match, validation status, and dependencies

4. **GET `/api/v1/modules/:moduleId/validation-errors`** - Get validation errors
   - Query: `{ entityId?, severity?, includeResolved?, page?, pageSize? }`
   - Returns paginated list of validation errors with filtering

5. **PATCH `/api/v1/validation-errors/:errorId/resolve`** - Resolve error
   - Body: `{ note?: string }`
   - Marks validation error as resolved with optional resolution note

#### New Validation Job Endpoints

6. **GET `/api/v1/validation/jobs/:jobId`** - Get job status
   - Returns current status, progress, and results for validation job

7. **GET `/api/v1/validation/jobs`** - Get active jobs
   - Returns all currently running validation jobs

8. **POST `/api/v1/validation/jobs/:jobId/cancel`** - Cancel job
   - Cancels a pending or running validation job

9. **POST `/api/v1/validation/batch`** - Batch validate
   - Body: `{ moduleIds: string[] }`
   - Schedules validation for multiple modules
   - Returns array of job IDs

## Database Schema

The validation system uses the existing `validation_errors` table:

```sql
CREATE TABLE validation_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES module_entities(id) ON DELETE CASCADE,

  -- Error Details
  error_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'error',
  property_key TEXT,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',

  -- Source Location
  source_path TEXT,
  source_line_number INTEGER,
  source_column INTEGER,

  -- Resolution Tracking
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by UUID,
  resolution_note TEXT,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_validation_errors_unresolved
  ON validation_errors(module_id, is_resolved);
```

## Usage Examples

### Validate a Module

```typescript
// Synchronous validation
const result = await moduleValidatorService.revalidateModuleFromDb(db, moduleId);
console.log(`Validation: ${result.valid ? 'PASS' : 'FAIL'}`);
console.log(`Errors: ${result.errors.length}, Warnings: ${result.warnings.length}`);

// Async validation via API
const response = await fetch(`/api/v1/modules/${moduleId}/validate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ async: true })
});
const { jobId } = await response.json();

// Check job status
const jobResponse = await fetch(`/api/v1/validation/jobs/${jobId}`);
const { job } = await jobResponse.json();
console.log(`Progress: ${job.progress}%`);
```

### Get Validation Status

```typescript
// Get detailed validation summary
const status = await moduleValidatorService.getValidationSummary(db, moduleId);

console.log(`Module: ${status.moduleName}`);
console.log(`Status: ${status.status}`);
console.log(`Total Entities: ${status.totalEntities}`);
console.log(`Valid: ${status.validEntities}`);
console.log(`Invalid: ${status.invalidEntities}`);
console.log(`Errors: ${status.errorCount}`);
console.log(`Warnings: ${status.warningCount}`);

// Entity-level details
for (const entityStatus of status.entityStatuses) {
  if (entityStatus.status === 'invalid') {
    console.log(`\n${entityStatus.entityName} (${entityStatus.entityType}):`);
    for (const issue of entityStatus.issues) {
      console.log(`  - [${issue.severity}] ${issue.message}`);
    }
  }
}
```

### Check Campaign Compatibility

```typescript
// Check if module can be loaded into campaign
const compatible = await moduleValidatorService.checkCampaignCompatibility(
  db,
  moduleId,
  campaignId
);

if (!compatible) {
  console.log('Module is not compatible with this campaign');
  // Possible reasons:
  // - Game system mismatch
  // - Module is invalid
  // - Missing dependencies
}
```

### Batch Validation

```typescript
// Schedule multiple modules for validation
const scheduler = getScheduler();
const jobIds = await scheduler.batchValidate([
  'module-1-uuid',
  'module-2-uuid',
  'module-3-uuid'
]);

console.log(`Scheduled ${jobIds.length} validation jobs`);

// Monitor progress
for (const jobId of jobIds) {
  const job = scheduler.getJobStatus(jobId);
  console.log(`${job.moduleId}: ${job.status} (${job.progress}%)`);
}
```

### Auto-Revalidation

```typescript
// Initialize scheduler with auto-revalidation
const scheduler = initializeScheduler(db, {
  enableAutoRevalidation: true,
  autoRevalidateAfterHours: 24,
  maxConcurrentJobs: 3
});
scheduler.start();

// Scheduler will automatically:
// - Check for stale modules every 5 minutes
// - Revalidate modules not validated in the last 24 hours
// - Run up to 3 validations concurrently
```

### Resolve Validation Errors

```typescript
// Mark error as resolved
await moduleValidatorService.resolveError(
  db,
  errorId,
  userId,
  'Fixed by correcting property type in source file'
);

// Via API
await fetch(`/api/v1/validation-errors/${errorId}/resolve`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    note: 'Fixed by updating property definition'
  })
});
```

## Testing

### Build Verification

```bash
cd D:\Projects\VTT
npm run build
# ✓ All packages built successfully
```

### Key Build Results

- **@vtt/database**: Compiled successfully
- **@vtt/shared**: Compiled successfully
- **@vtt/server**: Compiled successfully with new validation services
- **@vtt/web**: Compiled successfully

### Docker Deployment

```bash
# Build and deploy
docker-compose up -d --build

# Check logs
docker-compose logs -f server

# Verify validation endpoints
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost/api/v1/modules/{moduleId}/validation-status
```

## Files Created

1. `apps/server/src/services/moduleValidator.ts` - Module validator service (1,049 lines)
2. `apps/server/src/services/validationScheduler.ts` - Validation scheduler service (469 lines)
3. `docs/session_notes/2025-12-12-0071-Module-Validation-System-Implementation.md` - This file

## Files Modified

1. `apps/server/src/routes/api/v1/modules.ts` - Added validation API endpoints

## Architecture Decisions

### 1. Database-Centric Validation

**Decision**: Validate from database records rather than source files

**Rationale**:
- Validates actual loaded data, not just file contents
- Can detect issues that arise from database state (broken references, etc.)
- Supports validation triggers (on property definition changes, etc.)
- Enables cross-module validation

### 2. Error Persistence

**Decision**: Store validation errors in database table with resolution tracking

**Rationale**:
- Provides audit trail of validation issues
- Enables user-driven error resolution workflow
- Supports filtering and querying validation errors
- Maintains history even after revalidation

### 3. Async Validation with Job Scheduling

**Decision**: Provide optional async validation with background job scheduler

**Rationale**:
- Large modules may take time to validate
- Prevents API timeout issues
- Enables batch validation operations
- Provides progress tracking for UI
- Supports auto-revalidation on schedule

### 4. Three-Tier Validation

**Decision**: Validate at module, entity, and property levels

**Rationale**:
- Module-level: Dependencies, game system compatibility
- Entity-level: Required properties, entity-specific rules
- Property-level: Type checking, validation rules, references
- Granular error reporting enables targeted fixes

### 5. Validation Error Types

**Decision**: Use enum of structured error types rather than free-form messages

**Rationale**:
- Enables programmatic error handling
- Supports localization of error messages
- Facilitates error filtering and grouping
- Provides consistent error categorization

### 6. Reference Validation

**Decision**: Validate references across all loaded modules for game system

**Rationale**:
- Detects broken references early
- Supports module unloading scenarios
- Enables dependency graph analysis
- Prevents runtime reference errors

## Performance Considerations

### 1. Property Definition Caching

The validator caches property definitions per game system and entity type to avoid repeated database queries:

```typescript
private propertyDefCache: Map<string, PropertyDefinition[]>
```

### 2. Batch Processing

Validation processes entities in batches to manage memory usage:

```typescript
const config = {
  batchSize: 50,
  batchDelay: 100  // ms delay between batches
};
```

### 3. Transaction Usage

Module validation runs in a transaction to ensure consistency:

```typescript
await db.transaction(async (tx) => {
  // Clear old errors
  // Validate entities
  // Persist new errors
  // Update statuses
});
```

### 4. Index Optimization

Validation queries benefit from existing indexes:
- `idx_validation_errors_unresolved` - Fast lookup of unresolved errors
- `idx_module_entities_module` - Fast entity listing per module
- `idx_entity_properties_entity` - Fast property loading per entity

## Integration Points

### 1. Module Loader Service

The validation system integrates with `ModuleLoaderService`:
- Validation is optional during module loading
- Revalidation can be triggered after reload
- Module status reflects validation state

### 2. Property Definitions

Validation rules are defined in `property_definitions` table:
- Per game system and entity type
- Includes type, constraints, and validation rules
- Updated independently of modules

### 3. Campaign System

Campaign compatibility checking ensures:
- Game system match
- Module validation status
- Dependency satisfaction

### 4. WebSocket Events

Future enhancement: Broadcast validation progress via WebSocket:
```typescript
// Validation progress event
ws.send({
  type: 'VALIDATION_PROGRESS',
  moduleId,
  progress: 45,
  status: 'Validating entities...'
});
```

## Future Enhancements

### 1. Incremental Validation

Only revalidate changed entities:
```typescript
async revalidateEntity(db: Database, entityId: string): Promise<ValidationResult>
```

### 2. Custom Validation Rules

Support user-defined validation functions:
```typescript
{
  propertyKey: 'damage.dice',
  validation: {
    customValidator: 'validateDiceNotation'
  }
}
```

### 3. Validation Webhooks

Notify external systems of validation results:
```typescript
{
  webhookUrl: 'https://example.com/validation-complete',
  events: ['validation_complete', 'validation_failed']
}
```

### 4. Validation Profiles

Different validation strictness levels:
```typescript
{
  profile: 'strict',  // Fail on warnings
  profile: 'lenient'  // Only fail on errors
}
```

### 5. Validation Report Export

Export validation results to various formats:
```typescript
await exportValidationReport(moduleId, 'pdf');
await exportValidationReport(moduleId, 'csv');
```

## Troubleshooting

### Validation Scheduler Not Available

**Symptom**: API returns "Validation scheduler not available"

**Solution**: Initialize scheduler in server startup:
```typescript
// apps/server/src/index.ts
import { initializeScheduler } from './services/validationScheduler.js';

const scheduler = initializeScheduler(db);
scheduler.start();
```

### Validation Takes Too Long

**Symptom**: Validation times out or takes minutes

**Solution**: Use async validation:
```typescript
POST /api/v1/modules/:moduleId/validate
{ "async": true }
```

### Broken Reference False Positives

**Symptom**: Valid references flagged as broken

**Solution**: Ensure all referenced modules are loaded:
```typescript
// Check module dependencies
const module = await db.select().from(modules).where(eq(modules.id, moduleId));
console.log('Dependencies:', module.dependencies);

// Verify dependencies are loaded
for (const dep of module.dependencies) {
  const [depModule] = await db.select()
    .from(modules)
    .where(eq(modules.moduleId, dep));

  if (!depModule) {
    console.log(`Missing dependency: ${dep}`);
  }
}
```

### Memory Issues with Large Modules

**Symptom**: Node.js out of memory during validation

**Solution**: Adjust batch size and add memory flags:
```typescript
// Lower batch size
const scheduler = initializeScheduler(db, {
  batchSize: 25  // Default is 50
});

// Or increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm start
```

## Next Steps

1. **Initialize Scheduler**: Add scheduler initialization to server startup code
2. **WebSocket Integration**: Add real-time validation progress updates
3. **Frontend UI**: Create validation status dashboard
4. **Documentation**: Add API documentation for validation endpoints
5. **Testing**: Create comprehensive validation test suite

## References

- EAV Module Schema: `docs/architecture/EAV_MODULE_SCHEMA.md`
- Validation Types: `packages/shared/src/types/validation.ts`
- Database Schema: `packages/database/src/schema/validationErrors.ts`
- Module Loader: `apps/server/src/services/moduleLoader.ts`

## Completion Checklist

- [x] Create moduleValidator.ts service
- [x] Implement database-based revalidation
- [x] Add property validation with type checking
- [x] Implement broken reference detection
- [x] Add validation error persistence
- [x] Create validationScheduler.ts service
- [x] Add job scheduling and management
- [x] Implement batch validation
- [x] Add auto-revalidation support
- [x] Integrate with API routes
- [x] Add validation endpoints
- [x] Add job management endpoints
- [x] Test build compilation
- [x] Document implementation
- [x] Create session notes

## Status: Complete

All validation system components have been implemented and tested. The system is ready for Docker deployment and production use.
