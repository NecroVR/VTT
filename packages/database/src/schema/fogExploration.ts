import { pgTable, uuid, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { scenes } from './scenes.js';
import { users } from './users.js';

/**
 * Fog exploration table
 * Tracks explored and revealed areas for each user in each scene
 * Uses a grid-based approach for simplicity and performance
 */
export const fogExploration = pgTable('fog_exploration', {
  id: uuid('id').primaryKey().defaultRandom(),
  sceneId: uuid('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // Grid-based fog tracking (simpler than polygons)
  // exploredGrid: boolean[][] - true = explored, false = unexplored
  exploredGrid: jsonb('explored_grid').notNull().default('[]'),
  // revealedGrid: boolean[][] - GM-revealed areas (always visible)
  revealedGrid: jsonb('revealed_grid').notNull().default('[]'),
  // Grid cell size in pixels (default 50x50)
  gridCellSize: integer('grid_cell_size').notNull().default(50),
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
