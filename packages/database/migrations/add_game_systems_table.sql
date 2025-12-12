-- Add game_systems table
-- Game systems define the rules and mechanics for different tabletop RPG systems
CREATE TABLE IF NOT EXISTS "game_systems" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "system_id" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "version" text NOT NULL,
  "publisher" text,
  "description" text,
  "type" text NOT NULL,
  "manifest_path" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add index on system_id for faster lookups
CREATE INDEX IF NOT EXISTS "game_systems_system_id_idx" ON "game_systems" ("system_id");

-- Add index on is_active for filtering active systems
CREATE INDEX IF NOT EXISTS "game_systems_is_active_idx" ON "game_systems" ("is_active");

-- Add game_system_id column to campaigns table
-- This field is immutable after creation (enforced at API level)
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "game_system_id" text;

-- Add index on game_system_id for faster lookups
CREATE INDEX IF NOT EXISTS "campaigns_game_system_id_idx" ON "campaigns" ("game_system_id");
