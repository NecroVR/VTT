-- Add form_versions table for version history tracking
-- Stores historical versions of forms for rollback and comparison

CREATE TABLE IF NOT EXISTS "form_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "form_id" uuid NOT NULL REFERENCES "forms"("id") ON DELETE CASCADE,
  "version" integer NOT NULL,
  "layout" jsonb NOT NULL DEFAULT '[]',
  "fragments" jsonb DEFAULT '[]',
  "computed_fields" jsonb DEFAULT '[]',
  "styles" jsonb DEFAULT '{}',
  "scripts" jsonb DEFAULT '[]',
  "change_notes" text,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE("form_id", "version")
);

-- Add index on form_id for faster version history lookups
CREATE INDEX IF NOT EXISTS "form_versions_form_id_idx" ON "form_versions" ("form_id");

-- Add index on created_at for chronological ordering
CREATE INDEX IF NOT EXISTS "form_versions_created_at_idx" ON "form_versions" ("created_at");
