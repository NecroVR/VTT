-- Add doors table
-- Doors are separate from walls and represent openable barriers in the scene
CREATE TABLE IF NOT EXISTS "doors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scene_id" uuid NOT NULL,
  "x1" real NOT NULL,
  "y1" real NOT NULL,
  "x2" real NOT NULL,
  "y2" real NOT NULL,
  "wall_shape" text DEFAULT 'straight' NOT NULL,
  "control_points" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" text DEFAULT 'closed' NOT NULL,
  "is_locked" boolean DEFAULT false NOT NULL,
  "snap_to_grid" boolean DEFAULT true NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint for scene_id
ALTER TABLE "doors" ADD CONSTRAINT "doors_scene_id_scenes_id_fk"
FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;

-- Add index on scene_id for faster lookups
CREATE INDEX IF NOT EXISTS "doors_scene_id_idx" ON "doors" ("scene_id");

-- Add check constraint for status values
ALTER TABLE "doors" ADD CONSTRAINT "doors_status_check"
CHECK ("status" IN ('open', 'closed', 'broken'));
