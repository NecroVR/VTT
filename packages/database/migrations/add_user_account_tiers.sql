-- Add account tier and storage quota fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_tier TEXT NOT NULL DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS storage_quota_bytes BIGINT NOT NULL DEFAULT 104857600,
ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT NOT NULL DEFAULT 0;

-- Add index on account tier for faster queries
CREATE INDEX IF NOT EXISTS idx_users_account_tier ON users(account_tier);
