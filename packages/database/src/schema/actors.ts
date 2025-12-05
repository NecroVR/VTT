import { pgTable, text, timestamp, uuid, integer, jsonb } from 'drizzle-orm/pg-core';
import { games } from './games.js';
import { users } from './users.js';

export const actors = pgTable('actors', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  actorType: text('actor_type').notNull(),
  img: text('img'),
  // Ownership
  ownerId: uuid('owner_id').references(() => users.id),
  // Core attributes (system-agnostic)
  attributes: jsonb('attributes').notNull().default({}),
  abilities: jsonb('abilities').notNull().default({}),
  // Organization
  folderId: uuid('folder_id'),
  sort: integer('sort').notNull().default(0),
  // Token configuration
  tokenSize: integer('token_size').notNull().default(1),
  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
