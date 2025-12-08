import { pgTable, text, timestamp, uuid, real, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { scenes } from './scenes.js';

export const ambientLights = pgTable('ambient_lights', {
  id: uuid('id').primaryKey().defaultRandom(),
  sceneId: uuid('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
  // Position
  x: real('x').notNull(),
  y: real('y').notNull(),
  rotation: real('rotation').notNull().default(0),
  // Light configuration
  bright: real('bright').notNull().default(20),
  dim: real('dim').notNull().default(40),
  angle: real('angle').notNull().default(360),
  color: text('color').notNull().default('#ffffff'),
  alpha: real('alpha').notNull().default(0.5),
  // Animation
  animationType: text('animation_type'),
  animationSpeed: integer('animation_speed').notNull().default(5),
  animationIntensity: integer('animation_intensity').notNull().default(5),
  animationReverse: boolean('animation_reverse').notNull().default(false),
  // Settings
  walls: boolean('walls').notNull().default(true),
  vision: boolean('vision').notNull().default(false),
  snapToGrid: boolean('snap_to_grid').notNull().default(false),
  // Foundry VTT Advanced Settings
  negative: boolean('negative').notNull().default(false),
  priority: integer('priority').notNull().default(0),
  luminosity: real('luminosity').notNull().default(0.5),
  saturation: real('saturation').notNull().default(0),
  contrast: real('contrast').notNull().default(0),
  shadows: real('shadows').notNull().default(0),
  attenuation: real('attenuation').notNull().default(0.5),
  coloration: integer('coloration').notNull().default(1),
  darknessMin: real('darkness_min').notNull().default(0),
  darknessMax: real('darkness_max').notNull().default(1),
  hidden: boolean('hidden').notNull().default(false),
  elevation: real('elevation').notNull().default(0),
  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
