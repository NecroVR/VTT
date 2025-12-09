-- Add gridWidth and gridHeight columns to scenes table
ALTER TABLE scenes
ADD COLUMN IF NOT EXISTS grid_width integer DEFAULT 100 NOT NULL,
ADD COLUMN IF NOT EXISTS grid_height integer DEFAULT 100 NOT NULL;
