-- Rename games table to campaigns and update all foreign key references

-- Rename the main table
ALTER TABLE "games" RENAME TO "campaigns";

-- Rename foreign key columns in dependent tables
ALTER TABLE "scenes" RENAME COLUMN "game_id" TO "campaign_id";
ALTER TABLE "actors" RENAME COLUMN "game_id" TO "campaign_id";
ALTER TABLE "combats" RENAME COLUMN "game_id" TO "campaign_id";
ALTER TABLE "chat_messages" RENAME COLUMN "game_id" TO "campaign_id";
ALTER TABLE "active_effects" RENAME COLUMN "game_id" TO "campaign_id";
ALTER TABLE "items" RENAME COLUMN "game_id" TO "campaign_id";
ALTER TABLE "assets" RENAME COLUMN "game_id" TO "campaign_id";
ALTER TABLE "compendiums" RENAME COLUMN "game_id" TO "campaign_id";
ALTER TABLE "folders" RENAME COLUMN "game_id" TO "campaign_id";
ALTER TABLE "journals" RENAME COLUMN "game_id" TO "campaign_id";
