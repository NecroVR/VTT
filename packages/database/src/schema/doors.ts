import { pgTable, text, timestamp, uuid, real, jsonb, boolean } from 'drizzle-orm/pg-core';
import { scenes } from './scenes.js';

export const doors = pgTable('doors', {
  id: uuid('id').primaryKey().defaultRandom(),
  sceneId: uuid('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
  // Coordinates (line from point A to B)
  x1: real('x1').notNull(),
  y1: real('y1').notNull(),
  x2: real('x2').notNull(),
  y2: real('y2').notNull(),
  // Wall shape and curve control
  wallShape: text('wall_shape').notNull().default('straight'),
  controlPoints: jsonb('control_points').notNull().default('[]'),
  // Door-specific properties
  status: text('status').notNull().default('closed'),
  isLocked: boolean('is_locked').notNull().default(false),
  // Grid snapping
  snapToGrid: boolean('snap_to_grid').notNull().default(true),
  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
