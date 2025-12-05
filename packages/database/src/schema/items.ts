import { pgTable, text, timestamp, uuid, integer, real, boolean, jsonb } from 'drizzle-orm/pg-core';
import { games } from './games.js';
import { actors } from './actors.js';

export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id').references(() => actors.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  itemType: text('item_type').notNull(),
  img: text('img'),
  // Core properties
  description: text('description'),
  quantity: integer('quantity').notNull().default(1),
  weight: real('weight').notNull().default(0),
  price: real('price').notNull().default(0),
  equipped: boolean('equipped').notNull().default(false),
  // Metadata
  data: jsonb('data').notNull().default({}),
  sort: integer('sort').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
