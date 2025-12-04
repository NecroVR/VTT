import { pgTable, text, timestamp, uuid, boolean, real, jsonb } from 'drizzle-orm/pg-core';
import { games } from './games';
import { scenes } from './scenes';
import { actors } from './actors';
import { users } from './users';

export const tokens = pgTable('tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  sceneId: uuid('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id').references(() => actors.id),
  name: text('name').notNull(),
  imageUrl: text('image_url'),
  // Position and orientation
  x: real('x').notNull().default(0),
  y: real('y').notNull().default(0),
  width: real('width').notNull().default(1),
  height: real('height').notNull().default(1),
  elevation: real('elevation').notNull().default(0),
  rotation: real('rotation').notNull().default(0),
  locked: boolean('locked').notNull().default(false),
  // Ownership and visibility
  ownerId: uuid('owner_id').references(() => users.id),
  visible: boolean('visible').notNull().default(true),
  // Vision
  vision: boolean('vision').notNull().default(false),
  visionRange: real('vision_range').notNull().default(0),
  // Bars (HP display, etc.)
  bars: jsonb('bars').notNull().default({}),
  // Light emission
  lightBright: real('light_bright').notNull().default(0),
  lightDim: real('light_dim').notNull().default(0),
  lightColor: text('light_color'),
  lightAngle: real('light_angle').notNull().default(360),
  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
