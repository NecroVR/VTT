-- Add tiles table
CREATE TABLE IF NOT EXISTS "tiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scene_id" uuid NOT NULL,
  "img" text NOT NULL,
  "x" real DEFAULT 0 NOT NULL,
  "y" real DEFAULT 0 NOT NULL,
  "z" integer DEFAULT 0 NOT NULL,
  "width" real NOT NULL,
  "height" real NOT NULL,
  "rotation" real DEFAULT 0 NOT NULL,
  "tint" text,
  "alpha" real DEFAULT 1 NOT NULL,
  "hidden" boolean DEFAULT false NOT NULL,
  "locked" boolean DEFAULT false NOT NULL,
  "overhead" boolean DEFAULT false NOT NULL,
  "roof" boolean DEFAULT false NOT NULL,
  "occlusion" jsonb,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add tiles foreign key
ALTER TABLE "tiles" ADD CONSTRAINT "tiles_scene_id_scenes_id_fk"
FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;

-- Add regions table
CREATE TABLE IF NOT EXISTS "regions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scene_id" uuid NOT NULL,
  "name" text NOT NULL,
  "shape" text DEFAULT 'rectangle' NOT NULL,
  "x" real NOT NULL,
  "y" real NOT NULL,
  "width" real,
  "height" real,
  "radius" real,
  "points" jsonb,
  "color" text DEFAULT '#ff0000' NOT NULL,
  "alpha" real DEFAULT 0.3 NOT NULL,
  "hidden" boolean DEFAULT true NOT NULL,
  "locked" boolean DEFAULT false NOT NULL,
  "trigger_type" text,
  "trigger_action" text,
  "trigger_data" jsonb,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add regions foreign key
ALTER TABLE "regions" ADD CONSTRAINT "regions_scene_id_scenes_id_fk"
FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;

-- Add scene_pins table
CREATE TABLE IF NOT EXISTS "scene_pins" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scene_id" uuid NOT NULL,
  "x" real NOT NULL,
  "y" real NOT NULL,
  "icon" text,
  "icon_size" integer DEFAULT 40 NOT NULL,
  "icon_tint" text,
  "text" text,
  "font_size" integer DEFAULT 24 NOT NULL,
  "text_anchor" text DEFAULT 'bottom' NOT NULL,
  "text_color" text DEFAULT '#ffffff' NOT NULL,
  "journal_id" uuid,
  "page_id" uuid,
  "global" boolean DEFAULT false NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add scene_pins foreign keys
ALTER TABLE "scene_pins" ADD CONSTRAINT "scene_pins_scene_id_scenes_id_fk"
FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "scene_pins" ADD CONSTRAINT "scene_pins_journal_id_journals_id_fk"
FOREIGN KEY ("journal_id") REFERENCES "public"."journals"("id") ON DELETE set null ON UPDATE no action;
