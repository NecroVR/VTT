import { pgTable, text, timestamp, uuid, boolean, jsonb, numeric, integer, index, unique } from 'drizzle-orm/pg-core';
import { users } from './users.js';

/**
 * Forms table
 * Stores form templates for rendering entity sheets (actors, items, etc.)
 */
export const forms = pgTable('forms', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Basic Information
  name: text('name').notNull(),
  description: text('description'),

  // System & Entity Association
  gameSystemId: text('game_system_id').notNull(),
  entityType: text('entity_type').notNull(), // 'actor', 'item', etc.
  version: text('version').notNull().default('1.0.0'),

  // Form Definition (JSON)
  layout: jsonb('layout').notNull().default({}), // Top-level layout structure
  fragments: jsonb('fragments').notNull().default({}), // Reusable form fragments
  styles: jsonb('styles').notNull().default({}), // CSS/style definitions
  computedFields: jsonb('computed_fields').notNull().default({}), // Computed field definitions
  scripts: jsonb('scripts').notNull().default({}), // JavaScript/behavior scripts

  // Flags
  isDefault: boolean('is_default').notNull().default(false), // Default form for this entity type
  isLocked: boolean('is_locked').notNull().default(false), // Prevent editing

  // Marketplace Fields
  visibility: text('visibility').notNull().default('private'), // 'private', 'public', 'unlisted'
  licenseType: text('license_type').notNull().default('free'), // 'free', 'premium', 'subscription'
  price: numeric('price', { precision: 10, scale: 2 }).default('0.00'), // Price in USD
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  gameSystemIdx: index('idx_forms_game_system').on(table.gameSystemId),
  entityTypeIdx: index('idx_forms_entity_type').on(table.entityType),
  ownerIdx: index('idx_forms_owner').on(table.ownerId),
  visibilityIdx: index('idx_forms_visibility').on(table.visibility),
}));

/**
 * Form Versions table
 * Stores historical versions of forms for rollback and comparison
 */
export const formVersions = pgTable('form_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  layout: jsonb('layout').notNull().default([]),
  fragments: jsonb('fragments').default([]),
  computedFields: jsonb('computed_fields').default([]),
  styles: jsonb('styles').default({}),
  scripts: jsonb('scripts').default([]),
  changeNotes: text('change_notes'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  formIdIdx: index('form_versions_form_id_idx').on(table.formId),
  createdAtIdx: index('form_versions_created_at_idx').on(table.createdAt),
  formVersionUnique: unique('form_version_unique').on(table.formId, table.version),
}));
