import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  gmUserIds: text('gm_user_ids').array().notNull().default([]),
  // Game system ID - references gameSystems.systemId
  // This field is immutable after creation (enforced at API level)
  gameSystemId: text('game_system_id'),
  settings: jsonb('settings').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
