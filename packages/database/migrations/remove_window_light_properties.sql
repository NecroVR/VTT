-- Remove window light properties (opacity, tint, tintIntensity)
-- Windows no longer interact with light, they only block token movement
ALTER TABLE windows
DROP COLUMN IF EXISTS opacity,
DROP COLUMN IF EXISTS tint,
DROP COLUMN IF EXISTS tint_intensity;
