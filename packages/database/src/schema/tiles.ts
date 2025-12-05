import { pgTable, text, timestamp, uuid, boolean, real, integer, jsonb } from 'drizzle-orm/pg-core';
import { scenes } from './scenes.js';

export const tiles = pgTable('tiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  sceneId: uuid('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
  img: text('img').notNull(),
  // Position and transform
  x: real('x').notNull().default(0),
  y: real('y').notNull().default(0),
  z: integer('z').notNull().default(0), // negative = background, positive = foreground
  width: real('width').notNull(),
  height: real('height').notNull(),
  rotation: real('rotation').notNull().default(0),
  // Visual properties
  tint: text('tint'),
  alpha: real('alpha').notNull().default(1),
  // State
  hidden: boolean('hidden').notNull().default(false),
  locked: boolean('locked').notNull().default(false),
  // Special tile types
  overhead: boolean('overhead').notNull().default(false),
  roof: boolean('roof').notNull().default(false), // auto-hide when token underneath
  // Occlusion settings
  occlusion: jsonb('occlusion'),
  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
