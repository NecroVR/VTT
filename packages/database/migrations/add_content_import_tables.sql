-- Add Content Import System Tables
-- This migration adds support for importing content from multiple sources (Foundry VTT, D&D Beyond, etc.)

-- ============================================================================
-- 1. IMPORT SOURCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "import_sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "source_type" text NOT NULL,  -- 'foundryvtt', 'dndbeyond', 'manual'
  "source_name" text NOT NULL,
  "source_version" text,
  "content_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "item_count" integer DEFAULT 0 NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "imported_at" timestamp DEFAULT now() NOT NULL,
  "last_sync_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,

  -- Foreign key constraints
  CONSTRAINT "import_sources_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Indexes for import_sources
CREATE INDEX IF NOT EXISTS "idx_import_sources_user" ON "import_sources" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_import_sources_type" ON "import_sources" ("source_type");

-- ============================================================================
-- 2. IMPORT JOBS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "import_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "source_id" uuid,
  "source_type" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "content_type" text NOT NULL,
  "total_items" integer DEFAULT 0 NOT NULL,
  "processed_items" integer DEFAULT 0 NOT NULL,
  "failed_items" integer DEFAULT 0 NOT NULL,
  "errors" jsonb DEFAULT '[]'::jsonb,
  "raw_data" jsonb,
  "started_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,

  -- Foreign key constraints
  CONSTRAINT "import_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "import_jobs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "import_sources"("id") ON DELETE SET NULL
);

-- Indexes for import_jobs
CREATE INDEX IF NOT EXISTS "idx_import_jobs_user" ON "import_jobs" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_import_jobs_source" ON "import_jobs" ("source_id");
CREATE INDEX IF NOT EXISTS "idx_import_jobs_status" ON "import_jobs" ("status");

-- ============================================================================
-- 3. ALTER MODULE ENTITIES - ADD SOURCE TRACKING COLUMNS
-- ============================================================================
-- Add columns for tracking imported content sources
ALTER TABLE "module_entities" ADD COLUMN IF NOT EXISTS "source_type" text;
ALTER TABLE "module_entities" ADD COLUMN IF NOT EXISTS "source_id" text;
ALTER TABLE "module_entities" ADD COLUMN IF NOT EXISTS "source_url" text;

-- Add index for source lookups
CREATE INDEX IF NOT EXISTS "idx_module_entities_source" ON "module_entities" ("source_type", "source_id");
