# Session Notes: Form Designer Database Schema

**Date**: 2025-12-12
**Session ID**: 0079
**Topic**: Database Schema for Form Designer System

---

## Session Summary

Created the complete database schema for the Form Designer System, including Drizzle ORM schema definitions and SQL migration files. This establishes the foundation for a dynamic, marketplace-enabled form rendering system that allows customization of entity sheets (actors, items, etc.) in the VTT.

---

## Problems Addressed

### Requirements
- Need database schema for storing form templates
- Support for marketplace features (licensing, pricing)
- Campaign-level form customization with priority resolution
- Proper indexing for performance
- Follow existing VTT schema patterns

---

## Solutions Implemented

### 1. Forms Schema (`forms.ts`)

Created the main forms table with:

**Identity & System Association**:
- `id`: UUID primary key
- `name`, `description`: Basic metadata
- `game_system_id`: Links to game system (e.g., "dnd5e")
- `entity_type`: Type of entity this form renders ("actor", "item", etc.)
- `version`: Semantic versioning for form templates

**Form Definition (JSONB Fields)**:
- `layout`: Top-level layout structure defining the form's visual organization
- `fragments`: Reusable form fragments (like components)
- `styles`: CSS/styling definitions
- `computed_fields`: Definitions for calculated fields
- `scripts`: JavaScript/behavior scripts for interactivity

**Control Flags**:
- `is_default`: Whether this is the default form for its entity type
- `is_locked`: Prevents editing (for official/published forms)

**Marketplace Features**:
- `visibility`: 'private', 'public', or 'unlisted'
- `license_type`: 'free', 'premium', or 'subscription'
- `price`: Numeric field for pricing (USD)
- `owner_id`: Foreign key to users table

**Indexes**:
- `game_system_id` - Fast filtering by game system
- `entity_type` - Fast filtering by entity type
- `owner_id` - Fast lookup of user's forms
- `visibility` - Marketplace filtering

### 2. Form Licenses Schema (`formLicenses.ts`)

Created the form_licenses table for tracking purchases:

**Core Fields**:
- `form_id`: Reference to forms table
- `user_id`: User who owns the license
- `license_type`: Type of license granted
- `granted_at`, `expires_at`: License validity period
- `payment_id`, `subscription_id`: Payment processor references

**Features**:
- Unique constraint on (form_id, user_id) - one license per user per form
- Cascade delete when form or user is deleted
- Indexed for fast license lookups

### 3. Campaign Forms Schema (`campaignForms.ts`)

Created the campaign_forms table for mapping forms to campaigns:

**Core Fields**:
- `campaign_id`: Reference to campaigns table
- `form_id`: Reference to forms table
- `entity_type`: What entity type this form applies to
- `priority`: Integer for resolution order (higher = more priority)

**Features**:
- Unique constraint on (campaign_id, form_id) - prevent duplicate assignments
- Compound index on (campaign_id, entity_type) - fast form resolution
- Cascade delete when campaign or form is deleted

### 4. SQL Migration (`0002_add_form_designer_tables.sql`)

Created comprehensive migration with:
- All three table definitions
- Foreign key constraints with cascade deletes
- All indexes for performance
- Unique constraints for data integrity
- Proper default values

---

## Files Created

### Schema Definitions
1. **`/packages/database/src/schema/forms.ts`**
   - Forms table with full marketplace support
   - JSONB fields for flexible form definitions
   - Comprehensive indexing strategy

2. **`/packages/database/src/schema/formLicenses.ts`**
   - License tracking for premium forms
   - Payment integration fields
   - Unique constraint enforcement

3. **`/packages/database/src/schema/campaignForms.ts`**
   - Campaign-form mappings
   - Priority-based resolution
   - Entity type filtering

### Migration Files
4. **`/packages/database/drizzle/0002_add_form_designer_tables.sql`**
   - Complete SQL migration
   - 3 new tables
   - 6 foreign key constraints
   - 10 indexes
   - 2 unique constraints

### Schema Exports
5. **`/packages/database/src/schema/index.ts`** (updated)
   - Added exports for all new schemas

---

## Schema Design Patterns Followed

### Drizzle ORM Patterns
```typescript
// UUID primary keys with random defaults
id: uuid('id').primaryKey().defaultRandom()

// Timestamps with automatic defaults
createdAt: timestamp('created_at').defaultNow().notNull()

// JSONB with empty object defaults
layout: jsonb('layout').notNull().default({})

// Foreign keys with cascade deletes
ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' })

// Indexes for performance
(table) => ({
  gameSystemIdx: index('idx_forms_game_system').on(table.gameSystemId),
})
```

### SQL Migration Patterns
```sql
-- Table creation with proper types
CREATE TABLE "forms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  ...
);

-- Foreign key constraints
ALTER TABLE "forms" ADD CONSTRAINT "forms_owner_id_users_id_fk"
  FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id")
  ON DELETE cascade ON UPDATE no action;

-- Indexes for performance
CREATE INDEX "idx_forms_game_system" ON "forms" USING btree ("game_system_id");

-- Unique constraints
ALTER TABLE "form_licenses" ADD CONSTRAINT "unq_form_licenses_form_user"
  UNIQUE("form_id","user_id");
```

---

