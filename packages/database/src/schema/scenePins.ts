import { pgTable, text, timestamp, uuid, boolean, real, integer, jsonb } from 'drizzle-orm/pg-core';
import { scenes } from './scenes.js';
import { journals } from './journals.js';

export const scenePins = pgTable('scene_pins', {
  id: uuid('id').primaryKey().defaultRandom(),
  sceneId: uuid('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
  // Position
  x: real('x').notNull(),
  y: real('y').notNull(),
  // Icon properties
  icon: text('icon'), // icon URL
  iconSize: integer('icon_size').notNull().default(40),
  iconTint: text('icon_tint'), // optional color tint
  // Text properties
  text: text('text'),
  fontSize: integer('font_size').notNull().default(24),
  textAnchor: text('text_anchor').notNull().default('bottom'), // top, bottom, left, right
  textColor: text('text_color').notNull().default('#ffffff'),
  // Link to journal
  journalId: uuid('journal_id').references(() => journals.id, { onDelete: 'set null' }),
  pageId: uuid('page_id'), // optional specific page
  // State
  global: boolean('global').notNull().default(false), // show on all scenes
  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
