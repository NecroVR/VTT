-- Add gridOffsetX and gridOffsetY columns to scenes table
ALTER TABLE scenes
ADD COLUMN IF NOT EXISTS grid_offset_x real DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS grid_offset_y real DEFAULT 0 NOT NULL;
