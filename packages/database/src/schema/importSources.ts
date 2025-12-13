import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';

export const importSources = pgTable('import_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sourceType: text('source_type').notNull(),  // 'foundryvtt', 'dndbeyond', 'manual'
  sourceName: text('source_name').notNull(),
  sourceVersion: text('source_version'),
  contentTypes: jsonb('content_types').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  itemCount: integer('item_count').notNull().default(0),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
  importedAt: timestamp('imported_at').notNull().defaultNow(),
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
