-- Add item_templates table
-- Item templates allow GMs to create custom item types for their campaigns
CREATE TABLE IF NOT EXISTS "item_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "campaign_id" uuid NOT NULL,
  "created_by" uuid NOT NULL,

  -- Template identity
  "system_id" text NOT NULL,
  "template_id" text NOT NULL,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "extends" text,

  -- Template definition (JSONB)
  "fields" jsonb DEFAULT '[]' NOT NULL,
  "computed_fields" jsonb DEFAULT '[]' NOT NULL,
  "sections" jsonb DEFAULT '[]' NOT NULL,
  "rolls" jsonb DEFAULT '[]' NOT NULL,
  "actions" jsonb DEFAULT '[]' NOT NULL,
  "physical" jsonb,
  "equippable" jsonb,
  "activation" jsonb,
  "consumes" jsonb,
  "effects" jsonb DEFAULT '[]' NOT NULL,
  "container" jsonb,

  -- Sharing
  "shared" boolean DEFAULT false NOT NULL,

  -- Metadata
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,

  -- Foreign key constraints
  CONSTRAINT "item_templates_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE,
  CONSTRAINT "item_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id"),

  -- Unique constraint on (campaign_id, template_id) to prevent duplicates
  CONSTRAINT "unique_template_per_campaign" UNIQUE ("campaign_id", "template_id")
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS "item_templates_campaign_id_idx" ON "item_templates" ("campaign_id");
CREATE INDEX IF NOT EXISTS "item_templates_system_id_idx" ON "item_templates" ("system_id");
CREATE INDEX IF NOT EXISTS "item_templates_category_idx" ON "item_templates" ("category");
CREATE INDEX IF NOT EXISTS "item_templates_shared_idx" ON "item_templates" ("shared");
