import { pgTable, timestamp, uuid, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns.js';
import { modules } from './modules.js';

/**
 * Campaign-Module Junction table
 * Links campaigns to loaded modules with compatibility enforcement
 */
export const campaignModules = pgTable('campaign_modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),

  // Load Order
  loadOrder: integer('load_order').notNull().default(0),

  // Status
  isActive: boolean('is_active').notNull().default(true),

  // Override Settings
  overrides: jsonb('overrides').default({}),

  // Metadata
  addedAt: timestamp('added_at').defaultNow().notNull(),
  addedBy: uuid('added_by'),
  data: jsonb('data').notNull().default({}),
}, (table) => ({
  campaignIdx: index('idx_campaign_modules_campaign').on(table.campaignId),
}));
