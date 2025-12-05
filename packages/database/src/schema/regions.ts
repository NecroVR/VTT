import { pgTable, text, timestamp, uuid, boolean, real, jsonb } from 'drizzle-orm/pg-core';
import { scenes } from './scenes.js';

export const regions = pgTable('regions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sceneId: uuid('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  // Shape definition
  shape: text('shape').notNull().default('rectangle'), // rectangle, circle, ellipse, polygon
  x: real('x').notNull(),
  y: real('y').notNull(),
  // Shape dimensions (varies by shape type)
  width: real('width'), // for rectangle
  height: real('height'), // for rectangle
  radius: real('radius'), // for circle
  points: jsonb('points'), // for polygon: array of {x, y}
  // Visual properties
  color: text('color').notNull().default('#ff0000'),
  alpha: real('alpha').notNull().default(0.3),
  // State
  hidden: boolean('hidden').notNull().default(true), // GM-only visibility by default
  locked: boolean('locked').notNull().default(false),
  // Trigger configuration
  triggerType: text('trigger_type'), // enter, exit, click
  triggerAction: text('trigger_action'), // show_journal, play_sound, custom
  triggerData: jsonb('trigger_data'), // data for trigger actions
  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
