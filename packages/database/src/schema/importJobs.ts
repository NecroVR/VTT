import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
import { importSources } from './importSources.js';

export const importJobs = pgTable('import_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sourceId: uuid('source_id').references(() => importSources.id, { onDelete: 'set null' }),
  sourceType: text('source_type').notNull(),
  status: text('status').notNull().default('pending'),
  contentType: text('content_type').notNull(),
  totalItems: integer('total_items').notNull().default(0),
  processedItems: integer('processed_items').notNull().default(0),
  failedItems: integer('failed_items').notNull().default(0),
  errors: jsonb('errors').$type<Array<{itemName: string; error: string}>>().default(sql`'[]'::jsonb`),
  rawData: jsonb('raw_data'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