## Database Schema Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FORMS TABLE                             │
├─────────────────────────────────────────────────────────────────┤
│ Primary Key: id (uuid)                                          │
│ Foreign Keys: owner_id → users.id                               │
│ Indexes: game_system_id, entity_type, owner_id, visibility      │
│                                                                 │
│ Core Fields:                                                    │
│ - name, description, version                                    │
│ - game_system_id, entity_type                                   │
│                                                                 │
│ Form Definition (JSONB):                                        │
│ - layout, fragments, styles, computed_fields, scripts           │
│                                                                 │
│ Marketplace:                                                    │
│ - visibility, license_type, price                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ form_id (FK)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FORM_LICENSES TABLE                         │
├─────────────────────────────────────────────────────────────────┤
│ Primary Key: id (uuid)                                          │
│ Foreign Keys: form_id → forms.id, user_id → users.id            │
│ Unique: (form_id, user_id)                                      │
│ Indexes: form_id, user_id                                       │
│                                                                 │
│ Tracks user purchases/licenses for premium forms                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    CAMPAIGN_FORMS TABLE                         │
├─────────────────────────────────────────────────────────────────┤
│ Primary Key: id (uuid)                                          │
│ Foreign Keys: campaign_id → campaigns.id, form_id → forms.id    │
│ Unique: (campaign_id, form_id)                                  │
│ Indexes: campaign_id, (campaign_id, entity_type)                │
│                                                                 │
│ Maps forms to campaigns with priority resolution                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing & Verification

### TypeScript Compilation
```bash
cd packages/database
pnpm build
```
✅ **Result**: No TypeScript errors - all schema files compile successfully

### Schema Validation
- All foreign key references are valid
- All indexes follow naming conventions
- JSONB defaults are properly formatted
- Cascade behaviors are appropriate

---

## Form Resolution Algorithm

The schema supports this form resolution flow:

1. **Check Campaign Forms**: Look for forms assigned to the current campaign for the entity type
2. **Sort by Priority**: Order by `priority` field (higher = more important)
3. **Check License**: If form is premium, verify user has license in `form_licenses`
4. **Check Default**: If no campaign forms, use form where `is_default = true`
5. **Fallback**: System-provided default form

This allows:
- Campaign-specific customization
- Priority-based overrides
- Marketplace premium forms
- Graceful fallback to defaults

---

## Next Steps

### Immediate (Not Yet Complete)
1. **Run Migration**: Apply the migration to the database
   ```bash
   cd packages/database
   DATABASE_URL=postgresql://claude:Claude^YV18@localhost:5432/vtt pnpm db:migrate
   ```

2. **Verify Tables Created**: Check that all tables and indexes were created
   ```bash
   psql -U claude -d vtt -h localhost -p 5433
   \dt form*
   \d forms
   \d form_licenses
   \d campaign_forms
   ```

### Backend Implementation
3. **Form Service**: Create service layer for form CRUD operations
4. **Form API Routes**: REST endpoints for form management
5. **License Service**: Handle license validation and purchases
6. **Form Resolution Logic**: Implement the priority-based resolution algorithm

### Frontend Implementation
7. **Form Designer UI**: Visual editor for creating/editing forms
8. **Form Marketplace**: Browse and purchase community forms
9. **Campaign Form Manager**: Assign forms to campaigns
10. **Dynamic Form Renderer**: Render entities using form definitions

---

## Key Decisions & Rationale

### JSONB for Form Definitions
**Decision**: Store layout, fragments, styles, etc. as JSONB
**Rationale**:
- Flexible schema - can evolve without migrations
- PostgreSQL has excellent JSONB indexing and querying
- Follows pattern used in existing VTT schemas (data, settings fields)
- Allows complex nested structures

### Marketplace Integration
**Decision**: Include visibility, license_type, price fields directly in forms table
**Rationale**:
- Simple and efficient - no extra joins for marketplace filtering
- Common query pattern (filter public forms)
- Easy to add more marketplace fields later

### Priority-Based Resolution
**Decision**: Use integer priority field in campaign_forms
**Rationale**:
- Simple and flexible - can insert forms between existing ones
- Natural sorting - higher numbers = higher priority
- Allows fine-grained control over form resolution order

### Cascade Deletes
**Decision**: Cascade delete on all foreign keys
**Rationale**:
- User deleted → their forms should be deleted
- Form deleted → licenses and campaign assignments should be deleted
- Campaign deleted → form assignments should be deleted
- Maintains referential integrity automatically

---

## Current Status

✅ **Complete**:
- All three schema files created
- Schema exports updated
- SQL migration file created
- TypeScript compilation verified
- Session notes documented

⏳ **Pending**:
- Migration not yet applied to database
- No service layer implementation
- No API routes
- No frontend components

---

## Notes for Next Session

### Before Starting Implementation
1. Apply the migration to the database
2. Verify all tables and indexes created correctly
3. Test cascade deletes with sample data

### Implementation Approach
1. Start with Form Service (backend/src/services/forms.ts)
2. Add Form API routes (backend/src/routes/forms.ts)
3. Implement form resolution logic
4. Create basic Form Designer UI
5. Build form renderer that uses the layout/fragments

### Key Considerations
- Form versioning strategy (when to increment version)
- Migration path for existing entity data
- Security: who can publish to marketplace
- Validation: ensure form definitions are valid before saving
- Performance: cache resolved forms per campaign

---

**Session Complete**: Database schema foundation for Form Designer System is ready.
