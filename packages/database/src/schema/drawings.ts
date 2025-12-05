import { pgTable, text, timestamp, uuid, real, integer, jsonb, boolean } from 'drizzle-orm/pg-core';
import { scenes } from './scenes.js';
import { users } from './users.js';

export const drawings = pgTable('drawings', {
  id: uuid('id').primaryKey().defaultRandom(),
  sceneId: uuid('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').references(() => users.id),
  // Drawing type: freehand, rectangle, circle, ellipse, polygon, text
  drawingType: text('drawing_type').notNull(),
  // Position and transform
  x: real('x').notNull().default(0),
  y: real('y').notNull().default(0),
  z: integer('z').notNull().default(0),
  rotation: real('rotation').notNull().default(0),
  // Shape data
  points: jsonb('points'), // Array of {x, y} for freehand/polygon
  width: real('width'),
  height: real('height'),
  radius: real('radius'),
  // Stroke properties
  strokeColor: text('stroke_color').notNull().default('#000000'),
  strokeWidth: real('stroke_width').notNull().default(2),
  strokeAlpha: real('stroke_alpha').notNull().default(1),
  // Fill properties
  fillColor: text('fill_color'),
  fillAlpha: real('fill_alpha').notNull().default(0.5),
  // Text properties
  text: text('text'),
  fontSize: integer('font_size'),
  fontFamily: text('font_family'),
  textColor: text('text_color'),
  // Visibility
  hidden: boolean('hidden').notNull().default(false),
  locked: boolean('locked').notNull().default(false),
  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
