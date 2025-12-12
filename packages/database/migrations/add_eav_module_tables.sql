-- Add EAV Module System Tables
-- This migration adds the Entity-Attribute-Value (EAV) module system for flexible game content storage

-- ============================================================================
-- 1. MODULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "modules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,

  -- Module Identity
  "module_id" text NOT NULL,
  "game_system_id" text NOT NULL,
  "name" text NOT NULL,
  "version" text NOT NULL,
  "author" text,
  "author_user_id" uuid,
  "description" text,

  -- Module Type
  "module_type" text DEFAULT 'content' NOT NULL,

  -- Source Tracking
  "source_path" text,
  "source_hash" text,

  -- Dependencies
  "dependencies" text[] DEFAULT '{}',

  -- Validation Status
  "validation_status" text DEFAULT 'pending' NOT NULL,
  "validation_errors" jsonb DEFAULT '[]',
  "validated_at" timestamp,

  -- Status Flags
  "is_active" boolean DEFAULT true NOT NULL,
  "is_locked" boolean DEFAULT false NOT NULL,
  "is_official" boolean DEFAULT false NOT NULL,

  -- Metadata
  "data" jsonb DEFAULT '{}' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,

  -- Foreign key constraints
  CONSTRAINT "modules_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Indexes for modules
CREATE INDEX IF NOT EXISTS "idx_modules_game_system" ON "modules" ("game_system_id");
CREATE INDEX IF NOT EXISTS "idx_modules_validation_status" ON "modules" ("validation_status");

-- ============================================================================
-- 2. MODULE ENTITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "module_entities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "module_id" uuid NOT NULL,

  -- Entity Identity
  "entity_id" text NOT NULL,
  "entity_type" text NOT NULL,

  -- Basic Metadata
  "name" text NOT NULL,
  "description" text,
  "img" text,

  -- Template Reference
  "template_id" text,

  -- Source Tracking
  "source_path" text,
  "source_line_number" integer,

  -- Validation Status
  "validation_status" text DEFAULT 'pending' NOT NULL,
  "validation_errors" jsonb DEFAULT '[]',

  -- Full-text Search
  "search_text" text,
  "tags" text[],

  -- Organization
  "folder_id" text,
  "sort" integer DEFAULT 0 NOT NULL,

  -- Metadata
  "data" jsonb DEFAULT '{}' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,

  -- Foreign key constraints
  CONSTRAINT "module_entities_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE
);

-- Indexes for module_entities
CREATE INDEX IF NOT EXISTS "idx_module_entities_module" ON "module_entities" ("module_id");
CREATE INDEX IF NOT EXISTS "idx_module_entities_type" ON "module_entities" ("entity_type");
CREATE INDEX IF NOT EXISTS "idx_module_entities_search" ON "module_entities" USING gin (to_tsvector('english', "search_text"));

-- ============================================================================
-- 3. ENTITY PROPERTIES TABLE (EAV CORE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "entity_properties" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "entity_id" uuid NOT NULL,

  -- Property Key (supports dot notation)
  "property_key" text NOT NULL,
  "property_path" text[],
  "property_depth" integer DEFAULT 0 NOT NULL,

  -- Value Storage (only one populated based on value_type)
  "value_type" text NOT NULL,
  "value_string" text,
  "value_number" real,
  "value_integer" integer,
  "value_boolean" boolean,
  "value_json" jsonb,
  "value_reference" text,

  -- Array Support
  "array_index" integer,
  "is_array_element" boolean DEFAULT false NOT NULL,

  -- Metadata
  "sort" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,

  -- Foreign key constraints
  CONSTRAINT "entity_properties_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "module_entities"("id") ON DELETE CASCADE
);

-- Indexes for entity_properties
CREATE INDEX IF NOT EXISTS "idx_entity_properties_entity" ON "entity_properties" ("entity_id");
CREATE INDEX IF NOT EXISTS "idx_entity_properties_key" ON "entity_properties" ("property_key");
CREATE INDEX IF NOT EXISTS "idx_entity_properties_path" ON "entity_properties" USING gin ("property_path");

-- ============================================================================
-- 4. PROPERTY DEFINITIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "property_definitions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,

  -- Scope
  "game_system_id" text NOT NULL,
  "entity_type" text NOT NULL,

  -- Property Definition
  "property_key" text NOT NULL,
  "property_path" text[],
  "name" text NOT NULL,
  "description" text,

  -- Type Constraints
  "value_type" text NOT NULL,
  "is_required" boolean DEFAULT false NOT NULL,
  "is_array" boolean DEFAULT false NOT NULL,

  -- Validation Rules
  "validation" jsonb DEFAULT '{}',
  "default_value" jsonb,
  "options" jsonb DEFAULT '[]',

  -- UI Hints
  "field_type" text,
  "placeholder" text,
  "section" text,
  "sort" integer DEFAULT 0 NOT NULL,

  -- Metadata
  "data" jsonb DEFAULT '{}' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- 5. VALIDATION ERRORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "validation_errors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,

  -- References
  "module_id" uuid NOT NULL,
  "entity_id" uuid,

  -- Error Details
  "error_type" text NOT NULL,
  "severity" text DEFAULT 'error' NOT NULL,
  "property_key" text,
  "message" text NOT NULL,
  "details" jsonb DEFAULT '{}',

  -- Source Location
  "source_path" text,
  "source_line_number" integer,
  "source_column" integer,

  -- Resolution Tracking
  "is_resolved" boolean DEFAULT false NOT NULL,
  "resolved_at" timestamp,
  "resolved_by" uuid,
  "resolution_note" text,

  -- Metadata
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,

  -- Foreign key constraints
  CONSTRAINT "validation_errors_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE,
  CONSTRAINT "validation_errors_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "module_entities"("id") ON DELETE CASCADE
);

-- Indexes for validation_errors
CREATE INDEX IF NOT EXISTS "idx_validation_errors_unresolved" ON "validation_errors" ("module_id", "is_resolved");

-- ============================================================================
-- 6. CAMPAIGN MODULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "campaign_modules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "campaign_id" uuid NOT NULL,
  "module_id" uuid NOT NULL,

  -- Load Order
  "load_order" integer DEFAULT 0 NOT NULL,

  -- Status
  "is_active" boolean DEFAULT true NOT NULL,

  -- Override Settings
  "overrides" jsonb DEFAULT '{}',

  -- Metadata
  "added_at" timestamp DEFAULT now() NOT NULL,
  "added_by" uuid,
  "data" jsonb DEFAULT '{}' NOT NULL,

  -- Foreign key constraints
  CONSTRAINT "campaign_modules_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE,
  CONSTRAINT "campaign_modules_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE
);

-- Indexes for campaign_modules
CREATE INDEX IF NOT EXISTS "idx_campaign_modules_campaign" ON "campaign_modules" ("campaign_id");
