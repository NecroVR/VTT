-- Migration to add VTT schema
-- This migration creates all the new tables for the VTT system

-- Create scenes table
CREATE TABLE IF NOT EXISTS "scenes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "game_id" uuid NOT NULL,
  "name" text NOT NULL,
  "active" boolean DEFAULT false NOT NULL,
  "background_image" text,
  "background_width" integer,
  "background_height" integer,
  "grid_type" text DEFAULT 'square' NOT NULL,
  "grid_size" integer DEFAULT 100 NOT NULL,
  "grid_color" text DEFAULT '#000000' NOT NULL,
  "grid_alpha" real DEFAULT 0.2 NOT NULL,
  "grid_distance" real DEFAULT 5 NOT NULL,
  "grid_units" text DEFAULT 'ft' NOT NULL,
  "token_vision" boolean DEFAULT true NOT NULL,
  "fog_exploration" boolean DEFAULT true NOT NULL,
  "global_light" boolean DEFAULT true NOT NULL,
  "darkness" real DEFAULT 0 NOT NULL,
  "initial_x" real,
  "initial_y" real,
  "initial_scale" real DEFAULT 1 NOT NULL,
  "nav_order" integer DEFAULT 0 NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "scenes_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE cascade
);

-- Create actors table
CREATE TABLE IF NOT EXISTS "actors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "game_id" uuid NOT NULL,
  "name" text NOT NULL,
  "actor_type" text NOT NULL,
  "img" text,
  "owner_id" uuid,
  "attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "abilities" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "folder_id" uuid,
  "sort" integer DEFAULT 0 NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "actors_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE cascade,
  CONSTRAINT "actors_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id")
);

-- Drop and recreate tokens table with new schema
DROP TABLE IF EXISTS "tokens" CASCADE;

CREATE TABLE "tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scene_id" uuid NOT NULL,
  "actor_id" uuid,
  "name" text NOT NULL,
  "image_url" text,
  "x" real DEFAULT 0 NOT NULL,
  "y" real DEFAULT 0 NOT NULL,
  "width" real DEFAULT 1 NOT NULL,
  "height" real DEFAULT 1 NOT NULL,
  "elevation" real DEFAULT 0 NOT NULL,
  "rotation" real DEFAULT 0 NOT NULL,
  "locked" boolean DEFAULT false NOT NULL,
  "owner_id" uuid,
  "visible" boolean DEFAULT true NOT NULL,
  "vision" boolean DEFAULT false NOT NULL,
  "vision_range" real DEFAULT 0 NOT NULL,
  "bars" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "light_bright" real DEFAULT 0 NOT NULL,
  "light_dim" real DEFAULT 0 NOT NULL,
  "light_color" text,
  "light_angle" real DEFAULT 360 NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "tokens_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE cascade,
  CONSTRAINT "tokens_actor_id_actors_id_fk" FOREIGN KEY ("actor_id") REFERENCES "actors"("id"),
  CONSTRAINT "tokens_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id")
);

-- Create walls table
CREATE TABLE IF NOT EXISTS "walls" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scene_id" uuid NOT NULL,
  "x1" real NOT NULL,
  "y1" real NOT NULL,
  "x2" real NOT NULL,
  "y2" real NOT NULL,
  "wall_type" text DEFAULT 'normal' NOT NULL,
  "move" text DEFAULT 'block' NOT NULL,
  "sense" text DEFAULT 'block' NOT NULL,
  "sound" text DEFAULT 'block' NOT NULL,
  "door" text DEFAULT 'none' NOT NULL,
  "door_state" text DEFAULT 'closed' NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "walls_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE cascade
);

-- Create ambient_lights table
CREATE TABLE IF NOT EXISTS "ambient_lights" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scene_id" uuid NOT NULL,
  "x" real NOT NULL,
  "y" real NOT NULL,
  "rotation" real DEFAULT 0 NOT NULL,
  "bright" real DEFAULT 20 NOT NULL,
  "dim" real DEFAULT 40 NOT NULL,
  "angle" real DEFAULT 360 NOT NULL,
  "color" text DEFAULT '#ffffff' NOT NULL,
  "alpha" real DEFAULT 0.5 NOT NULL,
  "animation_type" text,
  "animation_speed" integer DEFAULT 5 NOT NULL,
  "animation_intensity" integer DEFAULT 5 NOT NULL,
  "walls" boolean DEFAULT true NOT NULL,
  "vision" boolean DEFAULT false NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ambient_lights_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE cascade
);

-- Create items table
CREATE TABLE IF NOT EXISTS "items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "game_id" uuid NOT NULL,
  "actor_id" uuid,
  "name" text NOT NULL,
  "item_type" text NOT NULL,
  "img" text,
  "description" text,
  "quantity" integer DEFAULT 1 NOT NULL,
  "weight" real DEFAULT 0 NOT NULL,
  "price" real DEFAULT 0 NOT NULL,
  "equipped" boolean DEFAULT false NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "sort" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "items_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE cascade,
  CONSTRAINT "items_actor_id_actors_id_fk" FOREIGN KEY ("actor_id") REFERENCES "actors"("id") ON DELETE cascade
);

-- Create combats table
CREATE TABLE IF NOT EXISTS "combats" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scene_id" uuid,
  "game_id" uuid NOT NULL,
  "active" boolean DEFAULT false NOT NULL,
  "round" integer DEFAULT 0 NOT NULL,
  "turn" integer DEFAULT 0 NOT NULL,
  "sort" integer DEFAULT 0 NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "combats_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id"),
  CONSTRAINT "combats_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE cascade
);

-- Create combatants table
CREATE TABLE IF NOT EXISTS "combatants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "combat_id" uuid NOT NULL,
  "actor_id" uuid,
  "token_id" uuid,
  "initiative" real,
  "initiative_modifier" real DEFAULT 0 NOT NULL,
  "hidden" boolean DEFAULT false NOT NULL,
  "defeated" boolean DEFAULT false NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "combatants_combat_id_combats_id_fk" FOREIGN KEY ("combat_id") REFERENCES "combats"("id") ON DELETE cascade,
  CONSTRAINT "combatants_actor_id_actors_id_fk" FOREIGN KEY ("actor_id") REFERENCES "actors"("id"),
  CONSTRAINT "combatants_token_id_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "tokens"("id")
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "game_id" uuid NOT NULL,
  "user_id" uuid,
  "content" text NOT NULL,
  "message_type" text DEFAULT 'chat' NOT NULL,
  "speaker" jsonb,
  "roll_data" jsonb,
  "whisper_targets" jsonb,
  "blind" boolean DEFAULT false NOT NULL,
  "timestamp" timestamp DEFAULT now() NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  CONSTRAINT "chat_messages_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE cascade,
  CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id")
);
