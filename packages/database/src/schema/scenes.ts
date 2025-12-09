import { pgTable, text, timestamp, uuid, boolean, integer, real, jsonb } from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns.js';

export const scenes = pgTable('scenes', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  active: boolean('active').notNull().default(false),
  // Background
  backgroundImage: text('background_image'),
  backgroundWidth: integer('background_width'),
  backgroundHeight: integer('background_height'),
  // Grid configuration
  gridType: text('grid_type').notNull().default('square'),
  gridSize: integer('grid_size').notNull().default(100),
  gridWidth: integer('grid_width').notNull().default(100),
  gridHeight: integer('grid_height').notNull().default(100),
  gridColor: text('grid_color').notNull().default('#000000'),
  gridAlpha: real('grid_alpha').notNull().default(0.2),
  gridVisible: boolean('grid_visible').notNull().default(true),
  gridLineWidth: real('grid_line_width').notNull().default(1),
  gridDistance: real('grid_distance').notNull().default(5),
  gridUnits: text('grid_units').notNull().default('ft'),
  // Vision settings
  tokenVision: boolean('token_vision').notNull().default(true),
  fogExploration: boolean('fog_exploration').notNull().default(true),
  globalLight: boolean('global_light').notNull().default(true),
  darkness: real('darkness').notNull().default(0),
  // View settings
  initialX: real('initial_x'),
  initialY: real('initial_y'),
  initialScale: real('initial_scale').notNull().default(1),
  // Metadata
  navOrder: integer('nav_order').notNull().default(0),
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
