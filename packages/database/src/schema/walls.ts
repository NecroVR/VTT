import { pgTable, text, timestamp, uuid, real, jsonb } from 'drizzle-orm/pg-core';
import { scenes } from './scenes.js';

export const walls = pgTable('walls', {
  id: uuid('id').primaryKey().defaultRandom(),
  sceneId: uuid('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
  // Coordinates (line from point A to B)
  x1: real('x1').notNull(),
  y1: real('y1').notNull(),
  x2: real('x2').notNull(),
  y2: real('y2').notNull(),
  // Wall properties
  wallType: text('wall_type').notNull().default('normal'),
  move: text('move').notNull().default('block'),
  sense: text('sense').notNull().default('block'),
  sound: text('sound').notNull().default('block'),
  // Door properties
  door: text('door').notNull().default('none'),
  doorState: text('door_state').notNull().default('closed'),
  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
