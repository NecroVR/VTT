import { pgTable, text, timestamp, uuid, real, jsonb, boolean, integer, index, unique } from 'drizzle-orm/pg-core';
import { scenes } from './scenes.js';

/**
 * PathPoints table - Individual points that make up a path
 * Points with the same pathName form a complete path when ordered by pathIndex
 * Visual properties (color, visible) are stored on each point; use first point's values for the whole path
 */
export const pathPoints = pgTable('path_points', {
  id: uuid('id').primaryKey().defaultRandom(),
  sceneId: uuid('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
  // Path identification
  pathName: text('path_name').notNull(), // Name of the path this point belongs to (case-sensitive)
  pathIndex: integer('path_index').notNull(), // Order of this point in the path (positive integer)
  // Point position
  x: real('x').notNull(),
  y: real('y').notNull(),
  // Visual properties for the path (stored on each point, use first point's values for the whole path)
  color: text('color').notNull().default('#ffff00'),
  visible: boolean('visible').notNull().default(true),
  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  sceneIdIdx: index('path_points_scene_id_idx').on(table.sceneId),
  pathNameIdx: index('path_points_path_name_idx').on(table.pathName),
  scenePathNameIdx: index('path_points_scene_path_name_idx').on(table.sceneId, table.pathName),
  // Ensure unique combination of pathName + pathIndex per scene
  uniquePathIndex: unique('path_points_path_name_index_unique').on(table.sceneId, table.pathName, table.pathIndex),
}));
