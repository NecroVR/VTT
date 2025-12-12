import { pgTable, text, timestamp, uuid, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';

/**
 * Modules table
 * Stores module metadata and validation status
 */
export const modules = pgTable('modules', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Module Identity
  moduleId: text('module_id').notNull(),
  gameSystemId: text('game_system_id').notNull(),
  name: text('name').notNull(),
  version: text('version').notNull(),
  author: text('author'),
  authorUserId: uuid('author_user_id').references(() => users.id, { onDelete: 'set null' }),
  description: text('description'),

  // Module Type
  moduleType: text('module_type').notNull().default('content'),

  // Source Tracking
  sourcePath: text('source_path'),
  sourceHash: text('source_hash'),

  // Dependencies
  dependencies: text('dependencies').array().default([]),

  // Validation Status
  validationStatus: text('validation_status').notNull().default('pending'),
  validationErrors: jsonb('validation_errors').default([]),
  validatedAt: timestamp('validated_at'),

  // Status Flags
  isActive: boolean('is_active').notNull().default(true),
  isLocked: boolean('is_locked').notNull().default(false),
  isOfficial: boolean('is_official').notNull().default(false),

  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  gameSystemIdx: index('idx_modules_game_system').on(table.gameSystemId),
  validationStatusIdx: index('idx_modules_validation_status').on(table.validationStatus),
}));
