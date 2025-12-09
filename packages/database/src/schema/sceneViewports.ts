import { pgTable, timestamp, uuid, real, unique } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { scenes } from './scenes.js';

export const sceneViewports = pgTable('scene_viewports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sceneId: uuid('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
  cameraX: real('camera_x').notNull().default(0),
  cameraY: real('camera_y').notNull().default(0),
  zoom: real('zoom').notNull().default(1),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userSceneUnique: unique().on(table.userId, table.sceneId),
}));
