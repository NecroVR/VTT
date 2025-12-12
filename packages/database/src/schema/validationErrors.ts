import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { modules } from './modules.js';
import { moduleEntities } from './moduleEntities.js';

/**
 * Validation Errors table
 * Tracks validation errors for user resolution
 */
export const validationErrors = pgTable('validation_errors', {
  id: uuid('id').primaryKey().defaultRandom(),

  // References
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
  entityId: uuid('entity_id').references(() => moduleEntities.id, { onDelete: 'cascade' }),

  // Error Details
  errorType: text('error_type').notNull(),
  severity: text('severity').notNull().default('error'),
  propertyKey: text('property_key'),
  message: text('message').notNull(),
  details: jsonb('details').default({}),

  // Source Location
  sourcePath: text('source_path'),
  sourceLineNumber: integer('source_line_number'),
  sourceColumn: integer('source_column'),

  // Resolution Tracking
  isResolved: boolean('is_resolved').notNull().default(false),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: uuid('resolved_by'),
  resolutionNote: text('resolution_note'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  unresolvedIdx: index('idx_validation_errors_unresolved').on(table.moduleId, table.isResolved),
}));
