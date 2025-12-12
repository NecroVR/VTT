import { pgTable, text, timestamp, uuid, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { modules } from './modules.js';
import { sql } from 'drizzle-orm';

/**
 * Module Entities table
 * Stores entity metadata with validation status
 */
export const moduleEntities = pgTable('module_entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),

  // Entity Identity
  entityId: text('entity_id').notNull(),
  entityType: text('entity_type').notNull(),

  // Basic Metadata
  name: text('name').notNull(),
  description: text('description'),
  img: text('img'),

  // Template Reference
  templateId: text('template_id'),

  // Source Tracking
  sourcePath: text('source_path'),
  sourceLineNumber: integer('source_line_number'),

  // Validation Status
  validationStatus: text('validation_status').notNull().default('pending'),
  validationErrors: jsonb('validation_errors').default([]),

  // Full-text Search
  searchText: text('search_text'),
  tags: text('tags').array(),

  // Organization
  folderId: text('folder_id'),
  sort: integer('sort').notNull().default(0),

  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  moduleIdx: index('idx_module_entities_module').on(table.moduleId),
  entityTypeIdx: index('idx_module_entities_type').on(table.entityType),
  searchIdx: index('idx_module_entities_search').using(
    'gin',
    sql`to_tsvector('english', ${table.searchText})`
  ),
}));
