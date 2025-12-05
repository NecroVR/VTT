import { pgTable, text, timestamp, uuid, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { games } from './games.js';
import { actors } from './actors.js';
import { tokens } from './tokens.js';
import { items } from './items.js';

export const activeEffects = pgTable('active_effects', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id').references(() => actors.id, { onDelete: 'cascade' }),
  tokenId: uuid('token_id').references(() => tokens.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon'),
  description: text('description'),
  // Effect type and duration
  effectType: text('effect_type').notNull().default('buff'),
  durationType: text('duration_type').notNull().default('permanent'),
  duration: integer('duration'),
  startRound: integer('start_round'),
  startTurn: integer('start_turn'),
  remaining: integer('remaining'),
  // Source tracking
  sourceActorId: uuid('source_actor_id').references(() => actors.id),
  sourceItemId: uuid('source_item_id').references(() => items.id),
  // Status and visibility
  enabled: boolean('enabled').notNull().default(true),
  hidden: boolean('hidden').notNull().default(false),
  // Effect data
  changes: jsonb('changes').notNull().default([]),
  priority: integer('priority').notNull().default(0),
  transfer: boolean('transfer').notNull().default(false),
  // Metadata
  data: jsonb('data').notNull().default({}),
  sort: integer('sort').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
