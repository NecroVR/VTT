import { pgTable, text, timestamp, uuid, boolean, jsonb, unique } from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns.js';
import { users } from './users.js';

export const itemTemplates = pgTable('item_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull().references(() => users.id),

  // Template identity
  systemId: text('system_id').notNull(),  // Game system this template belongs to
  templateId: text('template_id').notNull(),  // Unique template identifier
  name: text('name').notNull(),
  category: text('category').notNull(),  // weapon, armor, spell, etc.
  extends: text('extends'),  // Parent template ID for inheritance

  // Template definition (JSONB)
  fields: jsonb('fields').notNull().default([]),
  computedFields: jsonb('computed_fields').notNull().default([]),
  sections: jsonb('sections').notNull().default([]),
  rolls: jsonb('rolls').notNull().default([]),
  actions: jsonb('actions').notNull().default([]),
  physical: jsonb('physical'),
  equippable: jsonb('equippable'),
  activation: jsonb('activation'),
  consumes: jsonb('consumes'),
  effects: jsonb('effects').notNull().default([]),
  container: jsonb('container'),

  // Sharing
  shared: boolean('shared').notNull().default(false),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraint on (campaignId, templateId) to prevent duplicates
  uniqueTemplatePerCampaign: unique('unique_template_per_campaign').on(table.campaignId, table.templateId),
}));
