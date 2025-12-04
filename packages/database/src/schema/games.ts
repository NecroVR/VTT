import { pgTable, text, timestamp, uuid, jsonb, boolean, real } from 'drizzle-orm/pg-core';
import { users } from './users';

export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  settings: jsonb('settings').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tokens = pgTable('tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  imageUrl: text('image_url'),
  x: real('x').notNull().default(0),
  y: real('y').notNull().default(0),
  width: real('width').notNull().default(1),
  height: real('height').notNull().default(1),
  ownerId: uuid('owner_id').references(() => users.id),
  visible: boolean('visible').notNull().default(true),
  data: jsonb('data').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
