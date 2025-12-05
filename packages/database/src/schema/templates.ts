import { pgTable, text, timestamp, uuid, boolean, real, jsonb } from 'drizzle-orm/pg-core';
import { scenes } from './scenes.js';
import { users } from './users.js';

export const measurementTemplates = pgTable('measurement_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  sceneId: uuid('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
  templateType: text('template_type').notNull(), // circle, cone, ray, rectangle
  // Position
  x: real('x').notNull(),
  y: real('y').notNull(),
  // Size and direction
  distance: real('distance').notNull(), // Size in grid units (radius for circle, length for ray/cone)
  direction: real('direction'), // Rotation for cones/rays (degrees, 0 = right, 90 = down)
  angle: real('angle'), // Width for cones (default 53 for standard D&D cone)
  width: real('width'), // For rays/rectangles
  // Appearance
  color: text('color').notNull().default('#ff0000'),
  fillAlpha: real('fill_alpha').notNull().default(0.3),
  borderColor: text('border_color'),
  // Ownership and visibility
  hidden: boolean('hidden').notNull().default(false),
  ownerId: uuid('owner_id').references(() => users.id),
  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
