import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';

export const gameSystems = pgTable('game_systems', {
  id: uuid('id').primaryKey().defaultRandom(),
  systemId: text('system_id').notNull().unique(),
  name: text('name').notNull(),
  version: text('version').notNull(),
  publisher: text('publisher'),
  description: text('description'),
  type: text('type').notNull(),
  manifestPath: text('manifest_path'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
