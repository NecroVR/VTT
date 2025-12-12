import { pgTable, text, timestamp, uuid, boolean, jsonb, numeric, index } from 'drizzle-orm/pg-core';
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
