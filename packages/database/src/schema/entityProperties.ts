import { pgTable, text, timestamp, uuid, integer, boolean, real, jsonb, index } from 'drizzle-orm/pg-core';
import { moduleEntities } from './moduleEntities.js';
import { sql } from 'drizzle-orm';

/**
 * Entity Properties table (EAV Core)
 * The heart of the EAV pattern - stores all entity properties as rows
 */
export const entityProperties = pgTable('entity_properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull().references(() => moduleEntities.id, { onDelete: 'cascade' }),

  // Property Key (supports dot notation)
  propertyKey: text('property_key').notNull(),
  propertyPath: text('property_path').array(),
  propertyDepth: integer('property_depth').notNull().default(0),

  // Value Storage (only one populated based on valueType)
  valueType: text('value_type').notNull(),
  valueString: text('value_string'),
  valueNumber: real('value_number'),
  valueInteger: integer('value_integer'),
  valueBoolean: boolean('value_boolean'),
  valueJson: jsonb('value_json'),
  valueReference: text('value_reference'),

  // Array Support
  arrayIndex: integer('array_index'),
  isArrayElement: boolean('is_array_element').notNull().default(false),

  // Metadata
  sort: integer('sort').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  entityIdx: index('idx_entity_properties_entity').on(table.entityId),
  keyIdx: index('idx_entity_properties_key').on(table.propertyKey),
  pathIdx: index('idx_entity_properties_path').using('gin', table.propertyPath),
}));
