-- Add tokenSize column to actors table
ALTER TABLE "actors" ADD COLUMN "token_size" integer DEFAULT 1 NOT NULL;
