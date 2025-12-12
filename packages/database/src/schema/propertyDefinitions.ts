import { pgTable, text, timestamp, uuid, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

/**
 * Property Definitions table
 * Registry of known properties per game system for validation and UI
 */
export const propertyDefinitions = pgTable('property_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Scope
  gameSystemId: text('game_system_id').notNull(),
  entityType: text('entity_type').notNull(),

  // Property Definition
  propertyKey: text('property_key').notNull(),
  propertyPath: text('property_path').array(),
  name: text('name').notNull(),
  description: text('description'),

  // Type Constraints
  valueType: text('value_type').notNull(),
  isRequired: boolean('is_required').notNull().default(false),
  isArray: boolean('is_array').notNull().default(false),

  // Validation Rules
  validation: jsonb('validation').default({}),
  defaultValue: jsonb('default_value'),
  options: jsonb('options').default([]),

  // UI Hints
  fieldType: text('field_type'),
  placeholder: text('placeholder'),
  section: text('section'),
  sort: integer('sort').notNull().default(0),

  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
