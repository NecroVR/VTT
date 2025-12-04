import { pgTable, timestamp, uuid, boolean, integer, real, jsonb } from 'drizzle-orm/pg-core';
import { games } from './games';
import { scenes } from './scenes';
import { actors } from './actors';
import { tokens } from './tokens';

export const combats = pgTable('combats', {
  id: uuid('id').primaryKey().defaultRandom(),
  sceneId: uuid('scene_id').references(() => scenes.id),
  gameId: uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  active: boolean('active').notNull().default(false),
  round: integer('round').notNull().default(0),
  turn: integer('turn').notNull().default(0),
  sort: integer('sort').notNull().default(0),
  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const combatants = pgTable('combatants', {
  id: uuid('id').primaryKey().defaultRandom(),
  combatId: uuid('combat_id').notNull().references(() => combats.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id').references(() => actors.id),
  tokenId: uuid('token_id').references(() => tokens.id),
  // Initiative
  initiative: real('initiative'),
  initiativeModifier: real('initiative_modifier').notNull().default(0),
  // State
  hidden: boolean('hidden').notNull().default(false),
  defeated: boolean('defeated').notNull().default(false),
  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
