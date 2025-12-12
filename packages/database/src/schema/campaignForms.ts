import { pgTable, timestamp, uuid, text, integer, index, unique } from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns.js';
import { forms } from './forms.js';

/**
 * Campaign Forms table
 * Maps which forms are used in which campaigns, with priority for resolution
 */
export const campaignForms = pgTable('campaign_forms', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Association
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  formId: uuid('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
  entityType: text('entity_type').notNull(), // 'actor', 'item', etc.

  // Priority for form resolution (higher = more priority)
  priority: integer('priority').notNull().default(0),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  campaignIdIdx: index('idx_campaign_forms_campaign').on(table.campaignId),
  campaignEntityTypeIdx: index('idx_campaign_forms_campaign_entity').on(table.campaignId, table.entityType),
  campaignFormUnique: unique('unq_campaign_forms_campaign_form').on(table.campaignId, table.formId),
}));
