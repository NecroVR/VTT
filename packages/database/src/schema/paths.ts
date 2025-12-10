import { pgTable, text, timestamp, uuid, real, jsonb, boolean, index } from 'drizzle-orm/pg-core';
import { scenes } from './scenes.js';

/**
 * Legacy paths table - kept for backward compatibility
 * New implementations should use pathPoints and pathSettings tables instead
 */
export const paths = pgTable('paths', {
  id: uuid('id').primaryKey().defaultRandom(),
  sceneId: uuid('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
  // Path properties
  name: text('name').notNull().default('New Path'),
  nodes: jsonb('nodes').notNull(), // Array of {x, y} coordinates, minimum 2 nodes
  speed: real('speed').notNull().default(50), // Units per second
  loop: boolean('loop').notNull().default(true),
  // Object assignment
  assignedObjectId: uuid('assigned_object_id'),
  assignedObjectType: text('assigned_object_type'), // 'token' | 'light'
  // Visibility (GM-only visibility of path line)
  visible: boolean('visible').notNull().default(true),
  color: text('color').notNull().default('#ffff00'), // Yellow
  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  sceneIdIdx: index('paths_scene_id_idx').on(table.sceneId),
  assignedObjectIdIdx: index('paths_assigned_object_id_idx').on(table.assignedObjectId),
}));
